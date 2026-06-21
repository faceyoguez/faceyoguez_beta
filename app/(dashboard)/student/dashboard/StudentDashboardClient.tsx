'use client';

import React from 'react';
import {
  Clock,
  Users,
  ArrowUpRight,
  User,
  Sparkles,
  Activity,
  Zap,
  TrendingUp,
  Radio,
  Calendar,
  Flame,
  Timer,
  Eye,
  MessageCircle,
  ShieldCheck,
  X,
  AlertTriangle
} from 'lucide-react';
import { format, addMinutes, isAfter } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { pixel } from '@/lib/pixel';

const ImageComparison = dynamic(() => import('@/components/ui/image-comparison-slider').then(mod => mod.ImageComparison), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
});

interface StudentDashboardClientProps {
  profile: any;
  emailVerified: boolean;
  phoneVerified: boolean;
  todaysMeetings: any[];
  activePlanTypes: string[];
  daysLeft: number;
  journeyDay: number;
  expiryDate: string | null;
  journeyLogs: any[];
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
  emailVerified,
  phoneVerified,
  todaysMeetings,
  activePlanTypes,
  daysLeft,
  journeyDay,
  expiryDate,
  journeyLogs,
  joinedDate,
  lastRenewed,
  batchIds,
  isTrial = false,
}: StudentDashboardClientProps) {
  const router = useRouter();
  const rawName = profile.full_name?.split(' ')[0] || 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const [meetings, setMeetings] = React.useState(todaysMeetings);
  const [selectedAngle, setSelectedAngle] = React.useState('Front');
  const [showVerificationBanner, setShowVerificationBanner] = React.useState(true);
  const [showPlanBanner, setShowPlanBanner] = React.useState(true);
  const supabase = createClient();

  const [timeFilter, setTimeFilter] = React.useState<'upcoming' | 'past'>('upcoming');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'group' | 'one_on_one' | 'assigned'>('all');

  const filteredMeetings = React.useMemo(() => {
    const filtered = meetings.filter((meeting) => {
      // 1. Time Filter
      const startTime = new Date(meeting.start_time).getTime();
      const durationMs = (meeting.duration_minutes || 45) * 60 * 1000;
      const isEnded = startTime + durationMs < Date.now();
      const isLive = meeting.calendar_event_id === 'LIVE';
      
      const isMeetingPast = !isLive && isEnded;

      if (timeFilter === 'upcoming' && isMeetingPast) return false;
      if (timeFilter === 'past' && !isMeetingPast) return false;

      // 2. Type Filter
      if (typeFilter === 'group' && meeting.meeting_type !== 'group_session') return false;
      if (typeFilter === 'one_on_one' && meeting.meeting_type !== 'one_on_one') return false;
      if (typeFilter === 'assigned' && meeting.student_id !== profile.id) return false;

      return true;
    });

    // For past meetings: show the 5 most recent (reverse-chronological)
    if (timeFilter === 'past') {
      return [...filtered].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).slice(0, 5);
    }

    // For upcoming meetings: show all (chronological)
    return [...filtered].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [meetings, timeFilter, typeFilter, profile.id]);

  const quote = QUOTES[journeyDay % QUOTES.length];

  const needsEmailVerification = !emailVerified;
  const needsPhoneVerification = false;
  const showBanner = showVerificationBanner && (needsEmailVerification || needsPhoneVerification);

  const isPlanEnding = daysLeft > 0 && daysLeft <= 5;
  const displayPlanBanner = showPlanBanner && isPlanEnding;

  let verificationMessage = '';
  if (needsEmailVerification) {
    verificationMessage = 'Please verify your email address to secure your account.';
  }

  // ─── Pixel: Dashboard Reached ───
  React.useEffect(() => {
    pixel.dashboardReached({ role: 'student' });
  }, []);

  // ─── Real-Time Subscription & Expiry Logic ───
  React.useEffect(() => {
    // Meetings channel
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
          const isAssigned = payload.new?.student_id === profile.id || payload.old?.student_id === profile.id;
          const hasGroupPlan = activePlanTypes.includes('group_session');
          const isRelevantGroup = hasGroupPlan && payload.new?.meeting_type === 'group_session' && batchIds.includes(payload.new?.batch_id);
          const isDeletedGroup = hasGroupPlan && payload.old?.meeting_type === 'group_session' && batchIds.includes(payload.old?.batch_id);

          if (!isAssigned && !isRelevantGroup && !isDeletedGroup) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data: enrichedMeeting } = await supabase
              .from('meetings')
              .select('*, host:profiles!meetings_host_id_fkey(full_name, avatar_url)')
              .eq('id', payload.new.id)
              .single();

            if (enrichedMeeting) {
              setMeetings((prev: any[]) => {
                const filtered = prev.filter((m: any) => m.id !== enrichedMeeting.id);
                const combined = [...filtered, enrichedMeeting].sort((a: any, b: any) =>
                  new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                );
                return combined;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setMeetings((prev: any[]) => prev.filter((m: any) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscription channel for real-time reactivity
    const subChannel = supabase
      .channel(`student-subs-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `student_id=eq.${profile.id}`
        },
        () => {
          console.log('Subscription change detected, refreshing dashboard...');
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(subChannel);
    };
  }, [supabase, profile.id, batchIds, router, activePlanTypes]);

  const hasPhotos = journeyLogs.some((l: any) => l.photo_url || l.photo_url_left || l.photo_url_right);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-5 lg:space-y-6 font-jakarta">

      {/* ── Verification Banner ── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm relative gap-4 sm:gap-0">
              <div className="flex items-start sm:items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                </div>
                <Link href="/student/profile#verify" className="flex-1 min-w-0 group/link">
                  <h3 className="text-sm font-aktiv font-bold text-red-900 group-hover/link:text-red-700 transition-colors">Account Verification Required</h3>
                  <p className="text-xs text-red-700 mt-0.5 group-hover/link:text-red-600 transition-colors flex flex-wrap items-center">
                    {verificationMessage}
                    <span className="sm:ml-2 text-red-600 font-bold underline hover:text-red-800 block sm:inline mt-1 sm:mt-0">Verify Now</span>
                  </p>
                </Link>
              </div>
              <div className="flex items-center shrink-0 ml-4">
                <button
                  onClick={() => setShowVerificationBanner(false)}
                  className="text-red-300 hover:text-red-600 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Plan Expiry Banner ── */}
      <AnimatePresence>
        {displayPlanBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm relative gap-4 sm:gap-0">
              <div className="flex items-start sm:items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <Link href="/student/plans" className="flex-1 min-w-0 group/link">
                  <h3 className="text-sm font-aktiv font-bold text-rose-900 group-hover/link:text-rose-700 transition-colors">Plan Ending Soon</h3>
                  <p className="text-xs text-rose-700 mt-0.5 group-hover/link:text-rose-600 transition-colors flex flex-wrap items-center">
                    Your sanctuary journey expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.
                    <span className="sm:ml-2 text-rose-600 font-bold underline hover:text-rose-800 block sm:inline mt-1 sm:mt-0">Renew Now</span>
                  </p>
                </Link>
              </div>
              <div className="flex items-center shrink-0 ml-4">
                <button
                  onClick={() => setShowPlanBanner(false)}
                  className="text-rose-300 hover:text-rose-600 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Greeting Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-aktiv font-bold tracking-tight text-[#1a1a1a] leading-tight">
            Welcome back, <span className="text-[#e76f51]">{firstName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Flame className="w-4 h-4 text-[#e76f51]" />
            <div>
              <p className="text-lg font-aktiv font-bold text-[#1a1a1a] leading-none">{journeyDay}</p>
              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mt-0.5">Day Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Timer className="w-4 h-4 text-[#e76f51]" />
            <div>
              <p className="text-lg font-aktiv font-bold text-[#1a1a1a] leading-none">
                {daysLeft === -1 ? '∞' : daysLeft}
              </p>
              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                {daysLeft === -1 ? 'Lifetime' : 'Days Left'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">

        {/* ── Sessions Card (Left) ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-1 lg:col-span-5 flex flex-col"
        >
          <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 lg:p-6 flex flex-col overflow-hidden relative group hover:shadow-lg hover:shadow-[#e76f51]/5 transition-shadow duration-500 h-[480px]">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#e76f51] flex items-center justify-center shadow-md shadow-[#e76f51]/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-aktiv font-bold text-[#1a1a1a] tracking-tight">Scheduled Sessions</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Live & Scheduled</p>
                </div>
              </div>
              {filteredMeetings.length > 0 && (
                <span className="h-6 min-w-[1.5rem] px-1.5 bg-[#1a1a1a] text-white text-[10px] font-black rounded-lg flex items-center justify-center">
                  {filteredMeetings.length}
                </span>
              )}
            </div>

            {/* Filter Tabs & Pills */}
            <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-slate-50">
              {/* Segmented Control for Time */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl w-full">
                <button
                  onClick={() => setTimeFilter('upcoming')}
                  className={cn(
                    "flex-1 text-[11px] font-aktiv font-bold py-1.5 rounded-lg transition-all duration-200",
                    timeFilter === 'upcoming'
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setTimeFilter('past')}
                  className={cn(
                    "flex-1 text-[11px] font-aktiv font-bold py-1.5 rounded-lg transition-all duration-200",
                    timeFilter === 'past'
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Past
                </button>
              </div>

              {/* Pills for Meeting Types */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'group', label: 'Group' },
                  { id: 'one_on_one', label: '1-on-1' },
                  { id: 'assigned', label: 'Assigned' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTypeFilter(type.id as any)}
                    className={cn(
                      "text-[9px] font-aktiv font-black uppercase tracking-wider px-2.5 py-1 rounded-md transition-all duration-200 border",
                      typeFilter === type.id
                        ? "bg-[#e76f51] text-white border-[#e76f51] shadow-sm"
                        : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 min-h-[140px]">
              {filteredMeetings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-aktiv font-bold text-slate-400">
                      {timeFilter === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-medium mt-1 max-w-[200px]">
                      {typeFilter === 'all'
                        ? `You have no ${timeFilter} sessions scheduled.`
                        : `You have no ${timeFilter} ${typeFilter === 'group' ? 'group' : typeFilter === 'one_on_one' ? '1-on-1' : 'assigned'} sessions.`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                filteredMeetings.map((meeting: any, i: number) => {
                  const isLive = meeting.calendar_event_id === 'LIVE';
                  const isGroup = meeting.meeting_type === 'group_session';
                  const startTime = new Date(meeting.start_time).getTime();
                  const durationMs = (meeting.duration_minutes || 45) * 60 * 1000;
                  const isEnded = !isLive && (startTime + durationMs < Date.now());
                  const isTimeReady = Date.now() >= startTime - 300000;
                  const canJoin = isGroup ? isLive : (isTimeReady && !isEnded);
                  const isManuallyAssigned = meeting.student_id === profile.id && !activePlanTypes.includes('one_on_one');

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      key={meeting.id}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-500 group/card relative overflow-hidden",
                        isLive 
                          ? "bg-[#e76f51] border-[#e76f51] shadow-[0_0_20px_rgba(231,111,81,0.4)]" 
                          : "bg-[#FFFAF7] border-[#e76f51]/5 hover:bg-white hover:border-[#e76f51]/15 hover:shadow-md"
                      )}
                    >
                      {isLive && (
                        <div className="absolute top-0 right-0 p-2">
                           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                              <span className="text-[7px] font-black uppercase tracking-widest text-white">Live</span>
                           </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative",
                          isLive ? "bg-white/20" : (meeting.meeting_type === 'one_on_one' ? 'bg-[#e76f51]/10 text-[#e76f51]' : 'bg-slate-100 text-slate-400')
                        )}>
                          {meeting.host?.avatar_url ? (
                            <Image 
                              src={meeting.host.avatar_url} 
                              alt={meeting.host.full_name || 'Host'} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            meeting.meeting_type === 'one_on_one' ? <User className="w-4.5 h-4.5" /> : <Users className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-sm font-aktiv font-bold truncate", isLive ? "text-white" : "text-[#1a1a1a]")}>{meeting.topic}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                            <span className={cn("text-[10px] font-bold", isLive ? "text-white/80" : "text-[#e76f51]")}>
                              {format(new Date(meeting.start_time), 'MMM d • h:mm a')}
                            </span>
                            <span className={cn("text-[9px]", isLive ? "text-white/40" : "text-slate-300")}>•</span>
                            <span className={cn("text-[10px] font-medium", isLive ? "text-white/80" : "text-slate-400")}>
                              {meeting.host?.full_name || 'Instructor'}
                            </span>
                            <span className={cn("text-[9px]", isLive ? "text-white/40" : "text-slate-300")}>•</span>
                            <span className={cn(
                              "text-[8px] font-aktiv font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                              isLive 
                                ? "bg-white/20 text-white" 
                                : isGroup
                                  ? "bg-[#e76f51]/10 text-[#e76f51]" 
                                  : isManuallyAssigned
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-50 text-blue-600"
                            )}>
                              {isGroup 
                                ? 'Group' 
                                : isManuallyAssigned
                                  ? 'Assigned'
                                  : '1-on-1'
                              }
                            </span>
                          </div>
                        </div>
                        {isEnded ? (
                          <span className={cn(
                            "text-[10px] font-aktiv font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shrink-0",
                            isLive ? "text-white bg-white/20" : "text-slate-400 bg-slate-100"
                          )}>
                            Ended
                          </span>
                        ) : (
                          <a
                            href={canJoin ? meeting.join_url : undefined}
                            onClick={(e) => !canJoin && e.preventDefault()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl transition-all duration-300 shrink-0",
                              isLive 
                                ? "bg-white text-[#e76f51] hover:scale-110" 
                                : canJoin
                                  ? "bg-[#1a1a1a] text-white hover:bg-[#e76f51] group-hover/card:scale-105"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                            )}
                            title={!canJoin ? "Instructor hasn't started the session yet" : "Join Session"}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Transformation Mirror (Right) ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1 lg:col-span-7 flex flex-col"
        >
          <div className="flex-1 bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 lg:p-6 flex flex-col relative overflow-hidden group hover:shadow-lg hover:shadow-[#e76f51]/5 transition-shadow duration-500">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-[#e76f51]" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-aktiv font-bold text-[#1a1a1a] tracking-tight">Transformation Mirror</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Your Progress</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-[#FFFAF7] border border-[#e76f51]/10 rounded-xl text-[10px] font-aktiv font-black uppercase text-[#e76f51] tracking-widest">
                Day {journeyDay}
              </div>
            </div>

            {/* Angle Tabs */}
            <div className="flex gap-1.5 mb-4 bg-slate-50 p-1 rounded-xl w-fit">
              {[
                { id: 'Left', key: 'photo_url_left' },
                { id: 'Front', key: 'photo_url' },
                { id: 'Right', key: 'photo_url_right' }
              ].map((angle: { id: string; key: string }) => {
                const hasPhoto = journeyLogs.some((l: any) => l[angle.key]);
                return (
                  <button
                    key={angle.id}
                    onClick={() => setSelectedAngle(angle.id)}
                    disabled={!hasPhoto}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                      selectedAngle === angle.id
                        ? "bg-[#1a1a1a] text-white shadow-md"
                        : hasPhoto
                          ? "text-slate-400 hover:text-[#e76f51] hover:bg-white"
                          : "opacity-30 cursor-not-allowed text-slate-300"
                    )}
                  >
                    {angle.id}
                  </button>
                );
              })}
            </div>

            {/* Mirror Content */}
            <div className="flex-1 flex flex-col relative min-h-[200px]">
              <AnimatePresence mode="wait">
                {[
                  { id: 'Front', key: 'photo_url' },
                  { id: 'Left', key: 'photo_url_left' },
                  { id: 'Right', key: 'photo_url_right' }
                ]
                .filter((a: { id: string; key: string }) => a.id === selectedAngle)
                .map((angle: { id: string; key: string }) => {
                  const beforeLog = journeyLogs.find((l: any) => l[angle.key]);
                  const afterLog = [...journeyLogs].reverse().find((l: any) => l[angle.key]);
                  
                  const before = beforeLog?.[angle.key];
                  const after = afterLog?.[angle.key];
                  
                  if (!after) return null;

                  return (
                    <motion.div 
                      key={angle.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner aspect-[16/10] max-h-[320px] mx-auto">
                        <ImageComparison
                          beforeImage={before || after}
                          afterImage={after}
                          altBefore="Day 1"
                          altAfter={`Day ${journeyDay}`}
                          beforeLabel="Day 1"
                          afterLabel={`Day ${journeyDay}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {!hasPhotos && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-aktiv font-bold text-slate-400">No photos yet</h3>
                    <p className="text-[10px] text-slate-300 font-medium mt-1 max-w-[220px]">
                      Your transformation progress photos will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>

      {/* ── Quick Actions Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Live Group Card */}
        {/* {(activePlanTypes.includes('group_session') || isTrial) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push('/student/group-session')}
            className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#e76f51]/20 hover:shadow-lg hover:shadow-[#e76f51]/5 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#e76f51]/10 text-[#e76f51] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#e76f51] transition-colors" />
            </div>
            <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">Live Group</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#e76f51] mt-0.5">21-Day Ritual</p>
          </motion.div>
        )} */}

        {/* One-on-One Card */}
        {activePlanTypes.includes('one_on_one') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push('/student/one-on-one')}
            className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#e76f51]/20 hover:shadow-lg hover:shadow-[#e76f51]/5 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#e76f51]/10 text-[#e76f51] flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#e76f51] transition-colors" />
            </div>
            <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">Personal</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#e76f51] mt-0.5">1-on-1 Sessions</p>
          </motion.div>
        )}

        {/* Plans Card (always visible) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => router.push('/student/plans')}
          className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#e76f51]/20 hover:shadow-lg hover:shadow-[#e76f51]/5 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">Plans</h3>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-500 mt-0.5">Explore Offers</p>
        </motion.div>

        {/* Consultation Card (always visible) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => router.push('/student/consultation')}
          className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#e76f51]/20 hover:shadow-lg hover:shadow-[#e76f51]/5 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#e76f51]/10 text-[#e76f51] flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#e76f51] transition-colors" />
          </div>
          <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">Consult</h3>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#e76f51] mt-0.5">1-on-1 Guidance</p>
        </motion.div>
      </div>

      {/* ── Wisdom Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow"
      >
        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#e76f51] to-[#e76f51]/30 rounded-r-full" />
        <div className="h-9 w-9 rounded-xl bg-[#e76f51]/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[#e76f51]" />
        </div>
        <p className="flex-1 text-sm lg:text-base text-slate-600 italic font-jakarta leading-snug line-clamp-2 sm:line-clamp-1">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-300">Plan Status</p>
            <p className={cn(
              "text-[10px] font-aktiv font-black uppercase tracking-wider",
              daysLeft <= 5 && daysLeft !== -1 ? 'text-rose-500' : 'text-[#e76f51]'
            )}>
              {daysLeft === -1 ? 'Eternal Access' : `${daysLeft} Days Left`}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#e76f51]" />
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
