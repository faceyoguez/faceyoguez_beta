import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getLiveGrowthMetrics } from '@/lib/actions/subscription';
import { checkExpiringSubscriptions } from '@/lib/actions/batches';
import { TrendingUp, Users, Calendar, Sparkles, ArrowRight, ShieldCheck, MessageSquare, Crown, BookOpen, Radio, Activity, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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

  // Fire-and-forget: check for expiring subscriptions and send notifications
  checkExpiringSubscriptions().catch(() => { });

  const metrics = await getLiveGrowthMetrics();

  return (
    <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-sans animate-in fade-in duration-1000 relative">
      
      {/* Kinetic Aura Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
      </div>

      <div className="relative z-10 p-8 lg:p-12 space-y-12 h-screen flex flex-col overflow-hidden">
        
        {/* 1. Sanctuary Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black tracking-[0.3em] uppercase">
                <ShieldCheck className="w-4 h-4" />
                Sanctuary Sentinel
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-serif text-slate-900 tracking-tight">
                Collective Resonance
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6 p-5 bg-white/60 backdrop-blur-2xl rounded-3xl border border-[#FF8A75]/10 group">
            <div className="h-14 w-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-white font-serif text-xl group-hover:rotate-12 transition-transform duration-700 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#FF8A75]/20 to-transparent opacity-40" />
               <span className="relative z-10">{profile.full_name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em] leading-none mb-1 opacity-60">Architect</p>
              <p className="text-lg font-bold text-slate-900 capitalize leading-none">{profile.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </header>

        {/* 2. Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {[
            { icon: Users, label: 'Total Seekers', value: metrics.totalActiveStudents, change: '+12.5%' },
            { icon: MessageSquare, label: 'Resonance', value: metrics.newJoineesThisMonth, change: '+3' },
            { icon: Sparkles, label: 'Ascension', value: metrics.renewalsThisMonth, change: '+2%' },
            { icon: Crown, label: 'Sessions', value: metrics.expiringThisWeek, change: 'Stable' }
          ].map((stat, i) => (
            <div key={i} className="p-8 rounded-[3rem] bg-white border border-[#FF8A75]/5 flex flex-col gap-4 transition-all hover:translate-y-[-4px] group relative overflow-hidden">
               <div className="flex items-center justify-between relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center group-hover:rotate-12 transition-all duration-700">
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">{stat.label}</p>
                <p className="text-4xl font-serif text-slate-900 tracking-tighter mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Operational Planes (Scrollable if needed) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden pb-4">
          
          <div className="p-10 rounded-[4rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 space-y-8 overflow-y-auto scrollbar-none">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF8A75] opacity-60">Operations</h3>
              <p className="text-3xl font-serif text-slate-900">Manifestation Portal</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Seeker Roster', icon: Users, href: '/staff/one-on-one' },
                { label: 'Portal Broadcast', icon: Radio, href: '/staff/broadcast' },
                { label: 'Course Alchemy', icon: BookOpen, href: '/staff/lms' },
                { label: 'Collective Batches', icon: Users, href: '/staff/groups' },
              ].map((link, i) => (
                <Link key={i} href={link.href} className="group p-6 rounded-[2.5rem] bg-white border border-transparent hover:border-[#FF8A75]/20 transition-all duration-700 flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]/40 group-hover:text-[#FF8A75] transition-all duration-700">
                    <link.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-slate-800 transition-colors uppercase tracking-tight">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-10 rounded-[4rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 space-y-8 overflow-y-auto scrollbar-none">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF8A75] opacity-60">Intelligence</h3>
              <p className="text-3xl font-serif text-slate-900">Growth Pulse</p>
            </div>

            <div className="space-y-8 py-2">
            {[
                { label: 'Seeker Growth', val: (metrics.newJoineesThisMonth / (metrics.totalActiveStudents || 1)) },
                { label: 'Alignment Sustainability', val: (metrics.renewalsThisMonth / (metrics.totalActiveStudents || 1)) },
                { label: 'Active Resonance', val: (metrics.totalActiveStudents / 100) > 1 ? 1 : (metrics.totalActiveStudents / 100) }
              ].map((metric, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    <span>{metric.label}</span>
                    <span className="text-[#FF8A75]">{Math.round(metric.val * 100)}%</span>
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
            
            <CalibrationCheck />
          </div>
        </div>
      </div>
    </div>
  );
}
