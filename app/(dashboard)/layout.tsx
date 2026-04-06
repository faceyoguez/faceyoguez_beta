import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import Link from 'next/link';
import { Flower2 } from 'lucide-react';

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

  const admin = createAdminClient();

  // Fetch notifications and subscriptions for everyone
  const [{ count }, { data: subscriptions }] = await Promise.all([
    admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    admin
      .from('subscriptions')
      .select('plan_type, status, is_trial, end_date')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  unreadNotificationsCount = count || 0;
  
  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
  activePlans = activeSubscriptions.map(sub => sub.plan_type);

  // Check if there's an expired trial to show the "kind words" prompt
  const hasExpiredTrial = subscriptions?.some(s => s.is_trial && (s.status === 'expired' || (s.end_date && new Date(s.end_date) < new Date()))) || false;
  const showTrialPrompt = hasExpiredTrial && activeSubscriptions.length === 0;

  return (
    <AppSidebar
      user={profile}
      activePlans={activePlans}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {showTrialPrompt && (
        <div className="fixed top-20 right-8 z-[60] animate-in slide-in-from-right duration-500">
           <div className="bg-white border-2 border-primary/20 p-6 rounded-[2rem] shadow-2xl max-w-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform h-24 w-24">
                 <Flower2 className="w-full h-full text-primary" />
              </div>
              <h4 className="text-lg font-bold text-primary leading-tight">Thank you for practicing!</h4>
              <p className="mt-2 text-xs font-medium text-foreground/70 leading-relaxed">
                Since you liked our sessions, feel free to continue with a plan. We have some interesting offers waiting for you!
              </p>
              <div className="mt-5 flex gap-3">
                 <Link href="/student/plans" className="flex-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl text-center shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                    View Plans
                 </Link>
              </div>
           </div>
        </div>
      )}
      {children}
    </AppSidebar>
  );
}
