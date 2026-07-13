import { NextResponse, NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendMeetingReminder10mEmail } from '@/lib/email/sender';

export async function GET(request: NextRequest) {
  // 1. Authorization check for production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    // Fetch meetings starting in the next 15 minutes
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    const { data: upcomingMeetings, error: fetchErr } = await admin
      .from('meetings')
      .select('*')
      .gte('start_time', now.toISOString())
      .lte('start_time', fifteenMinsFromNow.toISOString());

    if (fetchErr) {
      console.error('[Cron Reminder] Error fetching meetings:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!upcomingMeetings || upcomingMeetings.length === 0) {
      return NextResponse.json({ success: true, message: 'No upcoming meetings starting in the next 15 minutes.' });
    }

    const processedList: string[] = [];

    // Process each meeting
    for (const meeting of upcomingMeetings) {
      let studentsToNotify: { id: string; email: string; full_name: string }[] = [];

      if (meeting.meeting_type === 'one_on_one') {
        if (meeting.student_id) {
          const { data: student } = await admin
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', meeting.student_id)
            .single();

          if (student?.email) {
            studentsToNotify.push(student);
          }
        }
      } else if (meeting.meeting_type === 'group_session') {
        if (meeting.batch_id) {
          const { data: enrollments } = await admin
            .from('batch_enrollments')
            .select('student:profiles!student_id(id, email, full_name)')
            .eq('batch_id', meeting.batch_id)
            .eq('status', 'active');

          if (enrollments) {
            enrollments.forEach((e: any) => {
              if (e.student?.email) {
                studentsToNotify.push(e.student);
              }
            });
          }
        }
      }

      if (studentsToNotify.length === 0) continue;

      // Send reminders in parallel
      await Promise.allSettled(
        studentsToNotify.map(async (student) => {
          // Check if reminder was already sent
          const { data: alreadySent } = await admin
            .from('notifications')
            .select('id')
            .eq('type', 'meeting_reminder_10m')
            .eq('broadcast_id', meeting.id)
            .eq('user_id', student.id)
            .maybeSingle();

          if (alreadySent) {
            // Already sent, skip
            return;
          }

          // Send 10-minute email reminder
          await sendMeetingReminder10mEmail(student.email, {
            studentName: student.full_name || 'Student',
            meetingTitle: meeting.topic,
            zoomLink: meeting.join_url,
            meetingType: meeting.meeting_type,
          }).catch((err: any) => console.error(`[Email] 10m reminder failed for ${student.email}:`, err));

          // Insert in-app notification
          await admin.from('notifications').insert({
            user_id: student.id,
            broadcast_id: meeting.id, // meeting ID acts as unique anchor
            title: '⏳ Class Starts in 10 Mins!',
            message: `"${meeting.topic}" starts in 10 minutes. Grab your face oil or serum and join now for a glowing session! ✨`,
            type: 'meeting_reminder_10m',
            is_read: false,
          }).catch((err: any) => console.error(`[Notification] 10m insert failed for ${student.id}:`, err));

          processedList.push(`${student.email} (${meeting.topic})`);
        })
      );
    }

    return NextResponse.json({
      success: true,
      remindersSentCount: processedList.length,
      recipients: processedList,
    });
  } catch (error: any) {
    console.error('[Cron Reminder] Internal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
