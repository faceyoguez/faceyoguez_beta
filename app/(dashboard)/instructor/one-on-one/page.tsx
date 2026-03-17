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

  if (!profile || profile.role !== 'instructor') redirect('/auth/login');

  const students = await fetchActiveOneOnOneStudents(user.id);

  return (
    <InstructorOneOnOneClient
      currentUser={profile}
      students={students}
    />
  );
}
