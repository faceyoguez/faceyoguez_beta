'use server';

import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { createServerSupabaseClient, createAdminClient } from '../supabase/server';
import { MeetingWithDetails, Meeting, type RecordedSession } from '../../types/database';
import { getZoomMeetingRecordings, createZoomMeeting } from '../zoom';
import { sendMeetingInviteEmail } from '../email';
import { sendBrandedMeetingInviteEmail, sendMeetingStartedEmail } from '../email/sender';

export async function getUpcomingMeetingsForStudent(): Promise<MeetingWithDetails[]> {
  noStore();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get student's active batch enrollment
  const { data: enrollment } = await supabase
    .from('batch_enrollments')
    .select('batch_id')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  // Allow meetings that started within the last 2 hours
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('meetings')
    .select(`
      id, topic, start_time, duration_minutes, meeting_type, join_url, start_url, zoom_meeting_id, batch_id, student_id, host_id,
      host:host_id(id, full_name, avatar_url, role),
      student:student_id(id, full_name, avatar_url),
      batch:batch_id(id, name, start_date, end_date)
    `)
    .gte('start_time', windowStart);

  // Filter: 1:1 meetings for this student OR group sessions for their batch
  const filters = [`student_id.eq.${user.id}`];
  if (enrollment?.batch_id) {
    filters.push(`batch_id.eq.${enrollment.batch_id}`);
  }

  const { data, error } = await query
    .or(filters.join(','))
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Failed to get student meetings', error);
    throw new Error('Failed to get meetings');
  }

  return data as MeetingWithDetails[];
}

export async function getInstructorUpcomingMeetings(): Promise<MeetingWithDetails[]> {
  noStore();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Fetch user role to determine if they should see all meetings or only theirs
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_master_instructor')
    .eq('id', user.id)
    .single();

  // Let's allow meetings that started within the last 2 hours
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('meetings')
    .select(`
      id, topic, start_time, duration_minutes, meeting_type, join_url, start_url, zoom_meeting_id, batch_id, student_id, host_id,
      host:host_id(id, full_name, avatar_url, role),
      student:student_id(id, full_name, avatar_url),
      batch:batch_id(id, name, start_date, end_date)
    `);

  const seesAll = profile && (
      ['admin', 'client_management', 'staff'].includes(profile.role) ||
      profile.is_master_instructor === true
  );

  // If not admin/staff/master, restrict to their own meetings
  if (!seesAll) {
    query = query.eq('host_id', user.id);
  }

  const { data, error } = await query
    .gte('start_time', windowStart)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Failed to get instructor/admin meetings', error);
    throw new Error('Failed to get meetings');
  }

  return data as MeetingWithDetails[];
}

interface CreateMeetingDBPayload {
  host_id: string;
  student_id?: string;
  batch_id?: string;
  zoom_meeting_id: string;
  topic: string;
  start_time: string;
  duration_minutes: number;
  join_url: string;
  start_url: string;
  meeting_type: 'one_on_one' | 'group_session';
}

/**
 * Fetch all recorded sessions for a batch.
 * Returns recordings from Zoom Cloud for every past group meeting in this batch.
 * Access is gated — returns empty if the batch has already ended.
 */
export async function getBatchRecordedSessions(
  batchId: string,
  batchEndDate: string,
  limit = 10
): Promise<RecordedSession[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Recordings are only accessible while the batch is running
  if (new Date() > new Date(batchEndDate)) return [];

  const admin = createAdminClient();
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // Get past group meetings for this batch, limited to avoid excessive API calls
  // Also filter by meetings that started within the last 5 days
  const { data: meetings } = await admin
    .from('meetings')
    .select('id, topic, start_time, duration_minutes, zoom_meeting_id')
    .eq('batch_id', batchId)
    .eq('meeting_type', 'group_session')
    .lt('start_time', now.toISOString())
    .gte('start_time', fiveDaysAgo.toISOString())
    .order('start_time', { ascending: false })
    .limit(limit);

  if (!meetings || meetings.length === 0) return [];

  // Fetch Zoom cloud recordings for each past meeting in parallel
  const sessions = await Promise.all(
    meetings.map(async (meeting: any) => {
      const recordings = await getZoomMeetingRecordings(meeting.zoom_meeting_id);

      // Prefer the shared-screen-with-speaker view; fall back to any completed file
      const mainFile =
        recordings?.recording_files?.find(
          (f: any) =>
            f.recording_type === 'shared_screen_with_speaker_view' &&
            f.status === 'completed'
        ) ||
        recordings?.recording_files?.find((f: any) => f.status === 'completed') ||
        null;

      // Use actual recording duration when available
      let durationMinutes = meeting.duration_minutes;
      if (mainFile?.recording_start && mainFile?.recording_end) {
        const ms =
          new Date(mainFile.recording_end).getTime() -
          new Date(mainFile.recording_start).getTime();
        durationMinutes = Math.round(ms / 60000);
      }

      return {
        id: meeting.id,
        topic: meeting.topic,
        start_time: meeting.start_time,
        duration_minutes: durationMinutes,
        play_url: mainFile?.play_url ?? null,
        is_available: !!mainFile,
      } satisfies RecordedSession;
    })
  );

  return sessions;
}

