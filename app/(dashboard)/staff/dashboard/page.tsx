import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getLiveGrowthMetrics } from '@/lib/actions/subscription';
import { checkExpiringSubscriptions } from '@/lib/actions/batches';
import { Users, MessageSquare, Sparkles, Crown, Radio, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { CalibrationCheck } from '@/components/dashboard/CalibrationCheck';

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
    { icon: Users,        label: 'Total Seekers',  value: metrics.totalActiveStudents,  change: '+12.5%' },
    { icon: MessageSquare, label: 'New This Month', value: metrics.newJoineesThisMonth,  change: '+3' },
    { icon: Sparkles,     label: 'Renewals',        value: metrics.renewalsThisMonth,    change: '+2%' },
    { icon: Crown,        label: 'Expiring Soon',   value: metrics.expiringThisWeek,     change: 'Stable' },
  ];

  const quickLinks = [
    { label: 'Seeker Roster',      icon: Users,     href: '/staff/one-on-one' },
    { label: 'Portal Broadcast',   icon: Radio,     href: '/staff/broadcast' },
    { label: 'Course Alchemy',     icon: BookOpen,  href: '/staff/lms' },
    { label: 'Collective Batches', icon: Users,     href: '/staff/groups' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FFFAF7] text-[#1a1a1a] font-sans overflow-x-hidden">

      {/* Aura backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 px-5 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 flex flex-col gap-6 sm:gap-8 lg:gap-10">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] text-[9px] font-black tracking-[0.25em] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sanctuary Sentinel
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-slate-900 tracking-tight leading-tight">
              Collective Resonance
            </h1>
          </div>

          <div className="flex items-center gap-4 p-4 sm:p-5 bg-white/60 backdrop-blur-2xl rounded-2xl border border-[#FF8A75]/10 self-start sm:self-auto">
            <div className="h-11 w-11 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white font-serif text-lg overflow-hidden relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF8A75]/20 to-transparent opacity-40" />
              <span className="relative z-10">{profile.full_name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.25em] leading-none mb-1 opacity-60">Architect</p>
              <p className="text-sm font-bold text-slate-900 capitalize leading-none">{profile.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </header>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="p-5 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-[#FF8A75]/5 flex flex-col gap-3 sm:gap-4 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center group-hover:rotate-12 transition-all duration-700 flex-shrink-0">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-60">{stat.label}</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-serif text-slate-900 tracking-tighter mt-1 leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Operational Panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">

          {/* Manifestation Portal */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 space-y-6">
            <div className="space-y-1">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Operations</h3>
              <p className="text-2xl sm:text-3xl font-serif text-slate-900">Manifestation Portal</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {quickLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="group p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-[2rem] bg-white border border-transparent hover:border-[#FF8A75]/20 transition-all duration-500 flex flex-col items-start gap-3"
                >
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]/40 group-hover:text-[#FF8A75] transition-all duration-500">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Growth Pulse */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 space-y-6">
            <div className="space-y-1">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Intelligence</h3>
              <p className="text-2xl sm:text-3xl font-serif text-slate-900">Growth Pulse</p>
            </div>

            <div className="space-y-5">
              {[
                { label: 'Seeker Growth', val: metrics.newJoineesThisMonth / (metrics.totalActiveStudents || 1) },
                { label: 'Alignment Sustainability', val: metrics.renewalsThisMonth / (metrics.totalActiveStudents || 1) },
                { label: 'Active Resonance', val: Math.min(1, metrics.totalActiveStudents / 100) },
              ].map((metric, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
                    <span>{metric.label}</span>
                    <span className="text-[#FF8A75]">{Math.round(metric.val * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#FF8A75]/5 rounded-full overflow-hidden border border-[#FF8A75]/10">
                    <div
                      className="h-full bg-[#FF8A75] rounded-full transition-all duration-[2000ms]"
                      style={{ width: `${Math.max(5, metric.val * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <CalibrationCheck />
          </div>
        </div>
      </div>
    </div>
  );
}
