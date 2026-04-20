'use client';

import { useState, useEffect, useRef } from 'react';
import { OneOnOneChat } from '@/components/chat';
import { getStudentResources } from '@/lib/actions/resources';
import { getUpcomingMeetingsForStudent } from '@/lib/actions/meetings';
import { createClient } from '@/lib/supabase/client';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '@/lib/actions/journey';
import { toast } from 'sonner';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MILESTONES } from '@/components/ui/journey-progress';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';
import {
  Video,
  FileText,
  Eye,
  Edit3,
  Camera,
  Image as ImageIcon,
  PlayCircle,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfDay } from 'date-fns';
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
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveDay(currentDay);
  }, [currentDay]);

  const activeLog = journeyLogs.find(l => l.day_number === activeDay);
  const day1Log = journeyLogs.find(l => l.day_number === 1);
  const hasDay1Photo = !!day1Log?.photo_url;
  
  // Use professional placeholders from assets
  const placeholderBefore = '/assets/before_img.png';
  const placeholderAfter = '/assets/after_img.png';

  const beforeImage = day1Log?.photo_url || placeholderBefore;
  let afterImage = activeLog?.photo_url || selectedImageBase64 || (activeDay >= 7 ? placeholderAfter : beforeImage);

  // Special logic for Day 1 placeholders
  if (activeDay === 1 && !hasDay1Photo) {
     afterImage = placeholderAfter;
  }

  // Slider is active on Day 1 (before upload) and Day 7+
  const isSliderActive = (activeDay === 1 && !hasDay1Photo) || (activeDay >= 7);

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

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return { icon: FileText };
    if (contentType.includes('image')) return { icon: ImageIcon };
    if (contentType.includes('video')) return { icon: PlayCircle };
    return { icon: FileText };
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setSelectedImageBase64(base64Str.split(',')[1]);
      setSelectedImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLog = async () => {
    setIsSavingLog(true);
    try {
      const { success, data } = await saveDailyCheckIn(
        currentUser.id,
        activeDay,
        notesInput.trim() || null,
        selectedImageBase64,
        selectedImageMime || 'image/jpeg'
      );
      if (success && data) {
        setJourneyLogs(prev => [...prev.filter(l => l.day_number !== activeDay), data]);
        setSelectedImageBase64(null);
        toast.success("Progress Saved!", { description: `Your journey notes for Day ${activeDay} have been updated.` });
      } else {
        toast.error("Failed to save progress", { description: "There was an issue saving your check-in." });
      }
    } catch (e) {
      toast.error("Network Error", { description: "Failed to communicate with the server." });
    }
    setIsSavingLog(false);
  };

  useEffect(() => {
    setNotesInput(activeLog?.notes || '');
    setSelectedImageBase64(null);
  }, [activeDay, activeLog]);

  const isPhotoDay = JOURNEY_MILESTONES.includes(((activeDay - 1) % 30) + 1) && !activeLog?.photo_url;
  // const isSliderActive is now defined above for unified logic
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FFFAF7] selection:bg-[#FF8A75]/20 font-jakarta text-[#1a1a1a] relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_70%)] blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_60%)] blur-3xl opacity-40" />
      </div>

      {subscriptionStartDate && (
        <PlanExpiryPill 
          subscriptionStartDate={subscriptionStartDate} 
          planName="One-on-One Mastery"
        />
      )}

      <div className="relative z-10 p-4 lg:p-6 flex-1 flex flex-col min-h-0 gap-6">
        <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#FF8A75]/10 mt-0">
          <div className="space-y-3 flex-1">
            <div className="space-y-0.5">
              <h1 className="text-2xl lg:text-3xl font-aktiv font-bold text-[#1a1a1a] tracking-tight leading-[1.1]">
                Your Dedicated Path
              </h1>
              <p className="text-xs font-medium text-[#6B7280]/80 max-w-xl leading-relaxed">
                Your personal face yoga journey, guided by an expert instructor.
              </p>
            </div>
          </div>
          {isTrial && (
            <div className="inline-flex px-6 py-3 bg-slate-900 rounded-2xl items-center justify-center shadow-2xl gap-4 shrink-0">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] leading-none">Status</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[10px] font-black uppercase text-[#FF8A75] tracking-widest leading-none">Trial Access Active</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8 relative z-10 overflow-y-auto custom-scrollbar pr-0 lg:pr-4">
            <div className="w-full shrink-0">
              {nextMeeting ? (
                <div className="group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 border border-[#FF8A75]/10 bg-white/60 backdrop-blur-3xl transition-all duration-700 hover:border-[#FF8A75]/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-[#FF8A75]/5">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white/60 text-[#FF8A75] rounded-full text-[8.5px] font-black uppercase tracking-[0.3em] border border-[#FF8A75]/5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse shadow-[0_0_8px_#FF8A75]" />
                      Upcoming Session
                    </div>
                    <h3 className="text-xl sm:text-3xl font-aktiv font-bold text-[#1a1a1a] tracking-tight leading-tight truncate">{nextMeeting.topic}</h3>
                    <div className="flex items-center gap-8 pt-6 border-t border-[#FF8A75]/10">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-black tracking-[0.3em] text-[#6B7280]/40 leading-none">Session Date</p>
                        <p className="text-sm font-bold text-[#1a1a1a] tracking-tight">{new Date(nextMeeting.start_time).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-black tracking-[0.3em] text-[#6B7280]/40 leading-none">Moment</p>
                        <p className="text-sm font-bold text-[#1a1a1a] tracking-tight">{new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      disabled={!isJoinEnabled}
                      onClick={() => window.open(nextMeeting.join_url, '_blank')}
                      className={cn(
                        "flex items-center justify-center gap-3 px-8 h-12 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 w-full shadow-lg",
                        isJoinEnabled
                          ? "bg-slate-900 text-white hover:bg-[#FF8A75] hover:scale-[1.02] active:scale-95"
                          : "bg-white/40 text-slate-300 border border-slate-200 cursor-not-allowed"
                      )}
                    >
                      {isJoinEnabled ? "Join Session" : "Starting Soon"}
                      <ArrowUpRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] w-full min-h-[180px] sm:min-h-[220px] shadow-sm border border-[#FF8A75]/20 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#FF8A75]/15 via-white to-[#FF8A75]/15">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.05)_0%,transparent_70%)]" />
                  <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/90 backdrop-blur-md border border-[#FF8A75]/20 flex items-center justify-center shadow-md">
                      <Video className="w-5 h-5 text-[#FF8A75]/60" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/80 text-center">No Sessions Scheduled</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 space-y-6 bg-white/60 backdrop-blur-3xl border border-[#FF8A75]/10 relative overflow-hidden shadow-xl shadow-[#FF8A75]/5 shrink-0">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_70%)] blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-4 relative z-10">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-[#FFFAF7] rounded-full border border-[#FF8A75]/10 text-[#FF8A75] text-[8.5px] font-black uppercase tracking-[0.3em] shadow-sm">
                    <TrendingUp className="w-3 h-3" />
                    Progress Tracker
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-aktiv font-bold text-[#1a1a1a] tracking-tight leading-none">Your Progress</h3>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <div className="px-4 sm:px-6 h-12 sm:h-14 bg-white/60 border border-[#FF8A75]/10 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[7px] sm:text-[8px] font-black text-[#FF8A75] uppercase tracking-[0.3em] mb-0.5">Project</span>
                    <span className="text-sm sm:text-lg font-bold text-[#1a1a1a] tracking-tight">Month {currentMonth}</span>
                  </div>
                  <div className="px-4 sm:px-6 h-12 sm:h-14 bg-slate-900 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[7px] sm:text-[8px] font-black text-[#FF8A75] uppercase tracking-[0.3em] mb-0.5">Current</span>
                    <span className="text-sm sm:text-lg font-bold text-white tracking-tight">Day {currentDay}/{totalDurationDays}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 py-8 sm:py-12 px-5 sm:px-8 bg-slate-50/50 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 overflow-x-auto no-scrollbar shadow-inner">
                <JourneyProgress
                  currentDay={dayInMonth}
                  activeDay={((activeDay - 1) % 30) + 1}
                  onSelectDay={(day) => setActiveDay((currentMonth - 1) * 30 + day)}
                  completedDays={new Set(journeyLogs.map(l => l.day_number).filter(d => Math.ceil(d / 30) === currentMonth).map(d => ((d - 1) % 30) + 1))}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 items-stretch gap-8 sm:gap-10 relative z-10">
                <div className="flex flex-col">
                  <div className="rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-[#FF8A75]/5 bg-black h-[260px] sm:h-[320px] relative shadow-2xl flex-1">
                    {isSliderActive ? (
                      <ImageComparison
                        beforeImage={beforeImage}
                        afterImage={afterImage}
                        disabled={false}
                      />
                    ) : (
                      <div className="w-full h-full relative group">
                        <img 
                          src={afterImage} 
                          alt={`Progress Day ${activeDay}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6 z-10">
                           <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest">
                              {activeDay === 1 ? "Day 1 Baseline" : `Day ${activeDay} Progress`}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-[#FF8A75] shadow-xl">
                      <Edit3 className="w-5 sm:w-6 h-5 sm:h-6" />
                    </div>
                    <div>
                      <h5 className="text-2xl sm:text-3xl font-aktiv font-bold text-[#1a1a1a] tracking-tight">Your Notes</h5>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Day {activeDay}</p>
                    </div>
                  </div>

                  <div className="flex-1 rounded-[1.2rem] sm:rounded-[1.5rem] bg-white/40 p-5 sm:p-6 border border-slate-200/50 min-h-[140px] shadow-inner">
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full h-full resize-none bg-transparent text-slate-700 text-sm font-medium outline-none border-none focus:ring-0 custom-scrollbar font-jakarta"
                      placeholder="How are you feeling today? Note any changes you noticed."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 shrink-0 mt-auto pb-4 lg:pb-0">
                    <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />
                    {isPhotoDay && (
                      <button onClick={() => fileInputRef.current?.click()} className="h-12 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest hover:border-[#FF8A75]/20 hover:text-[#FF8A75] transition-all">
                        <Camera className="w-3.5 h-3.5" /> Take Photo
                      </button>
                    )}
                    <button onClick={handleSaveLog} disabled={isSavingLog} className={cn("h-12 rounded-xl bg-slate-900 text-white shadow-lg flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-colors duration-300", !isPhotoDay && "col-span-2")}>
                      {isSavingLog ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:xl:col-span-4 lg:flex flex-col gap-6 relative z-10 h-full min-h-0">
            <div className="h-[500px] bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-[#FF8A75]/10 flex flex-col overflow-hidden shadow-xl shadow-[#FF8A75]/5">
              <div className="px-8 py-4 border-b border-[#FF8A75]/5 bg-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 bg-[#FF8A75] rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Chat with Your Instructor</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <OneOnOneChat currentUser={currentUser} hideHeader={true} className="h-full w-full border-0 absolute inset-0" />
              </div>
            </div>

            <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-[#FF8A75]/10 p-8 flex flex-col shadow-xl shadow-[#FF8A75]/5 min-h-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-5 w-1 bg-[#FF8A75] rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Resources Shared</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {resources.length > 0 ? (
                  resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-[#FF8A75]/10 hover:border-[#FF8A75]/20 transition-all duration-300">
                      <div className="flex items-center gap-4 truncate">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[#FF8A75] shadow-sm shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold truncate text-[#1a1a1a]">{res.file_name}</span>
                      </div>
                      <button
                        onClick={() => window.open(res.file_url, '_blank')}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-[#FF8A75] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 gap-4">
                    <div className="h-16 w-16 rounded-[2rem] bg-white border border-[#FF8A75]/10 flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-[#FF8A75]/20" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]/40 text-center">No resources shared yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
         <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-black/20 relative"
         >
            <MessageSquare className="w-7 h-7" />
            <div className="absolute top-0 right-0 h-4 w-4 bg-[#FF8A75] rounded-full border-2 border-white" />
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
                  className="fixed inset-x-0 bottom-0 top-12 bg-white rounded-t-[3rem] z-[80] lg:hidden flex flex-col overflow-hidden shadow-2xl"
               >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center">
                           <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-aktiv font-bold">Instructor Chat</h3>
                           <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75]">Private Channel</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsChatOpen(false)}
                        className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                     <OneOnOneChat currentUser={currentUser} hideHeader={true} className="h-full w-full border-0 absolute inset-0" />
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
