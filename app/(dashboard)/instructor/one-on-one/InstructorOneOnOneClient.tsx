'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatWindow } from '@/components/chat';
import { getOrCreateSharedChat } from '@/lib/actions/chat';
import { uploadResource, getStudentResources } from '@/lib/actions/resources';
import { getInstructorUpcomingMeetings, deleteMeeting } from '@/lib/actions/meetings';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Calendar,
  FolderOpen,
  Plus,
  FileText,
  Download,
  MessageSquare,
  Loader2,
  Image as ImageIcon,
  X,
  Zap,
  Menu,
  Video,
  ExternalLink,
  Trash2
} from 'lucide-react';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { AnglePhotoViewer } from '@/components/ui/angle-photo-tracker';
import { cn, formatISTDate, formatISTTime, getSessionStatus, localInputToIST } from '@/lib/utils';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface StudentInfo {
  conversationId: string | null;
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  isTrial?: boolean;
  daysLeft?: number | null;
  subscriptionId?: string;
  assignedInstructorId?: string | null;
  startDate?: string | null;
}

interface Props {
  currentUser: Profile;
  students: StudentInfo[];
}

export function InstructorOneOnOneClient({ currentUser, students }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(students[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  
  const [resources, setResources] = useState<StudentResource[]>([]);
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
  const [activeStepDay, setActiveStepDay] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compassScrollRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedStudent) return;

    const loadStudentData = async () => {
      setIsLoading(true);
      try {
        const [resData, logsData, meetingsData] = await Promise.all([
          getStudentResources(selectedStudent.id),
          getJourneyLogs(selectedStudent.id),
          getInstructorUpcomingMeetings()
        ]);
        
        setResources(resData);
        setJourneyLogs(logsData);
        setUpcomingMeetings(meetingsData || []);
        
        const currentDay = selectedStudent.startDate
          ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
          : 1;
        setActiveStepDay(currentDay);
        
        const currentLog = logsData.find((l: JourneyLog) => l.day_number === currentDay);
        setNotes(currentLog?.notes || '');

      } catch (e) {
        console.error("Error loading student data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
    setIsSidebarOpen(false); // Close sidebar on student select (mobile)

    const channel = supabase
      .channel(`instructor-one-on-one:${selectedStudent.id}-${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${selectedStudent.id}` },
        (payload: { new: StudentResource }) => setResources((prev: StudentResource[]) => [payload.new, ...prev])
      )

      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedStudent) return;
    setIsUploading(true);
    const file = e.target.files[0];
    if (file.size > 20 * 1024 * 1024) { toast.error('File size exceeds 20MB limit.'); setIsUploading(false); return; }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', selectedStudent.id);
      formData.append('type', 'private');

      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setResources(prev => [result.data!, ...prev]);
        toast.success('Document shared successfully');
      } else {
        toast.error(result.error || 'Failed to share');
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error('Error sharing document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartChat = async () => {
    if (!selectedStudent) return;
    try {
      const { conversationId } = await getOrCreateSharedChat(selectedStudent.id, selectedStudent.assignedInstructorId || null);
      setSelectedStudent((prev: StudentInfo | null) => prev ? { ...prev, conversationId } : null);
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!selectedStudent || !meetingDateTime) {
      toast.error('Please select a date and time');
      return;
    }

    setIsScheduling(true);
    try {
      const startDateTime = localInputToIST(meetingDateTime);

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `1-on-1 Consultation - ${selectedStudent.full_name}`,
          startTime: startDateTime,
          durationMinutes: 45,
          meetingType: 'one_on_one',
          studentId: selectedStudent.id,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule meeting');
      }

      const updatedList = await getInstructorUpcomingMeetings();
      setUpcomingMeetings(updatedList || []);

      setShowScheduleModal(false);
      setMeetingDateTime('');
      toast.success("Meeting Scheduled Successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to schedule meeting');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const loadingToast = toast.loading('Canceling meeting...');
    try {
      const res = await deleteMeeting(meetingId);
      if (res.success) {
        toast.success("Meeting canceled and student notified!", { id: loadingToast });
        const updatedList = await getInstructorUpcomingMeetings();
        setUpcomingMeetings(updatedList || []);
      } else {
        toast.error(res.error || "Failed to delete meeting", { id: loadingToast });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete meeting", { id: loadingToast });
    }
  };

  const filteredStudents = students.filter((s: StudentInfo) => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLog = journeyLogs.find((l: JourneyLog) => l.day_number === activeStepDay);
  const day1Log   = journeyLogs.find((l: JourneyLog) => l.day_number === 1);

  const studentMeetings = upcomingMeetings.filter((m: MeetingWithDetails) => m.student_id === selectedStudent?.id);
  const nextMeeting = studentMeetings.length > 0 ? studentMeetings[0] : null;

  const filteredResources = resources.filter(res => !res.file_url?.includes('zoom.us') && !res.content_type?.includes('zoom'));

  return (
    <div className="flex flex-col h-full lg:h-[100dvh] bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-jakarta relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.08)_0%,transparent_60%)] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[radial-gradient(circle_at_center,rgba(255,107,78,0.05)_0%,transparent_60%)] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
         {/* HEADER (Desktop Only) */}
         <header className="hidden lg:flex shrink-0 h-16 px-10 items-center justify-between border-b border-[#FF8A75]/5 bg-white/40 backdrop-blur-3xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-12">
               <div className="flex items-center gap-6">
                  <div className="h-10 w-[3px] bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]/50" />
                  <div>
                     <div className="flex items-center gap-2">
                       <h1 className="text-xl font-aktiv font-bold text-slate-900 tracking-tight leading-none">Instructor Portal</h1>
                       <span className="px-2 py-0.5 bg-[#FF8A75]/10 border border-[#FF8A75]/20 rounded-full text-[7px] font-black uppercase tracking-widest text-[#FF8A75]">Lead</span>
                     </div>
                     <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1 opacity-80 text-nowrap">Centralized Management Hub</p>
                  </div>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-6 flex-1 justify-end">
               <div className="relative group w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
                  <input
                     type="text"
                     placeholder="Student Search..."
                     className="h-10 w-full pl-10 pr-4 rounded-xl bg-white/60 backdrop-blur-xl border border-[#FF8A75]/10 text-[10px] font-bold text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-[#FF8A75]/5 outline-none transition-all shadow-sm"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
                <button 
                   onClick={() => setShowScheduleModal(true)}
                   className="h-10 px-4 rounded-xl bg-slate-900 text-white flex items-center gap-2 hover:bg-[#FF8A75] hover:shadow-lg hover:shadow-[#FF8A75]/20 transition-all group whitespace-nowrap"
                >
                   <Calendar className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">Schedule</span>
                </button>
            </motion.div>
         </header>

         {/* MOBILE HEADER & NAV */}
         <div className="flex lg:hidden flex-col border-b border-[#FF8A75]/10 bg-white/80 backdrop-blur-md pt-4 pb-2 px-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
               <div>
                  <h1 className="text-lg font-aktiv font-bold text-slate-900 tracking-tight leading-none">Instructor Portal</h1>
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">Lead Hub</p>
               </div>
                <button 
                   onClick={() => setShowScheduleModal(true)}
                   className="h-8 px-3 rounded-lg bg-slate-900 text-white flex items-center gap-1.5"
                >
                   <Calendar className="w-3 h-3" />
                   <span className="text-[8px] font-black uppercase tracking-widest">Schedule</span>
                </button>
            </div>
            {/* Horizontal scrolling students list */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1" ref={compassScrollRef}>
               {filteredStudents.map((student: StudentInfo) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const currentDay = student.startDate && isMounted ? Math.max(1, Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1) : 1;
                  return (
                     <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={cn(
                           "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all shrink-0 border whitespace-nowrap relative overflow-hidden",
                           isSelected 
                              ? "bg-white border-[#FF8A75] shadow-sm shadow-[#FF8A75]/10" 
                              : "bg-white/40 border-transparent hover:bg-white/80"
                        )}
                     >
                         <div className={cn(
                           "h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-white transition-all",
                           isSelected ? "bg-[#FF8A75]/10" : "bg-slate-100"
                         )}>
                           {student.avatar_url ? (
                              <img src={student.avatar_url} className="h-full w-full object-cover" />
                           ) : (
                              <span className={cn("text-xs font-aktiv font-bold", isSelected ? "text-[#FF8A75]" : "text-slate-400")}>{student.full_name[0]}</span>
                           )}
                        </div>
                         <div className="text-left flex-1 min-w-0 pr-1">
                            <p className={cn("text-[10px] font-bold tracking-tight capitalize truncate", isSelected ? "text-slate-900" : "text-slate-600")}>
                               {student.full_name}
                            </p>
                            <p className={cn(
                              "text-[7px] font-black uppercase tracking-widest mt-0.5",
                              isSelected ? "text-[#FF8A75]" : "text-slate-400"
                            )}>
                               Day {currentDay}
                            </p>
                        </div>
                     </button>
                  );
               })}
            </div>
         </div>

         {/* DESKTOP NAV (SIDEBAR/TOPBAR) */}
          <nav className="hidden lg:flex w-full h-16 bg-white/10 backdrop-blur-md border-b border-white/40 flex-row items-center px-10">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 shrink-0 mr-6">Students</motion.span>
            <div className="flex-1 flex flex-row items-center gap-3 overflow-x-auto no-scrollbar py-2">
               {filteredStudents.map((student: StudentInfo, idx: number) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const currentDay = student.startDate && isMounted ? Math.max(1, Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1) : 1;
                  return (
                     <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={cn(
                           "flex items-center gap-3 px-3 py-2 rounded-xl transition-all shrink-0 border whitespace-nowrap group relative overflow-hidden",
                           isSelected 
                              ? "bg-white border-[#FF8A75] shadow-lg shadow-[#FF8A75]/5 w-56" 
                              : "bg-white/40 border-transparent hover:bg-white/80 hover:border-[#FF8A75]/10 w-48"
                        )}
                     >
                         {isSelected && <motion.div layoutId="activeStudentHighlightDesktop" className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF8A75]" />}
                         <div className={cn(
                           "h-9 w-9 rounded-lg overflow-hidden shadow-inner flex items-center justify-center shrink-0 border border-white transition-all",
                           isSelected ? "bg-[#FF8A75]/10" : "bg-slate-100"
                         )}>
                           {student.avatar_url ? (
                              <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           ) : (
                              <span className={cn("text-sm font-aktiv font-bold", isSelected ? "text-[#FF8A75]" : "text-slate-400")}>{student.full_name[0]}</span>
                           )}
                        </div>
                         <div className="text-left flex-1 min-w-0">
                            <p className={cn("text-[11px] font-bold tracking-tight capitalize truncate", isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800")}>
                               {student.full_name}
                            </p>
                            <p className={cn(
                              "text-[8px] font-black uppercase tracking-widest mt-0.5",
                              isSelected ? "text-[#FF8A75]" : "text-slate-400"
                            )}>
                               Day {currentDay} Progress
                            </p>
                        </div>
                     </motion.button>
                  );
               })}
            </div>
         </nav>

         <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden isolate relative">
            {/* MAIN JOURNEY AREA */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
                className={cn(
                   "flex-none lg:flex-1 flex flex-col lg:overflow-y-auto custom-scrollbar p-4 lg:p-8 gap-6 transition-all relative z-10",
                   "lg:max-w-[65%]"
                )}
             >
                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 shrink-0">
                   <div>
                      <h2 className="text-2xl lg:text-3xl font-aktiv font-bold text-slate-900 tracking-tight leading-none">Transformation</h2>
                      <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1.5 opacity-80">Journey Context</p>
                   </div>
                   {selectedStudent?.startDate && (
                      <div className="px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-[#FF8A75]/10 shadow-sm text-center flex-shrink-0 flex items-center gap-3">
                         <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                         <div className="text-left">
                            <span className="text-[6px] font-black uppercase tracking-[0.3em] text-slate-400 block leading-none mb-0.5">Consistency</span>
                            <span className="text-base lg:text-lg font-bold text-slate-900 leading-none">Day {selectedStudent.startDate && isMounted ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1)) : 1}</span>
                         </div>
                      </div>
                   )}
                </div>

               <div className="space-y-6 pb-12 lg:pb-0">

                  {/* Next Scheduled Meeting Card */}
                   {nextMeeting && (() => {
                      const status = getSessionStatus(nextMeeting.start_time, nextMeeting.duration_minutes || 45, nextMeeting.calendar_event_id);
                      const isExpired = status === 'expired';
                      const isCompleted = status === 'completed';
                      return (
                      <div 
                         onClick={() => !isExpired && !isCompleted && window.open(nextMeeting.start_url || nextMeeting.join_url, '_blank')}
                         className={cn(
                           "border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 shadow-sm",
                           isExpired ? "bg-slate-50 border-slate-100 opacity-60 cursor-default" 
                           : isCompleted ? "bg-emerald-50 border-emerald-100 cursor-default"
                           : "cursor-pointer bg-[#FF8A75]/10 border-[#FF8A75]/20 hover:bg-[#FF8A75]/15"
                         )}
                      >
                         <div className="flex items-center gap-3.5">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", isCompleted ? 'bg-emerald-200 text-emerald-700' : 'bg-[#FF8A75] text-white')}>
                               <Video className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">Scheduled Live Session</span>
                                  {isExpired && <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Expired</span>}
                                  {isCompleted && <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">✓ Completed</span>}
                               </div>
                               <h4 className={cn("text-sm font-bold truncate mt-0.5", isExpired ? 'line-through text-slate-400' : isCompleted ? 'text-slate-500' : 'text-slate-800')}>{nextMeeting.topic}</h4>
                               <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                  {formatISTDate(nextMeeting.start_time)} · {formatISTTime(nextMeeting.start_time)} IST
                               </p>
                            </div>
                         </div>
                         {!isExpired && !isCompleted && (
                            <div className="shrink-0 flex items-center gap-3">
                               <button
                                 onClick={async (e) => {
                                   e.stopPropagation();
                                   if (confirm("Are you sure you want to cancel this meeting? An apology email will be sent to the student.")) {
                                     await handleDeleteMeeting(nextMeeting.id);
                                   }
                                 }}
                                 className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 transition-colors"
                                 title="Cancel/Delete Meeting"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#FF8A75] bg-white border border-[#FF8A75]/10 px-3.5 py-2 rounded-xl">
                                  Join Call <ExternalLink className="w-3.5 h-3.5" />
                               </div>
                            </div>
                         )}
                      </div>
                      );
                   })()}

                  {/* 3-Angle Photo Viewer for instructor */}
                  <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg shadow-[#FF8A75]/5 p-5 lg:p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">📸 Progress Photos</span>
                        <span className="text-[8px] text-slate-400 font-medium">— Day {activeStepDay} · 3-Angle View</span>
                     </div>
                     {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                           <Loader2 className="w-8 h-8 animate-spin text-[#FF8A75]/50" />
                        </div>
                     ) : (
                        <div className="space-y-8">
                           <JourneyProgress
                              currentDay={Math.min(30, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent!.startDate!).getTime()) / 86400000) + 1))}
                              activeDay={activeStepDay}
                              onSelectDay={(day) => setActiveStepDay(day)}
                              completedDays={new Set(journeyLogs.map((l: JourneyLog) => l.day_number))}
                           />
                           <AnglePhotoViewer
                           dayNumber={activeStepDay}
                           photos={{
                              front: activeLog?.photo_url ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url ?? null,
                              left:  activeLog?.photo_url_left ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url_left).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url_left ?? null,
                              right: activeLog?.photo_url_right ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url_right).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url_right ?? null,
                           }}
                           day1Photos={{
                              front: day1Log?.photo_url ?? null,
                              left:  day1Log?.photo_url_left ?? null,
                              right: day1Log?.photo_url_right ?? null,
                           }}
                           studentName={selectedStudent?.full_name}
                           accentColor="#FF8A75"
                           allLogs={journeyLogs}
                        />
                        </div>
                     )}
                  </div>
                  
                  {/* Notes and Artifacts Grid */}
                  <div className="grid grid-cols-1 2xl:grid-cols-1 gap-6">
                     <div className="flex flex-col gap-3 p-6 lg:p-8 bg-[#FFFAF7] rounded-2xl lg:rounded-3xl shadow-inner border border-[#FF8A75]/10 relative overflow-hidden group">
                        {/* Decorative subtle texture for the notes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,138,117,0.1)_0%,transparent_70%)] opacity-50 pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shadow-sm border border-[#FF8A75]/10">
                                 <FileText className="w-3.5 h-3.5 text-[#FF8A75]" />
                              </div>
                              <h4 className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">Instructor Notes</h4>
                           </div>
                           <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                              <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[6px] font-black uppercase tracking-widest text-slate-400">Auto-Saving</span>
                           </div>
                        </div>
                        <textarea 
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                           placeholder="Inscribe observations..."
                           className="flex-1 bg-transparent border-none p-2 text-sm lg:text-base font-medium text-slate-700 focus:ring-0 resize-none min-h-[120px] placeholder:text-slate-300 placeholder:italic placeholder:font-aktiv leading-relaxed relative z-10"
                        />
                     </div>

                     {/* Artifacts placed gracefully inside the grid */}
                     <div className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-[#FF8A75]/10 shadow-sm flex flex-col min-h-[180px]">
                        <div className="flex items-center justify-between mb-4 shrink-0 border-b border-slate-100 pb-3">
                           <div>
                               <h3 className="text-lg font-aktiv font-bold text-slate-900 tracking-tight leading-none">Student Documents</h3>
                              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Shared Documents</p>
                           </div>
                            <button
                               onClick={() => fileInputRef.current?.click()}
                               disabled={isUploading}
                               className="group relative h-9 w-9 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#FF8A75] transition-all shadow-md overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                               {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" /> : <Plus className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />}
                            </button>
                           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                           <AnimatePresence>
                              {filteredResources.map((res: StudentResource, i: number) => (
                                  <motion.button 
                                     initial={{ opacity: 0, x: 10 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ delay: i * 0.05 }}
                                     key={res.id} 
                                     onClick={() => window.open(res.file_url, '_blank')}
                                     className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-[#FF8A75]/30 hover:bg-white hover:shadow-lg hover:shadow-[#FF8A75]/5 transition-all text-left group"
                                  >
                                     <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-[#1a1a1a] group-hover:text-[#FF8A75] group-hover:scale-110 transition-all shadow-sm shrink-0">
                                        {res.content_type?.includes('image') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <p className="text-[11px] lg:text-xs font-bold text-slate-800 truncate group-hover:text-[#FF8A75] transition-colors">{res.file_name}</p>
                                        <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Physical Node</p>
                                     </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                       <Download className="w-3.5 h-3.5 text-[#FF8A75]" />
                                    </div>
                                 </motion.button>
                              ))}
                           </AnimatePresence>
                           {filteredResources.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center opacity-40 py-8">
                                 <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <FolderOpen className="w-6 h-6 text-slate-400" />
                                 </div>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Repository Empty</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* RIGHT COLUMN */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="flex flex-col h-[600px] lg:h-auto lg:flex-[0.35] lg:overflow-hidden p-4 lg:p-8 shrink-0 gap-6 bg-white/30 backdrop-blur-3xl lg:border-l border-t lg:border-t-0 border-[#FF8A75]/10 relative z-20"
            >
               {/* Sync Portal */}
               <div className="flex-1 bg-black border border-white/5 rounded-2xl lg:rounded-3xl p-5 lg:p-6 flex flex-col relative shadow-2xl shadow-black/40 h-full min-h-[500px]">
                  <div className="flex items-center justify-between mb-4 shrink-0 border-b border-white/5 pb-3">
                     <div className="space-y-1">
                        <h3 className="text-lg font-aktiv font-bold text-white tracking-tight flex items-center gap-3 leading-none">
                           Portal <span className="flex h-2 w-2 relative rounded-full bg-emerald-500"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span></span>
                        </h3>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-80">Direct Encrypted Channel</p>
                     </div>
                     <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-[#FF8A75] border border-white/10">
                        <MessageSquare className="w-4 h-4" />
                     </div>
                  </div>

                  <div className="flex-1 overflow-hidden relative">
                     {selectedStudent && selectedStudent.conversationId ? (
                        <ChatWindow
                           conversationId={selectedStudent.conversationId}
                           currentUser={currentUser}
                           conversationType="direct"
                           title={selectedStudent.full_name}
                           otherParticipant={{ id: selectedStudent.id, full_name: selectedStudent.full_name, avatar_url: selectedStudent.avatar_url, email: selectedStudent.email } as Profile}
                           className="h-full bg-transparent"
                           hideHeader={true}
                           isMultiParty={true}
                           dark={true}
                        />
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                           <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF8A75] mb-6 relative group overflow-hidden">
                              <div className="absolute inset-0 bg-[#FF8A75]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                              <Zap className="w-6 h-6 relative z-10" />
                           </div>
                           <h4 className="text-sm font-bold text-white mb-2">Portal Dormant</h4>
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6 max-w-[200px] leading-relaxed">Awaken the connection to begin direct synchronization.</p>
                           <button
                              onClick={handleStartChat}
                              className="px-8 py-4 rounded-2xl bg-[#FF8A75] hover:bg-white hover:text-slate-900 text-[#1a1a1a] text-[9px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#FF8A75]/20"
                           >
                              Initialize Connection
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
         </main>
      </div>



      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-[#1a1a1a]/60 backdrop-blur-2xl">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="w-full max-w-md bg-white rounded-[3rem] p-8 lg:p-12 relative overflow-hidden shadow-2xl border border-white/20"
            >
               {/* Decorative elements */}
               <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#FF8A75]/10 rounded-full blur-3xl pointer-events-none" />
               <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#FF6B4E]/5 rounded-full blur-3xl pointer-events-none" />

               <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="absolute top-6 right-6 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors z-10"
               >
                  <X className="w-4 h-4" />
               </button>

               <div className="space-y-8 relative z-10">
                  <div className="text-center">
                     <div className="h-16 w-16 bg-[#1a1a1a] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-slate-900/20 rotate-3">
                        <Calendar className="w-7 h-7 text-[#FF8A75]" />
                     </div>
                     <h3 className="text-3xl font-aktiv font-bold text-slate-900 mb-2 tracking-tight">Session Schedule</h3>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Sync Anchoring</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-400 ml-4">Target Student</label>
                        <div className="h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#FF8A75] font-aktiv font-bold text-sm">
                              {selectedStudent?.full_name[0]}
                           </div>
                           <span className="text-sm font-bold text-slate-900 capitalize">{selectedStudent?.full_name}</span>
                        </div>
                     </div>
                                      <div className="space-y-2">
                        <label className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-400 ml-4">Date & Time</label>
                        <input 
                           type="datetime-local" 
                           value={meetingDateTime}
                           onChange={(e) => setMeetingDateTime(e.target.value)}
                           onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                           className="h-14 w-full px-5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:border-[#FF8A75]/30 focus:ring-4 focus:ring-[#FF8A75]/10 outline-none transition-all shadow-sm cursor-pointer" 
                        />
                     </div>
                  </div>

                  <button 
                     onClick={handleScheduleMeeting}
                     disabled={isScheduling}
                     className="w-full h-14 rounded-2xl bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#FF8A75] hover:shadow-xl hover:shadow-[#FF8A75]/20 group transition-all mt-4 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <span className="relative z-10 group-hover:scale-105 inline-block transition-transform duration-300">
                        {isScheduling ? 'Scheduling...' : 'Set Schedule'}
                     </span>
                     <div className="absolute inset-0 bg-[#FF8A75] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.3); }
      `}</style>
    </div>
  );
}
