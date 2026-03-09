import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { InstructorOneOnOneClient } from './InstructorOneOnOneClient';
import { fetchActiveOneOnOneStudents } from '@/lib/actions/chat';

export default async function InstructorOneOnOnePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  // Fetch all students with active 1:1 subscriptions using the admin client
  const students = await fetchActiveOneOnOneStudents(user.id);

  return (
    <InstructorOneOnOneClient
      currentUser={profile}
      students={students as Array<{ conversationId: string; id: string; full_name: string; avatar_url: string | null; email: string }>}
    />
  );
}
