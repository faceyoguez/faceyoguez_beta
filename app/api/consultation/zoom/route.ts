import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { createZoomMeeting } from '@/lib/zoom';
import { sendConsultationZoomEmail } from '@/lib/email/sender';

/** POST /api/consultation/zoom — Create Zoom meeting for a consultation */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 10, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: staffProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const allowedRoles = ['staff', 'admin', 'instructor', 'client_management'];
    if (!staffProfile || !allowedRoles.includes(staffProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { consultationId, startTime, durationMinutes = 30, topic } = await request.json();
    if (!consultationId || !startTime) {
      return NextResponse.json({ error: 'consultationId and startTime required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get consultation + student details
    const { data: consultation } = await admin
      .from('consultations')
      .select('*, student:profiles!student_id(full_name, email, phone)')
      .eq('id', consultationId)
      .single();

    if (!consultation) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    if (!['paid', 'active'].includes(consultation.status)) {
      return NextResponse.json({ error: 'Consultation not in a valid state for Zoom' }, { status: 400 });
    }

    const student = (consultation as any).student;
    const meetingTopic = topic || `Faceyoguez Consultation — ${student?.full_name || 'Student'}`;

    // Create Zoom meeting
    const zoomMeeting = await createZoomMeeting({
      topic: meetingTopic,
      startTime,
      durationMinutes,
    });

    // Save to DB
    const { data: zoomCall, error: zoomInsertError } = await admin
      .from('consultation_zoom_calls')
      .insert({
        consultation_id: consultationId,
        zoom_meeting_id: String(zoomMeeting.id),
        topic: meetingTopic,
        join_url: zoomMeeting.join_url,
        start_url: zoomMeeting.start_url,
        password: zoomMeeting.password || null,
        start_time: startTime,
        duration_minutes: durationMinutes,
        created_by: user.id,
      })
      .select()
      .single();

    if (zoomInsertError) {
      console.error('[Consultation Zoom] DB insert error:', zoomInsertError);
      return NextResponse.json({ error: 'Zoom created but failed to save' }, { status: 500 });
    }

    // Send system message in consultation chat with the Zoom link
    const startDate = new Date(startTime);
    const dateStr = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    await admin.from('consultation_messages').insert({
      consultation_id: consultationId,
      sender_id: user.id,
      content: `📅 A Zoom consultation call has been scheduled!\n\n📆 Date: ${dateStr}\n⏰ Time: ${timeStr} (IST)\n🔗 Join Link: ${zoomMeeting.join_url}${zoomMeeting.password ? `\n🔑 Password: ${zoomMeeting.password}` : ''}\n\nPlease join 2-3 minutes early. Looking forward to speaking with you! 🌸`,
      content_type: 'system',
      is_read: false,
    });

    // Notification for student
    await admin.from('notifications').insert({
      user_id: consultation.student_id,
      title: '📅 Zoom Call Scheduled!',
      message: `Your consultation Zoom call is scheduled for ${dateStr} at ${timeStr}. Check your email for the join link.`,
      type: 'consultation_zoom_scheduled',
      is_read: false,
    });

    // Email to student with Zoom details
    try {
      if (student?.email) {
        sendConsultationZoomEmail(student.email, {
          firstName: student.full_name?.split(' ')[0] || 'there',
          joinUrl: zoomMeeting.join_url,
          password: zoomMeeting.password || '',
          startTime,
          durationMinutes,
          topic: meetingTopic,
        }).catch(() => {});
      }
    } catch { /* non-fatal */ }

    // WhatsApp share link (returned to client for staff to copy)
    const whatsappPhone = student?.phone?.replace(/\D/g, '');
    const whatsappMessage = encodeURIComponent(
      `Hi ${student?.full_name?.split(' ')[0] || 'there'} 🌸! Your Faceyoguez consultation call is scheduled for ${dateStr} at ${timeStr}.\n\nJoin link: ${zoomMeeting.join_url}${zoomMeeting.password ? `\nPassword: ${zoomMeeting.password}` : ''}\n\nSee you soon! ✨`
    );
    const whatsappUrl = whatsappPhone
      ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
      : `https://wa.me/?text=${whatsappMessage}`;

    return NextResponse.json({
      success: true,
      zoomCall,
      joinUrl: zoomMeeting.join_url,
      startUrl: zoomMeeting.start_url,
      password: zoomMeeting.password,
      whatsappUrl,
    });
  } catch (err: any) {
    console.error('[Consultation Zoom] error:', err);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? err.message : 'Failed to create Zoom meeting' },
      { status: 500 }
    );
  }
}
