import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InstructorGroupClient } from './InstructorGroupClient';
import { getInstructorBatches } from '@/lib/actions/batches';
import { getBatchResources } from '@/lib/actions/resources';

export default async function InstructorGroupsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
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

  const batches = await getInstructorBatches(user.id);

  // If there's an active batch, maybe fetch its resources too (optional optimization)
  // For now we'll let the client handle it if needed or pass the initial list
  const activeBatch = batches.find(b => b.status === 'active') || batches[0] || null;
  const initialResources = activeBatch ? await getBatchResources(activeBatch.id) : [];

  return (
    <div className="h-full w-full">
      <InstructorGroupClient
        currentUser={profile}
        initialBatches={batches}
        initialBatchResources={initialResources}
      />
    </div>
  );
}
