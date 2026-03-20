import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { StaffOneOnOneClient } from '@/app/(dashboard)/instructor/one-on-one/StaffOneOnOneClient';
import { fetchActiveOneOnOneStudents } from '@/lib/actions/chat';
import { getLiveGrowthMetrics, getInstructors } from '@/lib/actions/subscription';

const STAFF_ROLES = ['admin', 'staff', 'client_management'];

export default async function StaffOneOnOnePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/auth/login');

  const [students, metrics, instructors] = await Promise.all([
    fetchActiveOneOnOneStudents(user.id),
    getLiveGrowthMetrics(),
    getInstructors(),
  ]);

  return (
    <StaffOneOnOneClient
      currentUser={profile}
      students={students}
      metrics={metrics}
      instructors={instructors as unknown as import('@/types/database').Profile[]}
    />
  );
}
