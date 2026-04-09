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
import { submitExitFeedback } from '@/app/actions/feedback';
import { toast } from 'sonner';

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
  const rawName = profile.full_name?.split(' ')[0] || 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const [showRenewModal, setShowRenewModal] = React.useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(false);
  const [feedbackState, setFeedbackState] = React.useState({ rating: 5, comments: '', improvement_suggestions: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
    <div className="min-h-[100dvh] lg:h-[100dvh] relative flex flex-col bg-[#FFFAF7] text-slate-900 font-sans selection:bg-[#FF8A75]/20 overflow-x-hidden lg:overflow-hidden">

      {/* ── Sanctuary Style Auroras ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.06)_0%,transparent_50%)] blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_60%)] translate-y-1/2 translate-x-1/4 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">

        {/* ── Sanctuary Header ── */}
        <header className="shrink-0 px-5 sm:px-8 lg:px-12 py-5 lg:py-8 flex items-center justify-between border-b border-[#FF8A75]/5">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 lg:gap-3"
          >
            <div className="inline-flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 shadow-sm self-start">
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] shadow-[0_0_8px_#FF8A75]" />
              <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] text-[#FF8A75] leading-none">Curator Presence Active</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-serif tracking-tight text-[#1a1a1a] leading-none">
                {firstName}&apos;s <span className="text-[#FF8A75] underline decoration-[#FF8A75]/20 underline-offset-4 lg:underline-offset-8">Sanctuary</span>
              </h1>
              <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] lg:tracking-[0.4em] text-slate-400 mt-1.5 lg:mt-2 opacity-80">
                {format(new Date(), 'EEEE, MMMM do')}
              </p>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-3 px-4 lg:px-6 py-2 lg:py-3 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 rounded-full shadow-sm">
             <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Active Ritual</span>
          </div>
        </header>

        {/* ── Main Canvas ── */}
        <main className="flex-1 px-5 sm:px-8 lg:px-12 pb-5 lg:pb-8 flex flex-col gap-4 lg:gap-8 overflow-y-auto lg:overflow-hidden mt-2 no-scrollbar">

          {/* Hero Row (Synchronicity & Mirror) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-10 items-stretch min-h-0">

            {/* Synchronicity (Left - 35%) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 flex flex-col min-h-0"
            >
              <div className="flex-1 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-10 flex flex-col overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF8A75]/5 to-transparent rounded-tr-[2rem] lg:rounded-tr-[3.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-5 lg:mb-8 shrink-0 relative pb-4 border-b border-[#FF8A75]/5">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="h-10 w-10 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl bg-[#FF8A75] flex items-center justify-center shadow-lg shadow-[#FF8A75]/20">
                      <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-4xl font-serif text-[#1a1a1a] tracking-tight">Synchronicity</h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-60">Live Experience</p>
                    </div>
                  </div>
                  {meetings.length > 0 && (
                    <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full">
                      {meetings.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3 lg:space-y-4 min-h-[120px] lg:min-h-0">
                  {meetings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 lg:p-12 space-y-4 opacity-40">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-white/40 backdrop-blur-md border border-[#FF8A75]/10 flex items-center justify-center mb-4 lg:mb-6 shadow-sm">
                        <Radio className="w-6 h-6 lg:w-8 lg:h-8 text-[#FF8A75]/20" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg lg:text-xl font-serif text-[#1a1a1a] tracking-tight leading-tight">No Synchronicity Found</h3>
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
                        className="p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2.5rem] bg-white/60 border border-white/80 hover:bg-white hover:shadow-2xl hover:shadow-[#FF8A75]/5 transition-all duration-500 group"
                      >
                        <div className="flex items-start gap-3 lg:gap-5">
                          <div className={cn(
                            "h-11 w-11 lg:h-14 lg:w-14 rounded-2xl lg:rounded-3xl flex items-center justify-center shrink-0 shadow-inner",
                            meeting.meeting_type === 'one_on_one' ? 'bg-[#FF8A75]/10 text-[#FF8A75]' : 'bg-[#1a1a1a]/5 text-[#1a1a1a]/40'
                          )}>
                            {meeting.meeting_type === 'one_on_one' ? <User className="w-5 h-5 lg:w-6 lg:h-6" /> : <Users className="w-5 h-5 lg:w-6 lg:h-6" />}
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
                            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                              Guided by {meeting.host?.full_name || 'Master Instructor'}
                            </p>
                          </div>
                          <a
                            href={meeting.join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 lg:h-12 lg:w-12 flex items-center justify-center rounded-xl lg:rounded-2xl bg-slate-900 text-white hover:bg-[#FF8A75] transition-all group-hover:scale-105 shadow-lg shadow-slate-900/10"
                          >
                            <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5" />
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
              <div className="flex-1 bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-10 flex flex-col relative overflow-hidden group">
                <div className="flex items-center justify-between mb-5 lg:mb-8 shrink-0 pb-4 border-b border-[#FF8A75]/5">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="h-10 w-10 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-lg shadow-[#1a1a1a]/20">
                      <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-[#FF8A75]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-4xl font-serif text-[#1a1a1a] tracking-tight">Transformation Mirror</h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-60">Aura Progression</p>
                    </div>
                  </div>
                  <div className="px-3 lg:px-5 py-1.5 lg:py-2 bg-white/80 backdrop-blur-md border border-[#FF8A75]/10 rounded-full shadow-sm text-[10px] lg:text-[11px] font-black uppercase text-[#FF8A75] tracking-widest">
                    Day {journeyDay}
                  </div>
                </div>

                <div className="flex-1 relative rounded-[1.5rem] lg:rounded-[3rem] overflow-hidden bg-white/30 border-[6px] lg:border-[10px] border-white shadow-2xl min-h-[200px] lg:min-h-0">
                  {latestPhoto?.photo_url ? (
                    <ImageComparison
                      beforeImage={firstPhoto?.photo_url || '/placeholder-before.jpg'}
                      afterImage={latestPhoto.photo_url}
                      altBefore="Base State"
                      altAfter="Today's Glow"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 lg:p-12 space-y-4">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-[1.5rem] lg:rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-white flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-[#FF8A75]/30" />
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
          <div className="shrink-0 flex flex-col sm:flex-row gap-4 lg:gap-8 items-stretch sm:items-center">

            {/* Ritual Streak Tile */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="sm:w-48 lg:w-56 h-20 lg:h-24 rounded-[2rem] lg:rounded-[2.5rem] bg-white border border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Activity className="w-16 h-16 text-[#1a1a1a]" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-4xl lg:text-5xl font-serif text-[#1a1a1a] tracking-tighter leading-none">{journeyDay}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/80 mt-1">Ritual Streak</p>
              </div>
            </motion.div>

            {/* Guidance Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 min-h-[5rem] lg:h-24 px-5 lg:px-10 py-4 lg:py-0 bg-white/60 backdrop-blur-3xl rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-between border border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 relative overflow-hidden group gap-4"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A75]/5 rounded-full blur-2xl -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 lg:w-1.5 h-full bg-[#FF8A75]/60" />
              <div className="flex items-center gap-4 lg:gap-6 overflow-hidden relative z-10 flex-1">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl bg-[#FF8A75]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-[#FF8A75]" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-60 mb-1">Elite Wisdom</p>
                  <p className="text-base lg:text-xl xl:text-2xl font-serif text-[#1a1a1a] leading-tight line-clamp-2 lg:line-clamp-1">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 lg:gap-6 shrink-0 relative z-10">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#1a1a1a]/40">Sanctuary Plan</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-0.5",
                    daysLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-[#FF8A75]'
                  )}>
                    {daysLeft === -1 ? 'Eternal Access' : `${daysLeft} Days Left`}
                  </p>
                </div>
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-[1rem] lg:rounded-[1.25rem] bg-[#1a1a1a] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-[#FF8A75]" />
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {(showRenewModal || showFeedbackForm) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 bg-slate-900/20 backdrop-blur-3xl"
          >
            <div className="absolute inset-0" onClick={() => { setShowRenewModal(false); setShowFeedbackForm(false); }} />
            
            {showRenewModal && !showFeedbackForm && (
              <motion.div
                initial={{ scale: 0.95, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 40 }}
                className="relative bg-[#FFFAF7] w-full sm:max-w-md rounded-t-[3rem] sm:rounded-[3rem] lg:rounded-[4rem] border border-[#FF8A75]/10 shadow-2xl p-8 lg:p-12 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
                <div className="text-center space-y-6 lg:space-y-8">
                  <div className="mx-auto w-16 h-16 lg:w-24 lg:h-24 rounded-[2rem] lg:rounded-[2.5rem] bg-white border border-[#FF8A75]/5 shadow-inner flex items-center justify-center text-[#FF8A75]">
                    <AlertTriangle className="w-8 h-8 lg:w-10 lg:h-10" />
                  </div>
                  <div className="space-y-2 lg:space-y-3">
                    <h3 className="text-2xl lg:text-3xl font-serif text-[#1a1a1a] tracking-tight">Renew Ritual</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      Your sanctuary journey is reaching its current horizon.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2 lg:pt-4">
                    <Link href="/student/plans" className="w-full h-14 lg:h-16 bg-[#1a1a1a] text-white rounded-full text-[11px] lg:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02]">
                      Extend Sanctuary
                      <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Link>
                    <button
                      onClick={() => { setShowRenewModal(false); setShowFeedbackForm(true); }}
                      className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-[#FF8A75] transition-all py-2"
                    >
                      I will continue later
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowRenewModal(false)}
                  className="absolute top-6 right-6 lg:top-10 lg:right-10 h-9 w-9 lg:h-10 lg:w-10 bg-white border border-[#FF8A75]/5 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 shadow-sm"
                >
                  <X className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </motion.div>
            )}

            {showFeedbackForm && (
              <motion.div
                initial={{ scale: 0.95, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 40 }}
                className="relative bg-[#FFFAF7] w-full sm:max-w-xl rounded-t-[3rem] sm:rounded-[3rem] lg:rounded-[4rem] border border-[#FF8A75]/10 shadow-2xl p-8 lg:p-12 overflow-hidden max-h-[90dvh] overflow-y-auto no-scrollbar"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
                <div className="space-y-6 lg:space-y-8">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-[1.5rem] lg:rounded-[2rem] bg-white border border-[#FF8A75]/5 shadow-sm flex items-center justify-center shrink-0">
                      <Heart className="w-6 h-6 lg:w-8 lg:h-8 text-[#FF8A75]" />
                    </div>
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-serif text-[#1a1a1a] tracking-tight">Sanctuary Reflection</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-60">Share your journey</p>
                    </div>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">How was your experience?</label>
                      <textarea
                        value={feedbackState.comments}
                        onChange={(e) => setFeedbackState({ ...feedbackState, comments: e.target.value })}
                        placeholder="Your journey is eternal, but your time here is pausing. Share your reflections so our sanctuary can blossom..."
                        className="w-full h-28 lg:h-32 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-[#FF8A75]/10 bg-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20 text-sm italic font-serif placeholder:opacity-40 resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Suggestions for improvement?</label>
                       <input
                         type="text"
                         value={feedbackState.improvement_suggestions}
                         onChange={(e) => setFeedbackState({ ...feedbackState, improvement_suggestions: e.target.value })}
                         className="w-full h-13 px-5 lg:px-6 py-3.5 rounded-full border border-[#FF8A75]/10 bg-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20 text-sm"
                         placeholder="What could make your sanctuary even brighter?"
                       />
                    </div>

                    <button
                      disabled={isSubmitting || !feedbackState.comments.trim()}
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          await submitExitFeedback({
                            plan_taken: activePlanTypes.join(', ') || 'General',
                            rating: feedbackState.rating,
                            comments: feedbackState.comments,
                            improvement_suggestions: feedbackState.improvement_suggestions
                          });
                          toast.success('Your reflection has been gracefully received.');
                          setShowFeedbackForm(false);
                        } catch (err) {
                          toast.error('The universe could not receive your reflection. Try again.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full h-14 lg:h-16 bg-[#1a1a1a] text-white rounded-full text-[11px] lg:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Reflections...' : 'Submit Reflection'}
                      <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="absolute top-6 right-6 lg:top-10 lg:right-10 h-9 w-9 lg:h-10 lg:w-10 bg-white border border-[#FF8A75]/5 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 shadow-sm"
                >
                  <X className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
