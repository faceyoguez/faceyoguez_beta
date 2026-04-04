'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createServerSupabaseClient, createAdminClient } from '../supabase/server';
import { MeetingWithDetails, Meeting, type RecordedSession } from '../../types/database';
import { getZoomMeetingRecordings, createZoomMeeting } from '../zoom';

export async function getUpcomingMeetingsForStudent(): Promise<MeetingWithDetails[]> {
  noStore();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Let's allow meetings that started within the last 2 hours (so active meetings don't disappear)
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      host:host_id(*),
      student:student_id(*),
      batch:batch_id(*)
    `)
    .gte('start_time', windowStart)
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
    .select('role')
    .eq('id', user.id)
    .single();

  // Let's allow meetings that started within the last 2 hours
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('meetings')
    .select(`
      *,
      host:host_id(*),
      student:student_id(*),
      batch:batch_id(*)
    `);

  // If not admin, restrict to their own meetings
  if (profile?.role !== 'admin') {
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
  batchEndDate: string
): Promise<RecordedSession[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Recordings are only accessible while the batch is running
  if (new Date() > new Date(batchEndDate)) return [];

  const admin = createAdminClient();

  // Get all past group meetings for this batch
  const { data: meetings } = await admin
    .from('meetings')
    .select('id, topic, start_time, duration_minutes, zoom_meeting_id')
    .eq('batch_id', batchId)
    .eq('meeting_type', 'group_session')
    .lt('start_time', new Date().toISOString())
    .order('start_time', { ascending: false });

  if (!meetings || meetings.length === 0) return [];

  // Fetch Zoom cloud recordings for each past meeting in parallel
  const sessions = await Promise.all(
    meetings.map(async (meeting) => {
      const recordings = await getZoomMeetingRecordings(meeting.zoom_meeting_id);

      // Prefer the shared-screen-with-speaker view; fall back to any completed file
      const mainFile =
        recordings?.recording_files?.find(
          (f) =>
            f.recording_type === 'shared_screen_with_speaker_view' &&
            f.status === 'completed'
        ) ||
        recordings?.recording_files?.find((f) => f.status === 'completed') ||
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

  return data as Meeting;
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

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/student/dashboard');
  revalidatePath('/student/one-on-one');

  return meeting as Meeting;
}
