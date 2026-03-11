import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  let activePlans: string[] = [];
  if (profile.role === 'student') {
    const { data: subscriptions } = await admin
      .from('subscriptions')
      .select('plan_type')
      .eq('student_id', user.id)
      .in('status', ['active', 'pending']);

    if (subscriptions) {
      activePlans = subscriptions.map(sub => sub.plan_type);
    }
  }

  return <AppSidebar user={profile} activePlans={activePlans}>{children}</AppSidebar>;
}
