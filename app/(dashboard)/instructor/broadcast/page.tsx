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

  if (profile?.role !== 'instructor') {
    redirect('/dashboard');
  }

  // Fetch active batches for the dropdown
  const { data: batches } = await supabase
    .from('batches')
    .select('id, name')
    .eq('instructor_id', user.id)
    .in('status', ['active', 'upcoming']);

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
