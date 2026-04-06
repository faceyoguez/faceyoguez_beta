import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentBroadcastClient } from './StudentBroadcastClient';

export default async function StudentBroadcastsPage() {
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

  // Fetch student notifications with the broadcast and sender payload
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
            *,
            broadcasts!broadcast_id (
                *,
                sender:profiles!sender_id(*)
            )
        `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <StudentBroadcastClient
      notifications={notifications || []}
    />
  );
}
