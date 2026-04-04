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
  TrendingUp
} from 'lucide-react';
import { format, addMinutes, isAfter } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { createClient } from '@/lib/supabase/client';

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
    // 1. Subscribe to real-time meeting updates
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
          // Check if this meeting relates to the student
          const isOneOnOne = payload.new?.student_id === profile.id || payload.old?.student_id === profile.id;
          const isRelevantGroup = payload.new?.meeting_type === 'group_session' && batchIds.includes(payload.new?.batch_id);
          const isDeletedGroup = payload.old?.meeting_type === 'group_session' && batchIds.includes(payload.old?.batch_id);

          if (!isOneOnOne && !isRelevantGroup && !isDeletedGroup) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch enriched meeting with host details
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

    // 2. Auto-expiry interval (every 10s for snappier UI)
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
  }, [supabase, profile.id]);

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

      {/* ── Website Style Auroras ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.08)_0%,transparent_50%)] blur-3xl" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.05)_0%,transparent_60%)] -translate-y-1/2 translate-x-1/3 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">

        {/* ── Clean Website Header ── */}
        <header className="shrink-0 px-8 lg:px-12 py-6 flex items-center justify-between border-b border-[#FF8A75]/5">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="h-12 w-1.5 flex bg-[#FF8A75] rounded-full" />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-black font-serif">
                {firstName}&apos;s <span className="text-[#FF8A75]">Sanctuary</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-80">
                {format(new Date(), 'EEEE, MMMM do')}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-6 py-2.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full shadow-sm">
              <Activity className="w-4 h-4 text-[#FF8A75]" />
              <span className="text-[11px] font-bold text-slate-600 tracking-wide uppercase">Active Ritual</span>
            </div>

            <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 text-slate-400 hover:text-[#FF8A75] transition-all shadow-sm">
              <Bell className="w-5 h-5" />
            </button>

            <div className="h-12 w-12 rounded-2xl border-2 border-[#FF8A75]/10 p-0.5 bg-white shadow-md overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover rounded-xl" alt={profile.full_name} />
              ) : (
                <div className="w-full h-full bg-[#FFFAF7] flex items-center justify-center rounded-xl">
                  <User className="w-6 h-6 text-[#FF8A75]" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Canvas ── */}
        <main className="flex-1 px-8 lg:px-12 pb-8 flex flex-col gap-6 overflow-hidden mt-2">

          {/* Hero Row (Synchronicity & Mirror) */}
          <div className="flex-[2] grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-0">

            {/* Left: Synchronicity (40%) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5 flex flex-col min-h-0"
            >
              <div className="flex-1 zen-glass rounded-[3rem] p-8 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#FF8A75] tracking-tight">Synchronicity</h2>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF8A75]">Next Sessions</p>
                    </div>
                  </div>
                  {meetings.length > 0 && (
                    <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full">
                      {meetings.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-zen-scrollbar space-y-4">
                  {meetings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                      <Clock className="w-12 h-12 text-slate-400 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Clear Orbit Today</p>
                    </div>
                  ) : (
                    meetings.map((meeting, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={meeting.id}
                        className="p-6 rounded-[2rem] bg-white/40 border border-white/60 hover:bg-white hover:shadow-2xl hover:shadow-[#FF8A75]/5 transition-all duration-500 group"
                      >
                        <div className="flex items-start gap-5">
                          <div className={`h-14 w-14 rounded-3xl flex items-center justify-center shrink-0 shadow-inner ${meeting.meeting_type === 'one_on_one' ? 'bg-[#FF8A75]/10 text-[#FF8A75]' : 'bg-[#006B57]/10 text-[#006B57]'
                            }`}>
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
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${meeting.meeting_type === 'one_on_one' ? 'bg-slate-900 text-white' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'
                                }`}>
                                {meeting.meeting_type === 'one_on_one' ? 'Personal' : 'Collective'}
                              </span>
                            </div>
                            <h4 className="text-sm md:text-base font-bold text-slate-900 truncate mb-0.5">{meeting.topic}</h4>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-slate-100 overflow-hidden border border-white shrink-0">
                                {meeting.host?.avatar_url ? (
                                  <img src={meeting.host.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75] text-[6px]">
                                    {meeting.host?.full_name?.charAt(0) || 'M'}
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-[#FF8A75]/70 uppercase tracking-wider">
                                Guided by {meeting.host?.full_name || 'Master Instructor'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={meeting.join_url}
                            target="_blank"
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

            {/* Right: Transformation Mirror (60%) */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7 flex flex-col min-h-0"
            >
              <div className="flex-1 zen-glass rounded-[3.5rem] p-10 flex flex-col shadow-2xl shadow-[#FF8A75]/5 border border-white/80 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[#FF8A75] tracking-tight">Transformation Mirror</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#FF8A75]">Aura Progression</p>
                  </div>
                  <div className="px-5 py-2 bg-white/80 backdrop-blur-md border border-[#FF8A75]/10 rounded-full shadow-sm text-[11px] font-bold uppercase text-slate-600">
                    Day {journeyDay}
                  </div>
                </div>

                <div className="flex-1 relative rounded-[3rem] overflow-hidden bg-white/30 border-8 border-white/80 shadow-2xl min-h-0">
                  {latestPhoto?.photo_url ? (
                    <ImageComparison
                      beforeImage={firstPhoto?.photo_url || '/placeholder-before.jpg'}
                      afterImage={latestPhoto.photo_url}
                      altBefore="Base State"
                      altAfter="Today&apos;s Glow"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-[#FF8A75]/5 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-[#FF8A75]/30" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 italic max-w-xs">
                        Capturing your progressive radiance...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* Stats & Guidance Area */}
          <div className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Ritual Streak Tile */}
            <div className="lg:col-span-3">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 rounded-[2rem] bg-white border border-[#FF8A75]/20 shadow-xl shadow-[#FF8A75]/5 flex flex-col items-center justify-center gap-2"
              >
                <div className="text-center">
                  <p className="text-5xl font-black text-[#FF8A75] tracking-tighter leading-none">{journeyDay}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/60 mt-2">Ritual Streak</p>
                </div>
              </motion.div>
            </div>

            {/* Guidance Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-9 h-20 px-10 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-between gap-8 border border-white/80 shadow-2xl shadow-[#FF8A75]/5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-[#FF8A75]/20" />
              <div className="flex items-center gap-6 overflow-hidden">
                <div className="h-10 w-10 rounded-2xl bg-[#FF8A75]/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-[#FF8A75]" />
                </div>
                <p className="text-sm font-bold text-slate-900 leading-relaxed italic truncate">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <div className="flex flex-col items-end text-right">
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75]">Sanctuary Plan</p>
                  <p className={`text-[11px] font-black uppercase tracking-tight ${daysLeft <= 5 ? 'text-rose-500' : 'text-[#FF8A75]'}`}>
                    {daysLeft === -1 ? 'Eternal Access' : `${daysLeft} Days Remaining`}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#FF8A75] flex items-center justify-center shadow-lg shadow-[#FF8A75]/20">
                  <Zap className="w-5 h-5 text-white" />
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
              className="relative bg-[#FFFAF7] w-full max-w-md rounded-[4rem] border border-white shadow-3xl overflow-hidden p-12"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
              <div className="text-center space-y-8">
                <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-white shadow-inner flex items-center justify-center text-[#FF8A75]">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">Renew Ritual</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Your sanctuary journey is reaching its current horizon.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <Link href="/student/plans" className="w-full h-16 bg-slate-900 text-white rounded-full text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02]">
                    Extend Sanctuary
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => setShowRenewModal(false)}
                    className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] hover:text-[#FF8A75] transition-all"
                  >
                    I will continue later
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowRenewModal(false)}
                className="absolute top-10 right-10 h-10 w-10 bg-white rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-zen-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-zen-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-zen-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 138, 117, 0.1);
          border-radius: 10px;
        }
        .custom-zen-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 138, 117, 0.3);
        }
      `}</style>
    </div>
  );
}
