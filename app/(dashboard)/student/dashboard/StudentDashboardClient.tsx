'use client';

import React from 'react';
import {
  Bell,
  Calendar,
  Sparkles,
  Clock,
  Users,
  ArrowUpRight,
  User,
  Heart,
  Activity,
  Zap,
  AlertTriangle,
  X,
  TrendingUp,
  Radio
} from 'lucide-react';
import { format, addMinutes, isAfter } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface StudentDashboardClientProps {
  profile: any;
  todaysMeetings: any[];
  activePlanTypes: string[];
  daysLeft: number;
  journeyDay: number;
  expiryDate: string | null;
  firstPhoto: any;
  latestPhoto: any;
  joinedDate: Date | null;
  lastRenewed: Date | null;
  batchIds: string[];
  isTrial?: boolean;
}

const QUOTES = [
  "Your face is a canvas, and your practice is the art.",
  "Radiance begins the moment you decide to be yourself.",
  "Consistency is the foundation of every meaningful transformation.",
  "True beauty is an energy that radiates from within.",
  "Honor your ritual today, wear your results tomorrow."
];

export function StudentDashboardClient({
  profile,
  todaysMeetings,
  activePlanTypes,
  daysLeft,
  journeyDay,
  expiryDate,
  firstPhoto,
  latestPhoto,
  joinedDate,
  lastRenewed,
  batchIds,
  isTrial = false,
}: StudentDashboardClientProps) {
  const firstName = profile.full_name?.split(' ')[0] || 'there';
  const [showRenewModal, setShowRenewModal] = React.useState(false);
  const [meetings, setMeetings] = React.useState(todaysMeetings);
  const supabase = createClient();

  const quote = QUOTES[journeyDay % QUOTES.length];

  // ─── Real-Time Subscription & Expiry Logic ───
  React.useEffect(() => {
    const channel = supabase
      .channel('student-dashboard-meetings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        async (payload: any) => {
          const isOneOnOne = payload.new?.student_id === profile.id || payload.old?.student_id === profile.id;
          const isRelevantGroup = payload.new?.meeting_type === 'group_session' && batchIds.includes(payload.new?.batch_id);
          const isDeletedGroup = payload.old?.meeting_type === 'group_session' && batchIds.includes(payload.old?.batch_id);

          if (!isOneOnOne && !isRelevantGroup && !isDeletedGroup) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data: enrichedMeeting } = await supabase
              .from('meetings')
              .select('*, host:profiles!meetings_host_id_fkey(full_name, avatar_url)')
              .eq('id', payload.new.id)
              .single();

            if (enrichedMeeting) {
              setMeetings(prev => {
                const filtered = prev.filter(m => m.id !== enrichedMeeting.id);
                const combined = [...filtered, enrichedMeeting].sort((a, b) =>
                  new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                );
                return combined;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setMeetings(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      const now = new Date();
      setMeetings(prev => prev.filter(meeting => {
        const startTime = new Date(meeting.start_time);
        const duration = meeting.duration_minutes || 45;
        const endTime = addMinutes(startTime, duration);
        return isAfter(endTime, now);
      }));
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, profile.id, batchIds]);

  React.useEffect(() => {
    if (daysLeft > 0 && daysLeft <= 5) {
      const hasSeenSession = sessionStorage.getItem('hasSeenRenewModal');
      if (!hasSeenSession) {
        setShowRenewModal(true);
        sessionStorage.setItem('hasSeenRenewModal', 'true');
      }
    }
  }, [daysLeft]);

  return (
    <div className="h-[100dvh] relative flex flex-col bg-[#FFFAF7] text-slate-900 font-sans selection:bg-[#FF8A75]/20 overflow-hidden">

      {/* ── Sanctuary Style Auroras ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.06)_0%,transparent_50%)] blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_60%)] translate-y-1/2 translate-x-1/4 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">

        {/* ── Sanctuary Header ── */}
        <header className="shrink-0 px-8 lg:px-12 py-8 flex items-center justify-between border-b border-[#FF8A75]/5">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 shadow-sm self-start">
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] shadow-[0_0_8px_#FF8A75]" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] leading-none">Curator Presence Active</span>
            </div>
            <div>
              <h1 className="text-5xl lg:text-6xl font-serif tracking-tight text-[#1a1a1a]">
                {firstName}&apos;s <span className="text-[#FF8A75] underline decoration-[#FF8A75]/20 underline-offset-8">Sanctuary</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2 opacity-80">
                {format(new Date(), 'EEEE, MMMM do')}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 rounded-full shadow-sm">
               <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Active Ritual</span>
            </div>

            <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 text-slate-400 hover:text-[#FF8A75] transition-all group">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="h-12 w-12 rounded-2xl border border-[#FF8A75]/10 p-1 bg-white shadow-lg shadow-[#FF8A75]/5 overflow-hidden ring-4 ring-[#FF8A75]/5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover rounded-xl" alt={profile.full_name} />
              ) : (
                <div className="w-full h-full bg-[#FFFAF7] flex items-center justify-center rounded-xl">
                  <User className="w-5 h-5 text-[#FF8A75]" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Canvas ── */}
        <main className="flex-1 px-8 lg:px-12 pb-8 flex flex-col gap-8 overflow-hidden mt-2">

          {/* Hero Row (Synchronicity & Mirror) */}
          <div className="flex-[2] grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch min-h-0">

            {/* Synchronicity (Left - 35%) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 flex flex-col min-h-0"
            >
              <div className="flex-1 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 rounded-[3.5rem] p-10 flex flex-col overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF8A75]/5 to-transparent rounded-tr-[3.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-8 shrink-0 relative pb-4 border-b border-[#FF8A75]/5">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-[#FF8A75] flex items-center justify-center shadow-lg shadow-[#FF8A75]/20">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1a1a] tracking-tight">Synchronicity</h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-60">Live Experience</p>
                    </div>
                  </div>
                  {meetings.length > 0 && (
                    <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full">
                      {meetings.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
                  {meetings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
                      <div className="w-16 h-16 rounded-3xl bg-white/40 backdrop-blur-md border border-[#FF8A75]/10 flex items-center justify-center mb-6 shadow-sm">
                        <Radio className="w-8 h-8 text-[#FF8A75]/20" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif text-[#1a1a1a] tracking-tight leading-tight">No Synchronicity Found</h3>
                        <p className="text-[10px] font-bold text-slate-400 max-w-xs uppercase tracking-widest leading-loose">
                          Breathe and check back soon for live sessions.
                        </p>
                      </div>
                    </div>
                  ) : (
                    meetings.map((meeting, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={meeting.id}
                        className="p-6 rounded-[2.5rem] bg-white/60 border border-white/80 hover:bg-white hover:shadow-2xl hover:shadow-[#FF8A75]/5 transition-all duration-500 group"
                      >
                        <div className="flex items-start gap-5">
                          <div className={cn(
                            "h-14 w-14 rounded-3xl flex items-center justify-center shrink-0 shadow-inner",
                            meeting.meeting_type === 'one_on_one' ? 'bg-[#FF8A75]/10 text-[#FF8A75]' : 'bg-[#1a1a1a]/5 text-[#1a1a1a]/40'
                          )}>
                            {meeting.meeting_type === 'one_on_one' ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">
                                {format(new Date(meeting.start_time), 'MMM d, h:mm a')}
                              </p>
                              <span className="text-[9px] font-black px-2 py-0.5 bg-[#FF8A75]/10 rounded-full text-[#FF8A75] border border-[#FF8A75]/10">
                                {meeting.duration_minutes || 45}m ritual
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{meeting.topic}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                Guided by {meeting.host?.full_name || 'Master Instructor'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={meeting.join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-[#FF8A75] transition-all group-hover:scale-105 shadow-lg shadow-slate-900/10"
                          >
                            <ArrowUpRight className="w-5 h-5" />
                          </a>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.section>

            {/* Mirror (Right - 65%) */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-8 flex flex-col min-h-0"
            >
              <div className="flex-1 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 rounded-[3.5rem] p-10 flex flex-col relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8 shrink-0 pb-4 border-b border-[#FF8A75]/5">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-lg shadow-[#1a1a1a]/20">
                      <TrendingUp className="w-6 h-6 text-[#FF8A75]" />
                    </div>
                    <div>
                      <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1a1a] tracking-tight">Transformation Mirror</h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-60">Aura Progression</p>
                    </div>
                  </div>
                  <div className="px-5 py-2 bg-white/80 backdrop-blur-md border border-[#FF8A75]/10 rounded-full shadow-sm text-[11px] font-black uppercase text-[#FF8A75] tracking-widest">
                    Day {journeyDay}
                  </div>
                </div>

                <div className="flex-1 relative rounded-[3rem] overflow-hidden bg-white/30 border-[10px] border-white shadow-2xl min-h-0">
                  {latestPhoto?.photo_url ? (
                    <ImageComparison
                      beforeImage={firstPhoto?.photo_url || '/placeholder-before.jpg'}
                      afterImage={latestPhoto.photo_url}
                      altBefore="Base State"
                      altAfter="Today's Glow"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-white flex items-center justify-center shadow-lg">
                        <Sparkles className="w-8 h-8 text-[#FF8A75]/30" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 max-w-xs leading-relaxed">
                        Capturing your progressive radiance...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* Stats & Guidance Area */}
          <div className="shrink-0 flex gap-8 items-center">

            {/* Ritual Streak Tile */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-56 h-24 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 flex flex-col items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Activity className="w-16 h-16 text-[#1a1a1a]" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-5xl font-serif text-[#1a1a1a] tracking-tighter leading-none">{journeyDay}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/80 mt-1">Ritual Streak</p>
              </div>
            </motion.div>

            {/* Guidance Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 h-24 px-10 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-between border border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A75]/5 rounded-full blur-2xl -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF8A75]/60" />
              <div className="flex items-center gap-6 overflow-hidden relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-[#FF8A75]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-[#FF8A75]" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-60 mb-1">Elite Wisdom</p>
                  <p className="text-xl lg:text-2xl font-serif text-[#1a1a1a] truncate leading-none">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0 relative z-10">
                <div className="flex flex-col items-end text-right">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#1a1a1a]/40">Sanctuary Plan</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-0.5",
                    daysLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-[#FF8A75]'
                  )}>
                    {daysLeft === -1 ? 'Eternal Access' : `${daysLeft} Days Remaining`}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-[1.25rem] bg-[#1a1a1a] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
                  <Zap className="w-5 h-5 text-[#FF8A75]" />
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showRenewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-3xl"
          >
            <div className="absolute inset-0" onClick={() => setShowRenewModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative bg-[#FFFAF7] w-full max-w-md rounded-[4rem] border border-[#FF8A75]/10 shadow-3xl p-12 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
              <div className="text-center space-y-8">
                <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-white border border-[#FF8A75]/5 shadow-inner flex items-center justify-center text-[#FF8A75]">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-serif text-[#1a1a1a] tracking-tight">Renew Ritual</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Your sanctuary journey is reaching its current horizon.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <Link href="/student/plans" className="w-full h-16 bg-[#1a1a1a] text-white rounded-full text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02]">
                    Extend Sanctuary
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => setShowRenewModal(false)}
                    className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-[#FF8A75] transition-all"
                  >
                    I will continue later
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowRenewModal(false)}
                className="absolute top-10 right-10 h-10 w-10 bg-white border border-[#FF8A75]/5 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
