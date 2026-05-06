import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { sendConsultationActivatedEmail } from '@/lib/email/sender';

/** POST /api/consultation/activate — Staff activates a consultation */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 30, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: staffProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['staff', 'admin', 'instructor', 'client_management'];
    if (!staffProfile || !allowedRoles.includes(staffProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { consultationId } = await request.json();
    if (!consultationId) return NextResponse.json({ error: 'consultationId required' }, { status: 400 });

    const admin = createAdminClient();

    const { data: consultation, error } = await admin
      .from('consultations')
      .update({ status: 'active', staff_id: user.id, activated_at: new Date().toISOString() })
      .eq('id', consultationId)
      .eq('status', 'paid')
      .select('*, student:profiles!student_id(full_name, email, phone)')
      .single();

    if (error || !consultation) {
      return NextResponse.json({ error: 'Consultation not found or already active' }, { status: 404 });
    }

    // Insert system message to start the conversation
    await admin.from('consultation_messages').insert({
      consultation_id: consultationId,
      sender_id: user.id,
      content: `Hi ${(consultation as any).student?.full_name?.split(' ')[0] || 'there'}! 👋 I'm here to help you with your face yoga journey. Please feel free to share any concerns, questions, or goals you have in mind. I'm looking forward to our conversation!`,
      content_type: 'system',
      is_read: false,
    });

    // Notification for student
    await admin.from('notifications').insert({
      user_id: consultation.student_id,
      title: '💬 Your Consultation is Active!',
      message: 'A team member is ready to chat with you. Go to your consultation page to start.',
      type: 'consultation_activated',
      is_read: false,
    });

    // Email to student
    try {
      const student = (consultation as any).student;
      if (student?.email) {
        sendConsultationActivatedEmail(student.email, {
          firstName: student.full_name?.split(' ')[0] || 'there',
          consultationId,
        }).catch(() => {});
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, consultation });
  } catch (err: any) {
    console.error('[Consultation] activate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
