import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'instructor') {
    redirect('/instructor/dashboard');
  }

  if (profile && ['admin', 'staff', 'client_management'].includes(profile.role)) {
    redirect('/staff/dashboard');
  }

  redirect('/student/dashboard');
}
