import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getServerUser, getServerProfile } from '@/lib/data/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const profile = await getServerProfile(user.id);
  if (!profile) redirect('/auth/login');

  let unreadNotificationsCount = 0;
  let activePlans: string[] = [];

  if (profile.role === 'student') {
    const admin = createAdminClient();

    // Run notifications count and subscriptions in parallel
    const [{ count }, { data: subscriptions }] = await Promise.all([
      admin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
      admin
        .from('subscriptions')
        .select('plan_type')
        .eq('student_id', user.id)
        .in('status', ['active', 'pending']),
    ]);

    unreadNotificationsCount = count || 0;
    activePlans = subscriptions?.map(sub => sub.plan_type) ?? [];
  }

  return (
    <AppSidebar
      user={profile}
      activePlans={activePlans}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </AppSidebar>
  );
}
