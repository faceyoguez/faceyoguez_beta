'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createServerSupabaseClient } from '../supabase/server';
import { MeetingWithDetails, Meeting } from '../../types/database';

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