export async function saveMeetingToDb(payload: CreateMeetingDBPayload): Promise<Meeting> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('meetings')
    .insert([
      {
        ...payload,
        calendar_event_id: null, // Used for live status tracking
        created_by: user.id,
        updated_by: user.id
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Failed to save meeting', error);
    throw new Error('Failed to save meeting to database');
  }

  // Automated Email Notifications for Group Sessions
  if (payload.meeting_type === 'group_session' && payload.batch_id) {
    const admin = createAdminClient();
    
    // 1. Fetch all students enrolled in the batch
    const { data: enrollments } = await admin
      .from('batch_enrollments')
      .select('student:profiles!student_id(full_name, email)')
      .eq('batch_id', payload.batch_id)
      .eq('status', 'active');

    // 2. Also fetch "new" students in the waiting queue — they bought a plan but haven't
    //    been formally enrolled in a batch yet. They still deserve to receive the invite.
    const { data: queueEntries } = await admin
      .from('waiting_queue')
      .select('student:profiles!student_id(full_name, email)')
      .eq('status', 'waiting');

    // 3. Fetch instructor name
    const { data: host } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', payload.host_id)
      .single();

    // Merge both lists, deduplicate by email
    const allRecipients = new Map<string, { full_name: string; email: string }>();
    for (const e of enrollments || []) {
      const s = e.student as any;
      if (s?.email) allRecipients.set(s.email, s);
    }
    for (const q of queueEntries || []) {
      const s = q.student as any;
      if (s?.email) allRecipients.set(s.email, s);
    }

    if (allRecipients.size > 0) {
      const dateObj = new Date(payload.start_time);
      const meetingDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const meetingTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(payload.topic)}&details=${encodeURIComponent('Face Yoga Live Group Session')}&location=${encodeURIComponent(payload.join_url)}&dates=${dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '')}/${new Date(dateObj.getTime() + payload.duration_minutes * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '')}`;

      // Send emails in parallel
      await Promise.allSettled([...allRecipients.values()].map(async (student) => {
        return sendMeetingInviteEmail({
          to: student.email,
          studentName: student.full_name,
          instructorName: host?.full_name || 'Your Instructor',
          meetingTitle: payload.topic,
          meetingDate,
          meetingTime,
          zoomLink: payload.join_url,
          zoomId: payload.zoom_meeting_id,
          zoomPassword: '',
          calendarLink,
        });
      }));
    }
  }

  // ── Automated Email Notifications for One-on-One Sessions ──────────
  if (payload.meeting_type === 'one_on_one' && payload.student_id) {
    try {
      const admin = createAdminClient();

      // Fetch student profile
      const { data: student } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', payload.student_id)
        .single();

      // Fetch instructor name
      const { data: host } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', payload.host_id)
        .single();

      if (student?.email) {
        const dateObj = new Date(payload.start_time);
        const meetingDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const meetingTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(payload.topic)}&details=${encodeURIComponent('Face Yoga 1-on-1 Session')}&location=${encodeURIComponent(payload.join_url)}&dates=${dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '')}/${new Date(dateObj.getTime() + payload.duration_minutes * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '')}`;

        sendBrandedMeetingInviteEmail(student.email, {
          studentName: student.full_name || 'Student',
          instructorName: host?.full_name || 'Your Instructor',
          meetingTitle: payload.topic,
          meetingDate,
          meetingTime,
          zoomLink: payload.join_url,
          zoomId: payload.zoom_meeting_id,
          zoomPassword: '',
          calendarLink,
          meetingType: 'one_on_one',
        }).catch(err => console.error('[Email] 1-on-1 invite failed:', err));
      }
    } catch (emailErr) {
      console.error('[Email] 1-on-1 meeting invite error (non-fatal):', emailErr);
    }
  }

  return data as Meeting;
}

