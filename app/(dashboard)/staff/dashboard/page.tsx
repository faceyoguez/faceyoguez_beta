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
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12 font-sans overflow-hidden">

      {/* 1. Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 animate-in fade-in duration-1000">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase border border-primary/10">
            <ShieldCheck className="w-3 h-3" />
            Administration Hub
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground tracking-tight">
            Platform Insights
          </h1>
          <p className="text-lg text-foreground/40 italic font-medium max-w-lg">
            Monitor platform growth and student lifecycle at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-sm rounded-3xl border border-outline-variant/10 group">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-foreground font-bold text-sm group-hover:rotate-12 transition-transform">
            {profile.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest leading-none">Logged in as</p>
            <p className="text-sm font-bold text-foreground capitalize">{profile.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { icon: Users, label: 'Total Souls', value: '428', change: '+12.5%', color: 'text-primary' },
          { icon: MessageSquare, label: 'Active Sequences', value: '84', change: '+3', color: 'text-primary' },
          { icon: Sparkles, label: 'Manifested Success', value: '94%', change: '+2%', color: 'text-primary' },
          { icon: Crown, label: 'Elite Guidance', value: '12', change: 'Stable', color: 'text-primary' }
        ].map((stat, i) => (
          <div key={i} className="p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-primary/5 shadow-sm flex flex-col gap-4 transition-all hover:bg-white/80 hover:shadow-lg hover:shadow-primary/5 group">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-foreground/30">{stat.change}</span>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">{stat.label}</p>
              <p className="text-3xl font-serif font-black text-foreground tracking-tighter mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
        <div className="p-10 rounded-3xl bg-white/60 backdrop-blur-xl border border-primary/5 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">Management Gateways</h3>
              <p className="text-xl font-serif font-bold text-foreground italic">Operational Hub</p>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground/10" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Client Registry', icon: Users, href: '/staff/one-on-one' },
              { label: 'Universal Broadcast', icon: Radio, href: '/staff/broadcast' },
              { label: 'Wisdom Repository', icon: BookOpen, href: '/staff/lms' },
              { label: 'Collective Hub', icon: Users, href: '/staff/groups' },
            ].map((link, i) => (
              <a key={i} href={link.href} className="group p-5 rounded-2xl bg-white/40 border border-primary/5 hover:bg-white hover:shadow-md transition-all flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-foreground/40 group-hover:text-foreground transition-colors">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="p-10 rounded-3xl bg-white/60 backdrop-blur-xl border border-primary/5 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">Platform Vitality</h3>
              <p className="text-xl font-serif font-bold text-foreground italic">Live Metrics</p>
            </div>
            <TrendingUp className="w-5 h-5 text-foreground/10" />
          </div>

          <div className="space-y-6">
            {[
              { label: 'Ritual Participation', val: 0.85 },
              { label: 'Renewal Alignment', val: 0.92 },
              { label: 'Resource Manifestation', val: 0.78 }
            ].map((metric, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-foreground/30">
                  <span>{metric.label}</span>
                  <span>{metric.val * 100}%</span>
                </div>
                <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${metric.val * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
