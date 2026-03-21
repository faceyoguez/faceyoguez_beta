'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

const POLL_CREATOR_ROLES = ['admin', 'instructor', 'staff', 'client_management'];

export interface PollOptionData {
  id: string;
  poll_id: string;
  option_text: string;
  position: number;
  vote_count: number;
}

export interface BatchPollData {
  id: string;
  batch_id: string;
  created_by: string;
  question: string;
  is_closed: boolean;
  created_at: string;
  options: PollOptionData[];
  total_votes: number;
  /** The option_id the current user voted for, or null if not voted */
  my_vote_option_id: string | null;
  creator: { full_name: string; role: string } | null;
}

export async function createBatchPoll(
  batchId: string,
  question: string,
  options: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_master_instructor')
    .eq('id', user.id)
    .single();

  const canCreate =
    POLL_CREATOR_ROLES.includes(profile?.role || '') || profile?.is_master_instructor;
  if (!canCreate) return { success: false, error: 'You do not have permission to create polls.' };

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  if (!question.trim()) return { success: false, error: 'Question is required.' };
  if (validOptions.length < 2) return { success: false, error: 'At least 2 options are required.' };

  // Create poll
  const { data: poll, error: pollErr } = await admin
    .from('batch_polls')
    .insert({ batch_id: batchId, created_by: user.id, question: question.trim() })
    .select()
    .single();

  if (pollErr || !poll) return { success: false, error: pollErr?.message || 'Failed to create poll' };

  // Create options
  const { error: optsErr } = await admin.from('batch_poll_options').insert(
    validOptions.map((text, i) => ({ poll_id: poll.id, option_text: text, position: i }))
  );
  if (optsErr) return { success: false, error: optsErr.message };

  // Insert a poll-type message so it appears in the chat stream
  const { error: msgErr } = await admin.from('batch_messages').insert({
    batch_id: batchId,
    sender_id: user.id,
    content: question.trim(),
    content_type: 'text',
    message_type: 'poll',
    poll_id: poll.id,
  });
  if (msgErr) return { success: false, error: msgErr.message };

  return { success: true };
}

export async function votePoll(
  pollId: string,
  optionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  const { data: poll } = await admin
    .from('batch_polls')
    .select('is_closed')
    .eq('id', pollId)
    .single();

  if (poll?.is_closed) return { success: false, error: 'This poll is closed.' };

  // Upsert — allows changing vote
  const { error } = await admin
    .from('batch_poll_votes')
    .upsert(
      { poll_id: pollId, option_id: optionId, voter_id: user.id },
      { onConflict: 'poll_id,voter_id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function closePoll(
  pollId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_master_instructor')
    .eq('id', user.id)
    .single();

  const canClose =
    POLL_CREATOR_ROLES.includes(profile?.role || '') || profile?.is_master_instructor;
  if (!canClose) return { success: false, error: 'Permission denied.' };

  const { error } = await admin
    .from('batch_polls')
    .update({ is_closed: true })
    .eq('id', pollId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Fetch all polls for a batch as a lookup map keyed by poll id */
export async function getBatchPollsMap(
  batchId: string,
  voterId: string
): Promise<Record<string, BatchPollData>> {
  const admin = createAdminClient();

  const { data: polls, error } = await admin
    .from('batch_polls')
    .select(`
      id, batch_id, created_by, question, is_closed, created_at,
      creator:profiles!created_by(full_name, role),
      options:batch_poll_options(id, option_text, position),
      votes:batch_poll_votes(id, option_id, voter_id)
    `)
    .eq('batch_id', batchId);

  if (error || !polls) return {};

  const map: Record<string, BatchPollData> = {};
  for (const poll of polls) {
    const votes = (poll.votes || []) as any[];
    const options = ((poll.options || []) as any[]).sort(
      (a: any, b: any) => a.position - b.position
    );
    const myVote = votes.find((v) => v.voter_id === voterId);

    map[poll.id] = {
      id: poll.id,
      batch_id: poll.batch_id,
      created_by: poll.created_by,
      question: poll.question,
      is_closed: poll.is_closed,
      created_at: poll.created_at,
      creator: (Array.isArray(poll.creator) ? poll.creator[0] : poll.creator) as any,
      options: options.map((opt: any) => ({
        ...opt,
        vote_count: votes.filter((v) => v.option_id === opt.id).length,
      })),
      total_votes: votes.length,
      my_vote_option_id: myVote?.option_id || null,
    };
  }
  return map;
}

/** Fetch a single poll — used to refresh after a realtime vote event */
export async function getPollById(
  pollId: string,
  voterId: string
): Promise<BatchPollData | null> {
  const admin = createAdminClient();

  const { data: poll, error } = await admin
    .from('batch_polls')
    .select(`
      id, batch_id, created_by, question, is_closed, created_at,
      creator:profiles!created_by(full_name, role),
      options:batch_poll_options(id, option_text, position),
      votes:batch_poll_votes(id, option_id, voter_id)
    `)
    .eq('id', pollId)
    .single();

  if (error || !poll) return null;

  const votes = (poll.votes || []) as any[];
  const options = ((poll.options || []) as any[]).sort(
    (a: any, b: any) => a.position - b.position
  );
  const myVote = votes.find((v) => v.voter_id === voterId);

  return {
    id: poll.id,
    batch_id: poll.batch_id,
    created_by: poll.created_by,
    question: poll.question,
    is_closed: poll.is_closed,
    created_at: poll.created_at,
    creator: (Array.isArray(poll.creator) ? poll.creator[0] : poll.creator) as any,
    options: options.map((opt: any) => ({
      ...opt,
      vote_count: votes.filter((v) => v.option_id === opt.id).length,
    })),
    total_votes: votes.length,
    my_vote_option_id: myVote?.option_id || null,
  };
}
