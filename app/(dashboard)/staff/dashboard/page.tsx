import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getLiveGrowthMetrics } from '@/lib/actions/subscription';
import { checkExpiringSubscriptions } from '@/lib/actions/batches';
import { TrendingUp, Users, Calendar, Sparkles, ArrowRight, ShieldCheck, MessageSquare, Crown, BookOpen, Radio } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-sans animate-in fade-in duration-1000 relative">
      
      {/* Kinetic Aura Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
      </div>

      <div className="relative z-10 p-8 lg:p-16 space-y-16">
        
        {/* 1. Sanctuary Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10 animate-in slide-in-from-top-4 duration-700">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black tracking-[0.3em] uppercase">
                <ShieldCheck className="w-4 h-4" />
                Sanctuary Sentinel
              </div>
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-slate-900 tracking-tight">
                Collective Resonance
              </h1>
              <p className="text-xl text-slate-400 font-medium max-w-lg mt-4 leading-relaxed">
                Architecting the expansion of human consciousness through digital sanctuary management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 p-6 bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 group">
            <div className="h-16 w-16 rounded-3xl bg-[#1a1a1a] flex items-center justify-center text-white font-serif text-2xl group-hover:rotate-12 transition-transform duration-700 shadow-xl overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#FF8A75]/20 to-transparent opacity-40" />
               <span className="relative z-10">{profile.full_name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.3em] leading-none mb-2 opacity-60">Architect of Order</p>
              <p className="text-lg font-bold text-slate-900 capitalize leading-none">{profile.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </header>

        {/* 2. Core Metrics (Focus Nodes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {[
            { icon: Users, label: 'Total Seekers', value: '428', change: '+12.5%', color: 'text-primary' },
            { icon: MessageSquare, label: 'Active Resonance', value: '84', change: '+3', color: 'text-primary' },
            { icon: Sparkles, label: 'Ascension Rate', value: '94%', change: '+2%', color: 'text-primary' },
            { icon: Crown, label: 'Sacred 1-on-1s', value: '12', change: 'Stable', color: 'text-primary' }
          ].map((stat, i) => (
            <div key={i} className="p-10 rounded-[4rem] bg-white border border-[#FF8A75]/5 shadow-2xl shadow-[#FF8A75]/5 flex flex-col gap-6 transition-all hover:translate-y-[-8px] hover:shadow-primary/10 group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF8A75]/5 rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-1000" />
               <div className="flex items-center justify-between relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center group-hover:rotate-12 transition-all duration-700">
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FF8A75]/5 text-[9px] font-black text-[#FF8A75] border border-[#FF8A75]/10">{stat.change}</span>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">{stat.label}</p>
                <p className="text-5xl font-serif text-slate-900 tracking-tighter mt-3">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Operational Planes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          
          {/* Plane A: Manifestation Links */}
          <div className="p-14 rounded-[5rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF8A75] opacity-60">Operational Planes</h3>
                <p className="text-3xl font-serif text-slate-900">Manifestation Portal</p>
              </div>
              <div className="h-12 w-12 rounded-full border border-[#FF8A75]/10 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-[#FF8A75]/40" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: 'Seeker Roster', icon: Users, href: '/staff/one-on-one' },
                { label: 'Portal Broadcast', icon: Radio, href: '/staff/broadcast' },
                { label: 'Course Alchemy', icon: BookOpen, href: '/staff/lms' },
                { label: 'Collective Batches', icon: Users, href: '/staff/groups' },
              ].map((link, i) => (
                <a key={i} href={link.href} className="group p-8 rounded-[3rem] bg-white border border-transparent hover:border-[#FF8A75]/20 hover:shadow-2xl hover:shadow-[#FF8A75]/5 transition-all duration-700 flex flex-col items-start gap-6">
                  <div className="h-16 w-16 rounded-[1.8rem] bg-[#FF8A75]/5 border border-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]/40 group-hover:text-[#FF8A75] group-hover:scale-110 transition-all duration-700">
                    <link.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/40 group-hover:text-[#FF8A75] transition-colors leading-none block mb-1">Engage Node</span>
                    <span className="text-base font-bold text-slate-800 transition-colors uppercase tracking-tight">{link.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Plane B: Pulse Overview */}
          <div className="p-14 rounded-[5rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF8A75] opacity-60">Platform Spectrum</h3>
                <p className="text-3xl font-serif text-slate-900">Live Resilience Pulse</p>
              </div>
              <div className="h-12 w-12 rounded-full border border-[#FF8A75]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#FF8A75]/40" />
              </div>
            </div>

            <div className="space-y-10 py-4">
              {[
                { label: 'Seeker Attendance', val: 0.85 },
                { label: 'Recurrent Resonance', val: 0.92 },
                { label: 'Content Absorption', val: 0.78 }
              ].map((metric, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <span>{metric.label}</span>
                    <span className="text-[#FF8A75]">{metric.val * 100}%</span>
                  </div>
                  <div className="h-3 w-full bg-[#FF8A75]/5 rounded-full overflow-hidden border border-[#FF8A75]/10">
                    <div 
                      className="h-full bg-[#FF8A75] rounded-full transition-all duration-[2000ms] shadow-[0_0_12px_#FF8A75]"
                      style={{ width: `${metric.val * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
               <div className="p-8 rounded-[2.5rem] bg-[#1a1a1a] text-white flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF8A75]/20 to-transparent opacity-40 group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-2">Automated Calibration</p>
                     <p className="text-lg font-serif">Renewal Pulse Check</p>
                  </div>
                  <button className="h-12 px-8 rounded-2xl bg-white text-[#1a1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-[#FF8A75] hover:text-white transition-all relative z-10">
                     Execute
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
