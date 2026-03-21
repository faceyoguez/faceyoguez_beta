import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InstructorGroupClient } from '../../instructor/groups/InstructorGroupClient';
import { getInstructorBatches } from '@/lib/actions/batches';
import { getBatchResources } from '@/lib/actions/resources';
import { getInstructors } from '@/lib/actions/subscription';

export default async function StaffGroupsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'staff', 'client_management'].includes(profile.role)) {
    redirect('/auth/login');
  }

  const [batches, instructors] = await Promise.all([
    getInstructorBatches(user.id),
    getInstructors(),
  ]);

  const activeBatch = batches.find(b => b.status === 'active') || batches[0] || null;
  const initialResources = activeBatch ? await getBatchResources(activeBatch.id) : [];

  return (
    <div className="h-full w-full">
      <InstructorGroupClient
        currentUser={profile}
        initialBatches={batches}
        initialBatchResources={initialResources}
        instructors={instructors}
      />
    </div>
  );
}
