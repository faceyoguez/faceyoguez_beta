import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getLiveGrowthMetrics } from '@/lib/actions/subscription';
import { checkExpiringSubscriptions } from '@/lib/actions/batches';
import { Users, Crown, Radio, ShieldCheck } from 'lucide-react';

const STAFF_ROLES = ['admin', 'staff', 'client_management'];

export default async function StaffDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/auth/login');

  // Fire-and-forget
  checkExpiringSubscriptions().catch(() => {});

  const metrics = await getLiveGrowthMetrics();

  const statCards = [
    { 
      id: 'joinees',
      icon: Users,        
      label: 'New Admissions',  
      monthly: metrics.monthlyJoinees || 0, 
      daily: metrics.dailyJoinees || 0,
      trend: metrics.joineesTrend, 
      trendLabel: 'vs last month' 
    },
    { 
      id: 'renewals',
      icon: Crown,        
      label: 'Renewals',   
      monthly: metrics.monthlyRenewals || 0,     
      daily: metrics.dailyRenewals || 0,
      trend: metrics.renewalsTrend,
      trendLabel: 'vs last month' 
    },
    { 
      id: 'active',
      icon: Radio,        
      label: 'Active Students',  
      monthly: metrics.totalActiveStudents || 0, 
      daily: metrics.activeTrials || 0,
      monthlyLabel: 'Total Active',
      dailyLabel: 'Active Trials',
      trend: `${metrics.expiringThisWeek || 0} Expiring`,
      trendLabel: 'this week',
      trendNeutral: true
    },
  ];

  return (
    <div className="h-[100dvh] bg-[#FFFAF7] text-[#1a1a1a] font-jakarta overflow-hidden flex flex-col">
      {/* Aura backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 p-5 sm:p-6 lg:p-8 flex flex-col gap-6 h-full w-full">
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] text-[9px] font-black tracking-[0.25em] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Operations Command Centre
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-aktiv font-bold text-slate-900 tracking-tight leading-tight">
              Main Management Portal
            </h1>
          </div>

          <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/60 backdrop-blur-2xl rounded-2xl border border-[#FF8A75]/10 self-start sm:self-auto shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white font-aktiv font-bold text-lg overflow-hidden relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF8A75]/20 to-transparent opacity-40" />
              <span className="relative z-10">{profile.full_name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#FF8A75] uppercase tracking-[0.25em] leading-none mb-1 opacity-60">Operations Lead</p>
              <p className="text-xs font-bold text-slate-900 capitalize leading-none">{profile.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </header>

        {/* ── Main Dashboard Content ── */}
        <div className="flex-1 min-h-0 flex flex-col gap-6">
          {/* ── Metrics Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 flex-shrink-0">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="p-5 lg:p-6 rounded-[2rem] bg-white border border-[#FF8A75]/10 flex flex-col gap-4 sm:gap-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF8A75]/5 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center group-hover:rotate-12 transition-all duration-700 flex-shrink-0">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider ${stat.trendNeutral ? 'bg-slate-100 text-slate-600' : (stat.trend?.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}`}>
                    {stat.trend} <span className="opacity-70 font-medium ml-0.5">{stat.trendLabel}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-semibold">{stat.label}</p>
                  <div className="grid grid-cols-2 gap-2 divide-x divide-slate-100">
                    <div className="flex flex-col">
                      <span className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight leading-none mb-1">{stat.daily}</span>
                      <span className="text-[9px] font-bold text-[#FF8A75] uppercase tracking-wider">{stat.dailyLabel || 'Today'}</span>
                    </div>
                    <div className="flex flex-col pl-2">
                      <span className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight leading-none mb-1">{stat.monthly}</span>
                      <span className="text-[9px] font-bold text-[#FF8A75] uppercase tracking-wider">{stat.monthlyLabel || 'This Month'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Growth Pulse - Full Width, Flex-1 to fill space nicely */}
          <div className="flex-1 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 p-6 lg:p-8 rounded-[2rem] flex flex-col justify-center min-h-[min-content]">
            <div className="space-y-1 mb-6 sm:mb-8">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Insights</h3>
              <p className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900">Operations Tracking</p>
            </div>

            <div className="space-y-6 sm:space-y-8 max-w-4xl">
              {[
                { label: 'Admission Conversion (Trials to Paid)', val: metrics.monthlyJoinees / ((metrics.monthlyJoinees + metrics.activeTrials) || 1) },
                { label: 'Retention Sustainability', val: metrics.monthlyRenewals / ((metrics.monthlyRenewals + metrics.expiringThisWeek) || 1) },
              ].map((metric, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-slate-600">
                    <span>{metric.label}</span>
                    <span className="text-[#FF8A75] text-sm">{Math.round(metric.val * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#FF8A75]/5 rounded-full overflow-hidden border border-[#FF8A75]/10">
                    <div
                      className="h-full bg-[#FF8A75] rounded-full transition-all duration-[2000ms]"
                      style={{ width: `${Math.max(5, metric.val * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
