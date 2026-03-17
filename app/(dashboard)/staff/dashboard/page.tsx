import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getLiveGrowthMetrics } from '@/lib/actions/subscription';

const STAFF_ROLES = ['admin', 'staff', 'client_management'];

export default async function StaffDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/auth/login');

  const metrics = await getLiveGrowthMetrics();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Client Management Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500 mb-8">Overview of platform growth and activity.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 p-5 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">New Joinees</p>
          <p className="text-4xl font-extrabold mt-1">{metrics.newJoineesThisMonth}</p>
          <p className="text-xs opacity-70 mt-1">this month</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">Renewals</p>
          <p className="text-4xl font-extrabold mt-1">{metrics.renewalsThisMonth}</p>
          <p className="text-xs opacity-70 mt-1">this month</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total Active</p>
          <p className="text-4xl font-extrabold mt-1">{metrics.totalActiveStudents}</p>
          <p className="text-xs opacity-70 mt-1">students</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">Expiring Soon</p>
          <p className="text-4xl font-extrabold mt-1">{metrics.expiringThisWeek}</p>
          <p className="text-xs opacity-70 mt-1">this week</p>
        </div>
      </div>
    </div>
  );
}