export async function scheduleGroupSession(batchId: string, startTime: string, topic: string = 'Face Yoga Live Group Session', duration: number = 60): Promise<Meeting> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const zoomMeeting = await createZoomMeeting({
    topic: topic,
    startTime: startTime,
    durationMinutes: duration,
  });

  const admin = createAdminClient();
  const { data: batch } = await admin.from('batches').select('instructor_id, end_date').eq('id', batchId).single();
  const hostId = batch?.instructor_id || user.id;

  // ─── Enroll all "New" (waiting) students into this batch ───────────────────
  // We process every student currently in the "New" queue and move them into this active batch.
  const { data: queueEntries } = await admin
    .from('waiting_queue')
    .select('*')
    .eq('status', 'waiting');

  if (queueEntries && queueEntries.length > 0) {
    const processedIds: string[] = [];
    
    for (const entry of queueEntries) {
      try {
        // Fetch their subscription
        const { data: sub } = await admin
          .from('subscriptions')
          .select('*')
          .eq('id', entry.subscription_id)
          .single();

        if (!sub) {
          // If no subscription, mark as assigned anyway to clear from "New" tab
          // as it's a corrupted record that shouldn't block others.
          processedIds.push(entry.id);
          continue;
        }

        // Determine activation details
        let effectiveEndDate = sub.end_date;
        if (sub.status === 'pending' || !sub.start_date) {
          const start = new Date(startTime);
          const end = new Date(start);
          end.setMonth(start.getMonth() + (sub.duration_months || 1));
          effectiveEndDate = end.toISOString().split('T')[0];

          await admin
            .from('subscriptions')
            .update({ 
              status: 'active', 
              start_date: startTime.split('T')[0], 
              end_date: effectiveEndDate 
            })
            .eq('id', sub.id);
        }

        // Clean up stale trial access (real enrollment supersedes trial)
        await admin
          .from('batch_enrollments')
          .delete()
          .eq('student_id', entry.student_id)
          .eq('is_trial_access', true);

        // Check if already active in THIS batch
        const { data: existing } = await admin
          .from('batch_enrollments')
          .select('id')
          .eq('student_id', entry.student_id)
          .eq('batch_id', batchId)
          .eq('status', 'active')
          .maybeSingle();

        if (!existing) {
          // Enroll into this batch
          await admin.from('batch_enrollments').insert({
            batch_id: batchId,
            student_id: entry.student_id,
            subscription_id: entry.subscription_id,
            status: 'active',
            effective_end_date: effectiveEndDate,
            is_extended: false,
            is_trial_access: false,
          });

          // Increment batch count
          await admin.rpc('increment_batch_count', { batch_id: batchId }).catch(() => {});

          // Notify student
          await admin.from('notifications').insert({
            user_id: entry.student_id,
            title: 'Welcome to your new session!',
            message: `A session "${topic}" has been scheduled. You are now enrolled and will receive details via email.`,
            type: 'batch_enrollment',
            is_read: false,
          });
        }

        processedIds.push(entry.id);
      } catch (studentErr) {
        console.error(`Error processing student ${entry.student_id} in queue:`, studentErr);
      }
    }

    // Bulk clear from queue
    if (processedIds.length > 0) {
      await admin.from('waiting_queue').update({ status: 'assigned' }).in('id', processedIds);
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  const meeting = await saveMeetingToDb({
    host_id: hostId,
    batch_id: batchId,
    zoom_meeting_id: zoomMeeting.id.toString(),
    topic: zoomMeeting.topic,
    start_time: zoomMeeting.start_time,
    duration_minutes: zoomMeeting.duration,
    join_url: zoomMeeting.join_url,
    start_url: zoomMeeting.start_url,
    meeting_type: 'group_session'
  });

  revalidatePath('/instructor/groups');
  revalidatePath('/staff/groups');
  revalidatePath('/student/group-session');

  return meeting as Meeting;
}

export async function scheduleOneOnOne(startTime: string, topic: string = 'One-on-One Session'): Promise<Meeting> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const admin = createAdminClient();

  // 1. Find active subscription
  const { data: sub } = await admin
    .from('subscriptions')
    .select('assigned_instructor_id')
    .eq('student_id', user.id)
    .eq('plan_type', 'one_on_one')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let hostId = sub?.assigned_instructor_id;

  // 2. If no instructor assigned, fallback to master instructor
  if (!hostId) {
    const { data: masterInstructor } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'instructor')
      .eq('is_master_instructor', true)
      .limit(1)
      .maybeSingle();
    
    hostId = masterInstructor?.id;
  }

  if (!hostId) {
    throw new Error('No instructor available for scheduling. Please reach out to support.');
  }

  // 3. Create Zoom Meeting
  const zoomMeeting = await createZoomMeeting({
    topic: topic,
    startTime: startTime,
    durationMinutes: 45,
  });

  // 4. Save to DB
  const meeting = await saveMeetingToDb({
    host_id: hostId,
    student_id: user.id,
    zoom_meeting_id: zoomMeeting.id.toString(),
    topic: zoomMeeting.topic,
    start_time: zoomMeeting.start_time,
    duration_minutes: zoomMeeting.duration,
    join_url: zoomMeeting.join_url,
    start_url: zoomMeeting.start_url,
    meeting_type: 'one_on_one'
  });

  revalidatePath('/student/dashboard');
  revalidatePath('/student/one-on-one');
  revalidatePath('/instructor/one-on-one');

  return meeting as Meeting;
}

