import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getInstructorBroadcasts } from '@/lib/actions/broadcast';
import { StaffBroadcastClient } from './StaffBroadcastClient';

const STAFF_ROLES = ['admin', 'staff', 'client_management'];

export default async function StaffBroadcastPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const ALLOWED_ROLES = [...STAFF_ROLES, 'instructor'];

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/auth/login');
  }

  // Staff can broadcast to ALL active batches
  const { data: batches } = await admin
    .from('batches')
    .select('id, name')
    .in('status', ['active', 'upcoming']);

  // Fetch broadcast history (shared action works by sender_id)
  const broadcasts = await getInstructorBroadcasts();

  return (
    <StaffBroadcastClient
      currentUser={profile}
      batches={batches || []}
      initialBroadcasts={broadcasts}
    />
  );
}
