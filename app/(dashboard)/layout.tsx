import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { getStudentNotificationsCount, getStudentSubscriptions } from '@/lib/data/dashboard';
import Link from 'next/link';
import { Flower2 } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  // Enforce Email Verification for Dashboard Access (except for profile page)
  const headerList = await headers();
  const currentPath = headerList.get('x-pathname') || ''; 
  // Note: x-pathname needs to be set in middleware. If not, we can skip this check 
  // or use a different strategy. For now, let's assume we want to protect all pages.
  // A safer way is to check the user.email_confirmed_at in the client components or 
  // specific page.tsx files.
  
  // Alternative: Just let them in but show a global banner (more user friendly)

  // Parallelize remaining data fetching
  const [profile, unreadNotificationsCount, subscriptions] = await Promise.all([
    getServerProfile(user.id),
    getStudentNotificationsCount(user.id),
    getStudentSubscriptions(user.id)
  ]);

  if (!profile) redirect('/auth/login');

  const activeSubscriptions = (subscriptions as any[])?.filter((s: any) => s.status === 'active') || [];
  const activePlans = activeSubscriptions.map((sub: any) => sub.plan_type);

  // Only consider subs whose end_date is in the future (or null = lifetime)
  const todayStr = new Date().toISOString().split('T')[0];
  const validSubs = activeSubscriptions.filter((s: any) => !s.end_date || s.end_date >= todayStr);

  // Calculate daysLeft for renewal pill — use the furthest future end_date
  const furthestEndDate = validSubs.reduce((furthest: Date | null, sub: any) => {
    if (!sub.end_date) return furthest; // lifetime — handled below
    const d = new Date(`${sub.end_date}T23:59:59`);
    return !furthest || d > furthest ? d : furthest;
  }, null as Date | null);

  const hasLifetimeSub = validSubs.some((s: any) => !s.end_date);

  const daysLeft = furthestEndDate
    ? Math.max(0, Math.ceil((furthestEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : hasLifetimeSub ? -1 : 0;

  // Check if there's an expired trial to show the "kind words" prompt
  const hasExpiredTrial = (subscriptions as any[])?.some((s: any) => s.is_trial && (s.status === 'expired' || (s.end_date && new Date(s.end_date) < new Date()))) || false;
  const showTrialPrompt = hasExpiredTrial && activeSubscriptions.length === 0;

  const isVerified = !!user.email_confirmed_at;

  return (
    <AppSidebar
      user={profile}
      activePlans={activePlans}
      unreadNotificationsCount={unreadNotificationsCount}
      isVerified={isVerified}
    >
      <div className="relative flex-1 flex flex-col min-h-full">
        {/* Enforce Email Verification Overlay */}
        {!user.email_confirmed_at && (
          <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="max-w-md p-8 bg-white rounded-[2.5rem] premium-shadow border border-zen-peach/20 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-zen-peach/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Flower2 className="w-8 h-8 text-[#E76F51]" />
              </div>
              <h2 className="font-aktiv text-2xl text-zen-taupe mb-4">Verification Required</h2>
              <p className="text-body-md text-warm-gray mb-8 leading-relaxed">
                To keep your sanctuary secure, please verify your email address. 
                A verification link has been sent to <span className="font-bold text-zen-taupe">{user.email}</span>.
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/student/profile#verify"
                  className="w-full py-4 rounded-full bg-[#E76F51] text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#E76F51]/20"
                >
                  Go to Verification Hub
                </Link>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-xs font-bold text-warm-gray hover:text-zen-taupe transition-colors"
                >
                  I've verified my email — Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {showTrialPrompt && (
          <div className="fixed bottom-6 right-6 sm:top-20 sm:right-8 sm:bottom-auto z-[60] animate-in slide-in-from-right duration-500 w-[calc(100%-3rem)] sm:w-auto">
             <div className="bg-white border-2 border-[#e76f51]/20 p-6 rounded-[2rem] shadow-2xl max-w-sm relative overflow-hidden group">
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
      </div>
    </AppSidebar>
  );
}
