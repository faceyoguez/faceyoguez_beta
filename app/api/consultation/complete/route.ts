import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { sendConsultationPostNudgeEmail } from '@/lib/email/sender';

/** POST /api/consultation/complete — Staff marks consultation as completed */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 20, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: staffProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const allowedRoles = ['staff', 'admin', 'instructor', 'client_management'];
    if (!staffProfile || !allowedRoles.includes(staffProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { consultationId, notes } = await request.json();
    if (!consultationId) return NextResponse.json({ error: 'consultationId required' }, { status: 400 });

    const admin = createAdminClient();

    const { data: consultation, error } = await admin
      .from('consultations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', consultationId)
      .in('status', ['paid', 'active'])
      .select('*, student:profiles!student_id(full_name, email, phone)')
      .single();

    if (error || !consultation) {
      return NextResponse.json({ error: 'Consultation not found or already completed' }, { status: 404 });
    }

    // Insert completion system message
    await admin.from('consultation_messages').insert({
      consultation_id: consultationId,
      sender_id: user.id,
      content: `✅ Our consultation session is now complete! It was wonderful speaking with you. I'll be sending you a summary via email shortly.\n\n💡 Remember, your ₹999 consultation fee can be applied toward any 1-on-1 plan — no extra charge for the credit!\n\nWishing you a beautiful, glowing journey ahead. 🌸`,
      content_type: 'system',
      is_read: false,
    });

    // Notification to student
    const student = (consultation as any).student;
    await admin.from('notifications').insert({
      user_id: consultation.student_id,
      title: '✅ Consultation Complete!',
      message: 'Your consultation is complete. Check your email for a summary + your ₹999 credit can be applied to any 1-on-1 plan!',
      type: 'consultation_completed',
      is_read: false,
    });

    // Post-consultation nudge email
    try {
      if (student?.email) {
        sendConsultationPostNudgeEmail(student.email, {
          firstName: student.full_name?.split(' ')[0] || 'there',
          staffNotes: notes || '',
        }).catch(() => {});
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, consultation });
  } catch (err: any) {
    console.error('[Consultation] complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
