'use client';

import { useState, useEffect } from 'react';
import { OneOnOneChat } from '@/components/chat';
import { getStudentResources } from '@/lib/actions/resources';
import { getUpcomingMeetingsForStudent } from '@/lib/actions/meetings';
import { createClient } from '@/lib/supabase/client';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '@/lib/actions/journey';
import { toast } from 'sonner';
import { JourneyProgress } from '@/components/ui/journey-progress';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';
import { AnglePhotoTracker } from '@/components/ui/angle-photo-tracker';
import {
  Video,
  FileText,
  Eye,
  PlayCircle,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  X,
  Camera,
  Calendar,
  Clock,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfDay, format } from 'date-fns';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

interface Props {
  currentUser: Profile;
  hasSubscription: boolean;
  subscriptionStartDate: string | null;
  durationMonths: number;
  isTrial?: boolean;
}

export function StudentOneOnOneClient({ currentUser, hasSubscription, subscriptionStartDate, durationMonths, isTrial = false }: Props) {
  const currentDay = subscriptionStartDate
    ? Math.max(1, differenceInDays(startOfDay(new Date()), startOfDay(new Date(subscriptionStartDate))) + 1)
    : 1;

  const currentMonth = Math.ceil(currentDay / 30);
  const dayInMonth = ((currentDay - 1) % 30) + 1;
  const totalDurationDays = durationMonths * 30;

  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [activeDay, setActiveDay] = useState(currentDay);
  const [notesInput, setNotesInput] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  useEffect(() => {
    setActiveDay(currentDay);
  }, [currentDay]);

  const activeLog = journeyLogs.find(l => l.day_number === activeDay);
  const day1Log   = journeyLogs.find(l => l.day_number === 1);

  useEffect(() => {
    if (hasSubscription && currentUser) {
      const loadData = async () => {
        setIsLoadingResources(true);
        const [resData, logsData, meetingsData] = await Promise.all([
          getStudentResources(currentUser.id),
          getJourneyLogs(currentUser.id),
          getUpcomingMeetingsForStudent()
        ]);
        setResources(resData);
        setJourneyLogs(logsData);
        setUpcomingMeetings(meetingsData || []);
        setIsLoadingResources(false);
      };
      loadData();

      const supabase = createClient();
      const channel = supabase
        .channel(`resources:${currentUser.id}-${Math.random().toString(36).slice(2, 9)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${currentUser.id}` },
          (payload) => setResources((prev) => [payload.new as StudentResource, ...prev])
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [hasSubscription, currentUser]);

  const handleSavePhotos = async (photos: { front?: { base64: string; mimeType: string }; left?: { base64: string; mimeType: string }; right?: { base64: string; mimeType: string } }) => {
    setIsSavingLog(true);
    try {
      const { success, data } = await saveDailyCheckIn(
        currentUser.id,
        activeDay,
        null,
        null,
        null,
        photos
      );
      if (success && data) {
        setJourneyLogs(prev => [...prev.filter(l => l.day_number !== activeDay), data]);
        toast.success('Progress Saved! 📸', { description: `Your Day ${activeDay} photos have been uploaded.` });
      } else {
        toast.error('Failed to save photos');
      }
    } catch {
      toast.error('Network Error', { description: 'Failed to communicate with the server.' });
    }
    setIsSavingLog(false);
  };

  useEffect(() => {
    setNotesInput(activeLog?.notes || '');
  }, [activeDay, activeLog]);

  const studentMeetings = upcomingMeetings.filter(m => m.meeting_type === 'one_on_one');
  const nextMeeting = studentMeetings.length > 0 ? studentMeetings[0] : null;
  const [isJoinEnabled, setIsJoinEnabled] = useState(false);

  useEffect(() => {
    if (!nextMeeting) return;
    const checkTime = () => {
      const meetingTime = new Date(nextMeeting.start_time).getTime();
      const now = Date.now();
      setIsJoinEnabled(meetingTime - now <= 300000);
    };
    checkTime();
    const interval = setInterval(checkTime, 10000);
    return () => clearInterval(interval);
  }, [nextMeeting]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const rawName = currentUser.full_name?.split(' ')[0] || 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  return (
    <div className="min-h-full font-jakarta text-[#1a1a1a] relative">

      {subscriptionStartDate && (
        <PlanExpiryPill 
          subscriptionStartDate={subscriptionStartDate} 
          planName="One-on-One Mastery"
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 lg:space-y-6">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-aktiv font-bold text-[#1a1a1a] tracking-tight leading-none">
              Personal <span className="text-[#FF8A75]">Journey</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">
              Your dedicated 1-on-1 face yoga path
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isTrial && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#1a1a1a] rounded-2xl shadow-md">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">Status</span>
                <div className="w-px h-3 bg-white/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FF8A75]">Trial Active</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Flame className="w-4 h-4 text-[#FF8A75]" />
              <div>
                <p className="text-lg font-aktiv font-bold text-[#1a1a1a] leading-none">{currentDay}</p>
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mt-0.5">Day</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">

          {/* ── Left Column: Main Content ── */}
          <div className="md:col-span-7 xl:col-span-8 flex flex-col gap-5 min-h-0">

            {/* Next Session Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              {nextMeeting ? (
                <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 sm:p-6 hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-shadow duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFFAF7] rounded-full border border-[#FF8A75]/10">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse shadow-[0_0_6px_#FF8A75]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">Upcoming Session</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-aktiv font-bold text-[#1a1a1a] tracking-tight truncate">{nextMeeting.topic}</h3>
                      <div className="flex items-center gap-6 pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-[#1a1a1a]">
                            {new Date(nextMeeting.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-[#1a1a1a]">
                            {new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      disabled={!isJoinEnabled}
                      onClick={() => window.open(nextMeeting.join_url, '_blank')}
                      className={cn(
                        "flex items-center justify-center gap-2.5 px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all w-full md:w-auto shadow-sm",
                        isJoinEnabled
                          ? "bg-[#1a1a1a] text-white hover:bg-[#FF8A75] hover:scale-[1.02] active:scale-95"
                          : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                      )}
                    >
                      {isJoinEnabled ? "Join Session" : "Starting Soon"}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center gap-3 min-h-[140px]">
                  <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Video className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-aktiv font-bold text-slate-400">No sessions scheduled</p>
                  <p className="text-[10px] text-slate-300 font-medium">Your next 1-on-1 session will appear here</p>
                </div>
              )}
            </motion.div>

            {/* Progress Tracker Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-[#FF8A75]" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-aktiv font-bold text-[#1a1a1a] tracking-tight">Progress Tracker</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Month {currentMonth}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-[#FFFAF7] border border-[#FF8A75]/10 rounded-xl text-[10px] font-aktiv font-black uppercase text-[#FF8A75] tracking-widest">
                  Day {currentDay}
                </div>
              </div>

              <div className="py-4 px-3 sm:px-5 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
                <JourneyProgress
                  currentDay={dayInMonth}
                  activeDay={((activeDay - 1) % 30) + 1}
                  onSelectDay={(day) => setActiveDay((currentMonth - 1) * 30 + day)}
                  completedDays={new Set(journeyLogs.map(l => l.day_number).filter(d => Math.ceil(d / 30) === currentMonth).map(d => ((d - 1) % 30) + 1))}
                />
              </div>
            </motion.div>

            {/* Photo Tracker + Notes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5"
            >
              {/* 3-Angle Photo Tracker */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-50">
                  <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#FF8A75]" />
                  </div>
                  <div>
                    <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] tracking-tight">3-Angle Progress</h3>
                    <p className="text-[9px] font-medium text-slate-400 mt-0.5">Front, Left & Right profiles</p>
                  </div>
                </div>
                <AnglePhotoTracker
                  dayNumber={activeDay}
                  savedPhotos={{
                    front: activeLog?.photo_url ?? [...journeyLogs].filter(l => l.photo_url).sort((a, b) => b.day_number - a.day_number)[0]?.photo_url ?? null,
                    left:  activeLog?.photo_url_left ?? [...journeyLogs].filter(l => l.photo_url_left).sort((a, b) => b.day_number - a.day_number)[0]?.photo_url_left ?? null,
                    right: activeLog?.photo_url_right ?? [...journeyLogs].filter(l => l.photo_url_right).sort((a, b) => b.day_number - a.day_number)[0]?.photo_url_right ?? null,
                  }}
                  day1Photos={{
                    front: day1Log?.photo_url ?? null,
                    left:  day1Log?.photo_url_left ?? null,
                    right: day1Log?.photo_url_right ?? null,
                  }}
                  onSave={handleSavePhotos}
                  isSaving={isSavingLog}
                  accentColor="#FF8A75"
                  allLogs={journeyLogs}
                />
              </div>

              {/* Notes */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">📝 Notes — Day {activeDay}</span>
                </div>
                <div className="rounded-2xl bg-[#FFFAF7] p-4 border border-slate-100">
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full resize-none bg-transparent text-slate-700 text-sm font-medium outline-none border-none focus:ring-0 font-jakarta min-h-[80px]"
                    placeholder="How are you feeling today? Note any changes you noticed."
                  />
                </div>
                <button
                  onClick={async () => {
                    setIsSavingLog(true);
                    const { success } = await saveDailyCheckIn(currentUser.id, activeDay, notesInput.trim() || null);
                    if (success) toast.success('Notes saved!');
                    setIsSavingLog(false);
                  }}
                  disabled={isSavingLog}
                  className="h-10 w-full rounded-xl bg-[#1a1a1a] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-colors duration-300 disabled:opacity-60"
                >
                  {isSavingLog ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Right Column: Chat + Resources (Desktop/Tablet) ── */}
          <div className="md:col-span-5 xl:col-span-4 flex flex-col gap-5 min-h-0">

            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-[650px] bg-white rounded-[1.75rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-shadow duration-500"
            >
              <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#FF8A75]/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#FF8A75]" />
                </div>
                <span className="text-xs font-aktiv font-bold text-[#1a1a1a]">Instructor Chat</span>
              </div>
              <div className="flex-1 flex flex-col relative">
                <OneOnOneChat currentUser={currentUser} hideHeader={true} className="flex-1 w-full border-0" />
              </div>
            </motion.div>

            {/* Resources Panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1 bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 flex flex-col min-h-[200px] hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-shadow duration-500"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-50">
                <div className="h-8 w-8 rounded-lg bg-[#FF8A75]/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#FF8A75]" />
                </div>
                <span className="text-xs font-aktiv font-bold text-[#1a1a1a]">Shared Resources</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                {resources.length > 0 ? (
                  resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FFFAF7] border border-slate-50 hover:border-[#FF8A75]/15 transition-all">
                      <div className="flex items-center gap-3 truncate">
                        <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-[#FF8A75] shadow-sm shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold truncate text-[#1a1a1a]">{res.file_name}</span>
                      </div>
                      <button
                        onClick={() => window.open(res.file_url, '_blank')}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-[#FF8A75] hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 px-6 gap-4 text-center">
                    <div className="h-16 w-16 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                      <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">Your Resource Library is Ready</p>
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed max-w-[180px] mx-auto">
                        Once your instructor shares custom guides or routines, they will appear here for you to access anytime.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
         <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shadow-xl relative"
         >
            <MessageSquare className="w-6 h-6" />
            <div className="absolute top-0 right-0 h-3.5 w-3.5 bg-[#FF8A75] rounded-full border-2 border-white" />
         </motion.button>
      </div>

      {/* Mobile Chat Drawer */}
      <AnimatePresence>
         {isChatOpen && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsChatOpen(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden"
               />
               <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-x-0 bottom-0 top-12 bg-white rounded-t-[2rem] z-[80] lg:hidden flex flex-col overflow-hidden shadow-2xl"
               >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center">
                           <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                           <h3 className="text-base font-aktiv font-bold">Instructor Chat</h3>
                           <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75]">Private Channel</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsChatOpen(false)}
                        className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="flex-1 flex flex-col relative">
                     <OneOnOneChat currentUser={currentUser} hideHeader={true} className="flex-1 w-full border-0" />
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
