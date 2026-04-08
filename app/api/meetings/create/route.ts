import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { sendMeetingInviteEmail } from '@/lib/email';
import { buildGoogleCalendarLink } from '@/lib/googleCalendar';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only instructors/admins can create meetings
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!callerProfile || !['admin', 'instructor'].includes(callerProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      studentIds,
      zoomLink,
      zoomId,
      zoomPassword,
    } = body;

    if (!title || !startDateTime || !endDateTime || !studentIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── 1. Fetch all student profiles ────────────────────────────────
    const { data: students, error: studentsError } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds);

    if (studentsError || !students?.length) {
      return NextResponse.json({ error: 'Failed to fetch student profiles' }, { status: 500 });
    }

    // ── 2. Build Google Calendar add-to-calendar link ────────────────
    const calendarLink = buildGoogleCalendarLink({
      title,
      startDateTime,
      endDateTime,
      description: `${description || ''}\n\nJoin Zoom: ${zoomLink}\nMeeting ID: ${zoomId}\nPasscode: ${zoomPassword}`,
      location: zoomLink,
    });

    // ── 3. Format date and time for emails ───────────────────────────
    const startDate = new Date(startDateTime);
    const meetingDate = startDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
    const meetingTime = startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

    // ── 4. Send branded email to every student ───────────────────────
    const emailPromises = students.map((student) =>
      sendMeetingInviteEmail({
        to: student.email,
        studentName: student.full_name || 'Student',
        instructorName: callerProfile.full_name || 'Your Instructor',
        meetingTitle: title,
        meetingDate,
        meetingTime,
        zoomLink: zoomLink || '',
        zoomId: zoomId || '',
        zoomPassword: zoomPassword || '',
        calendarLink,
      }).catch((err) => {
        console.error(`Failed to email ${student.email}:`, err);
      })
    );

    await Promise.allSettled(emailPromises);

    // ── 5. Save meeting to Supabase ──────────────────────────────────
    const { data: meeting, error: meetingError } = await admin
      .from('meetings')
      .insert({
        host_id: user.id,
        topic: title,
        start_time: startDateTime,
        duration_minutes: Math.round((new Date(endDateTime).getTime() - startDate.getTime()) / 60000),
        join_url: zoomLink,
        start_url: zoomLink,
        zoom_meeting_id: zoomId || '',
        meeting_type: studentIds.length > 1 ? 'group_session' : 'one_on_one',
        calendar_event_id: null,
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Meeting save error:', meetingError);
      return NextResponse.json({ error: 'Meeting created but failed to save' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meeting,
      emailsSent: students.length,
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
