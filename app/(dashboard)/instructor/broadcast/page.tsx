import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getInstructorBroadcasts } from '@/lib/actions/broadcast';
import { InstructorBroadcastClient } from './InstructorBroadcastClient';

export default async function InstructorBroadcastPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
    redirect('/auth/login');
  }

  // Fetch active batches for the dropdown
  // If admin, they see everything. If instructor, only their own.
  let batchesQuery = supabase
    .from('batches')
    .select('id, name')
    .in('status', ['active', 'upcoming']);

  if (profile?.role === 'instructor') {
    batchesQuery = batchesQuery.eq('instructor_id', user.id);
  }

  const { data: batches } = await batchesQuery;

  // Fetch broadcast history
  const broadcasts = await getInstructorBroadcasts();

  return (
    <InstructorBroadcastClient
      currentUser={profile}
      batches={batches || []}
      initialBroadcasts={broadcasts}
    />
  );
}
