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
  Eye
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

const ImageComparison = dynamic(() => import('@/components/ui/image-comparison-slider').then(mod => mod.ImageComparison), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
});

interface StudentDashboardClientProps {
  profile: any;
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
  const supabase = createClient();

  const quote = QUOTES[journeyDay % QUOTES.length];

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
  }, [supabase, profile.id, batchIds, router]);

  const hasPhotos = journeyLogs.some(l => l.photo_url || l.photo_url_left || l.photo_url_right);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-5 lg:space-y-6 font-jakarta">

      {/* ── Greeting Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-xl border border-[#FF8A75]/10 shadow-sm mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-aktiv font-bold tracking-tight text-[#1a1a1a] leading-none">
            Welcome back, <span className="text-[#FF8A75]">{firstName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Flame className="w-4 h-4 text-[#FF8A75]" />
            <div>
              <p className="text-lg font-aktiv font-bold text-[#1a1a1a] leading-none">{journeyDay}</p>
              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mt-0.5">Day Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Timer className="w-4 h-4 text-[#FF8A75]" />
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
          <div className="flex-1 bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 lg:p-6 flex flex-col overflow-hidden relative group hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-shadow duration-500">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#FF8A75] flex items-center justify-center shadow-md shadow-[#FF8A75]/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-aktiv font-bold text-[#1a1a1a] tracking-tight">Upcoming Sessions</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Live & Scheduled</p>
                </div>
              </div>
              {meetings.length > 0 && (
                <span className="h-6 min-w-[1.5rem] px-1.5 bg-[#1a1a1a] text-white text-[10px] font-black rounded-lg flex items-center justify-center">
                  {meetings.length}
                </span>
              )}
            </div>

            {/* Meeting List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 min-h-[140px]">
              {meetings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-aktiv font-bold text-slate-400">No sessions today</h3>
                    <p className="text-[10px] text-slate-300 font-medium mt-1 max-w-[200px]">
                      Your upcoming sessions will appear here
                    </p>
                  </div>
                </div>
              ) : (
                meetings.map((meeting, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    key={meeting.id}
                    className="p-3.5 rounded-2xl bg-[#FFFAF7] border border-[#FF8A75]/5 hover:bg-white hover:border-[#FF8A75]/15 hover:shadow-md transition-all duration-300 group/card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative",
                        meeting.meeting_type === 'one_on_one'
                          ? 'bg-[#FF8A75]/10 text-[#FF8A75]'
                          : 'bg-slate-100 text-slate-400'
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
                        <h4 className="text-sm font-aktiv font-bold text-[#1a1a1a] truncate">{meeting.topic}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-[#FF8A75]">
                            {format(new Date(meeting.start_time), 'h:mm a')}
                          </span>
                          <span className="text-[9px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {meeting.host?.full_name || 'Instructor'}
                          </span>
                        </div>
                      </div>
                      <a
                        href={meeting.join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#1a1a1a] text-white hover:bg-[#FF8A75] transition-colors shadow-sm group-hover/card:scale-105 transition-transform"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))
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
          <div className="flex-1 bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 lg:p-6 flex flex-col relative overflow-hidden group hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-shadow duration-500">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-[#FF8A75]" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-aktiv font-bold text-[#1a1a1a] tracking-tight">Transformation Mirror</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Your Progress</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-[#FFFAF7] border border-[#FF8A75]/10 rounded-xl text-[10px] font-aktiv font-black uppercase text-[#FF8A75] tracking-widest">
                Day {journeyDay}
              </div>
            </div>

            {/* Angle Tabs */}
            <div className="flex gap-1.5 mb-4 bg-slate-50 p-1 rounded-xl w-fit">
              {[
                { id: 'Left', key: 'photo_url_left' },
                { id: 'Front', key: 'photo_url' },
                { id: 'Right', key: 'photo_url_right' }
              ].map((angle) => {
                const hasPhoto = journeyLogs.some(l => l[angle.key]);
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
                          ? "text-slate-400 hover:text-[#FF8A75] hover:bg-white"
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
                .filter(a => a.id === selectedAngle)
                .map((angle) => {
                  const beforeLog = journeyLogs.find(l => l[angle.key]);
                  const afterLog = [...journeyLogs].reverse().find(l => l[angle.key]);
                  
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
                          beforeLabel="Start"
                          afterLabel="Now"
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
        {(activePlanTypes.includes('group_session') || isTrial) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push('/student/group-session')}
            className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#FF8A75]/20 hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#446187]/10 text-[#446187] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#446187] transition-colors" />
            </div>
            <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">Live Group</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#446187] mt-0.5">21-Day Ritual</p>
          </motion.div>
        )}

        {/* One-on-One Card */}
        {activePlanTypes.includes('one_on_one') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push('/student/one-on-one')}
            className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#FF8A75]/20 hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF8A75] transition-colors" />
            </div>
            <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">Personal</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FF8A75] mt-0.5">1-on-1 Sessions</p>
          </motion.div>
        )}

        {/* Plans Card (always visible) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => router.push('/student/plans')}
          className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#FF8A75]/20 hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-all cursor-pointer"
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
      </div>

      {/* ── Wisdom Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow"
      >
        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#FF8A75] to-[#FF8A75]/30 rounded-r-full" />
        <div className="h-9 w-9 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[#FF8A75]" />
        </div>
        <p className="flex-1 text-sm lg:text-base text-slate-600 italic font-jakarta leading-snug line-clamp-1">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-300">Plan Status</p>
            <p className={cn(
              "text-[10px] font-aktiv font-black uppercase tracking-wider",
              daysLeft <= 5 && daysLeft !== -1 ? 'text-rose-500' : 'text-[#FF8A75]'
            )}>
              {daysLeft === -1 ? 'Eternal Access' : `${daysLeft} Days Left`}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#FF8A75]" />
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
