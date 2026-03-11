import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentGroupHub } from './StudentGroupHub';
import { getBatchResources } from '@/lib/actions/resources';
import type { Profile, Batch } from '@/types/database';

export default async function StudentGroupPage() {
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

    if (profile?.role !== 'student') {
        redirect('/dashboard');
    }

    // Find the student's active batch enrollment
    const { data: enrollment, error } = await supabase
        .from('batch_enrollments')
        .select(`
      *,
      batches (*)
    `)
        .eq('student_id', user.id)
        .in('status', ['active', 'extended'])
        .limit(1)
        .single();

    const activeBatch = enrollment?.batches || null;

    // Let's fetch resources for this batch
    let resources = [];
    if (activeBatch) {
        resources = await getBatchResources(activeBatch.id);
    }

    return <StudentGroupHub currentUser={profile as Profile} activeBatch={activeBatch as Batch | null} initialResources={resources} />;
}
