import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InstructorGroupClient } from './InstructorGroupClient';
import type { Profile } from '@/types/database';

export default async function InstructorGroupPage() {
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
        redirect('/dashboard');
    }

    const { data: batches } = await supabase
        .from('batches')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

    return <InstructorGroupClient currentUser={profile as Profile} initialBatches={batches || []} />;
}