export async function startMeeting(meetingId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('meetings')
    .update({ 
      calendar_event_id: 'LIVE',
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', meetingId);

  if (error) {
    console.error('Failed to start meeting', error);
    return { success: false, error: error.message };
  }

  // ── Send "Session is Live!" notifications ──────────────────────────
  try {
    const admin = createAdminClient();

    // Fetch the full meeting details
    const { data: meeting } = await admin
      .from('meetings')
      .select('id, topic, join_url, meeting_type, batch_id, student_id')
      .eq('id', meetingId)
      .single();

    if (meeting) {
      const recipients: { email: string; full_name: string; id: string }[] = [];

      if (meeting.meeting_type === 'one_on_one' && meeting.student_id) {
        // Notify the single student
        const { data: student } = await admin
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', meeting.student_id)
          .single();
        if (student?.email) recipients.push(student);
      } else if (meeting.meeting_type === 'group_session' && meeting.batch_id) {
        // Notify all enrolled students in the batch
        const { data: enrollments } = await admin
          .from('batch_enrollments')
          .select('student:profiles!student_id(id, full_name, email)')
          .eq('batch_id', meeting.batch_id)
          .eq('status', 'active');

        for (const e of enrollments || []) {
          const s = e.student as any;
          if (s?.email) recipients.push(s);
        }
      }

      // Send emails + in-app notifications in parallel
      await Promise.allSettled(recipients.map(async (student) => {
        // Email notification
        sendMeetingStartedEmail(student.email, {
          studentName: student.full_name || 'Student',
          meetingTitle: meeting.topic,
          zoomLink: meeting.join_url,
          meetingType: meeting.meeting_type as 'one_on_one' | 'group_session',
        }).catch(err => console.error(`[Email] Meeting-started failed for ${student.email}:`, err));

        // In-app notification
        await admin.from('notifications').insert({
          user_id: student.id,
          title: '🔴 Session is LIVE!',
          message: `"${meeting.topic}" has started. Join now!`,
          type: 'meeting_started',
          is_read: false,
        }).catch(() => {});
      }));
    }
  } catch (notifyErr) {
    // Non-fatal: don't fail the start if notifications fail
    console.error('[startMeeting] Notification error (non-fatal):', notifyErr);
  }

  revalidatePath('/instructor/dashboard');
  revalidatePath('/student/dashboard');
  revalidatePath('/instructor/groups');
  revalidatePath('/student/group-session');
  revalidatePath('/student/one-on-one');
  
  return { success: true };
}

export async function getLatestMeetingForBatch(batchId: string): Promise<MeetingWithDetails | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      id, topic, start_time, duration_minutes, meeting_type, join_url, start_url, zoom_meeting_id, batch_id, student_id, host_id,
      host:host_id(id, full_name, avatar_url, role),
      student:student_id(id, full_name, avatar_url),
      batch:batch_id(id, name, start_date, end_date)
    `)
    .eq('batch_id', batchId)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to get latest batch meeting', error);
    return null;
  }
  return data as MeetingWithDetails;
}
