import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InstructorGroupClient } from './InstructorGroupClient';
import { getInstructorBatches, getWaitingQueue } from '@/lib/actions/batches';
import { getBatchResources } from '@/lib/actions/resources';
import { getInstructors } from '@/lib/actions/subscription';

export default async function InstructorGroupsPage() {
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

  const ALLOWED_ROLES = ['instructor', 'admin', 'staff', 'client_management'];
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/auth/login');
  }

  const [batches, instructors, waitingQueue] = await Promise.all([
    getInstructorBatches(user.id),
    getInstructors(),
    getWaitingQueue(),
  ]);

  const activeBatch = batches.find((b: any) => b.status === 'active') || batches[0] || null;

  const initialResources = activeBatch ? await getBatchResources(activeBatch.id) : [];

  return (
    <div className="h-full w-full">
      <InstructorGroupClient
        currentUser={profile}
        initialBatches={batches}
        initialBatchResources={initialResources}
        instructors={instructors}
        waitingQueue={waitingQueue}
      />
    </div>
  );
}
