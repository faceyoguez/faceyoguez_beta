'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatWindow } from '@/components/chat';
import { getOrCreateSharedChat } from '@/lib/actions/chat';
import { uploadResource, getStudentResources } from '@/lib/actions/resources';
import { getInstructorUpcomingMeetings } from '@/lib/actions/meetings';
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
  Menu} from 'lucide-react';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { cn } from '@/lib/utils';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { motion, AnimatePresence } from 'framer-motion';

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
        
        const currentLog = logsData.find(l => l.day_number === currentDay);
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
        (payload) => setResources(prev => [payload.new as StudentResource, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedStudent) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const result = await uploadResource(selectedStudent.id, file.name, file.type, file.size, base64);
      if (result.success && result.data) setResources(prev => [result.data!, ...prev]);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartChat = async () => {
    if (!selectedStudent) return;
    try {
      const { conversationId } = await getOrCreateSharedChat(selectedStudent.id, selectedStudent.assignedInstructorId || null);
      setSelectedStudent(prev => prev ? { ...prev, conversationId } : null);
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const day1Log = journeyLogs.find(l => l.day_number === 1);
  const activeLog = journeyLogs.find(l => l.day_number === activeStepDay);
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-sans relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
         <header className="shrink-0 h-20 lg:h-24 px-6 lg:px-12 flex items-center justify-between border-b border-[#FF8A75]/10 bg-white/40 backdrop-blur-3xl">
            <div className="flex items-center gap-4 lg:gap-12">
               <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 hover:bg-black/5 rounded-xl transition-colors"
               >
                  <Menu className="w-6 h-6" />
               </button>
               <div className="flex items-center gap-4 lg:gap-6">
                  <div className="h-8 lg:h-10 w-1 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
                  <div>
                     <h1 className="text-xl lg:text-3xl font-serif text-slate-900 tracking-tight leading-none">Curator</h1>
                     <p className="hidden sm:block text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-1 lg:mt-2 opacity-60 text-nowrap">Unified Hub</p>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-8 flex-1 justify-end">
               <div className="relative group hidden sm:block w-48 lg:w-80">
                  <Search className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-3.5 lg:w-4 h-3.5 lg:h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
                  <input
                     type="text"
                     placeholder="Seek resonance..."
                     className="h-10 lg:h-12 w-full pl-10 lg:pl-14 pr-4 lg:pr-8 rounded-xl lg:rounded-2xl bg-white/60 backdrop-blur-xl border border-[#FF8A75]/10 text-[10px] lg:text-[11px] font-bold focus:ring-4 focus:ring-[#FF8A75]/5 outline-none transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="h-10 lg:h-12 px-4 lg:px-8 rounded-xl lg:rounded-2xl bg-[#1a1a1a] text-white flex items-center gap-2 lg:gap-4 hover:bg-[#FF8A75] transition-all shadow-xl shadow-black/10 group whitespace-nowrap"
               >
                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest leading-none">Schedule</span>
               </button>
            </div>
         </header>

         <nav className={cn(
            "fixed inset-y-0 left-0 z-[60] w-72 bg-white/95 backdrop-blur-2xl border-r border-[#FF8A75]/10 transform transition-transform duration-500 lg:static lg:w-full lg:h-20 lg:bg-white/20 lg:backdrop-blur-md lg:border-b lg:translate-x-0 flex flex-col lg:flex-row items-stretch lg:items-center px-6 lg:px-12",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
         )}>
            <div className="flex lg:hidden items-center justify-between py-8 px-2">
               <span className="text-xl font-serif font-bold">Soul Compass</span>
               <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            
            <span className="hidden lg:block text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] shrink-0 mr-10">Soul Compass:</span>
            <div className="flex-1 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-5 overflow-y-auto lg:overflow-x-auto no-scrollbar py-2" ref={compassScrollRef}>
               {filteredStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                     <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={cn(
                           "flex items-center gap-4 px-4 lg:px-6 py-3 lg:py-2.5 rounded-2xl lg:rounded-full transition-all shrink-0 border whitespace-nowrap group",
                           isSelected 
                              ? "bg-white border-[#FF8A75]/30 shadow-xl shadow-[#FF8A75]/5 ring-4 ring-[#FF8A75]/5" 
                              : "bg-transparent border-transparent opacity-60 lg:opacity-40 hover:opacity-100"
                        )}
                     >
                        <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl overflow-hidden ring-[2px] ring-white shadow-lg bg-slate-100 flex items-center justify-center">
                           {student.avatar_url ? (
                              <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           ) : (
                              <span className="text-xs font-serif text-[#FF8A75]">{student.full_name[0]}</span>
                           )}
                        </div>
                        <div className="text-left">
                           <p className={cn("text-xs font-bold tracking-tight capitalize", isSelected ? "text-slate-900" : "text-slate-500")}>
                              {student.full_name}
                           </p>
                           {isSelected && (
                              <p className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-[#FF8A75] mt-0.5 lg:mt-1 opacity-80">
                                 Day {student.startDate ? Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1 : 1}
                              </p>
                           )}
                        </div>
                     </button>
                  );
               })}
            </div>
         </nav>

         <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className={cn(
               "flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 lg:p-12 lg:pt-8 gap-8 lg:gap-12 transition-all",
               "lg:max-w-[65%]"
            )}>
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                     <h2 className="text-3xl lg:text-5xl font-serif text-slate-900 tracking-tight">Transformation</h2>
                     <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-2 lg:mt-4 opacity-60">Journey Node</p>
                  </div>
                  {selectedStudent?.startDate && (
                     <div className="px-6 lg:px-10 py-3 lg:py-5 bg-white rounded-2xl lg:rounded-[2.5rem] border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 text-center flex-shrink-0 animate-in slide-in-from-right duration-500">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/40 block mb-1">Consistency</span>
                        <span className="text-xl lg:text-3xl font-bold text-slate-900 leading-none">Day {Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))}</span>
                     </div>
                  )}
               </div>

               <div className="space-y-8 lg:space-y-12 pb-12 lg:pb-0">
                  <div className="bg-white/40 backdrop-blur-xl p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-[#FF8A75]/5">
                     <JourneyProgress
                        currentDay={selectedStudent?.startDate
                           ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                           : 1}
                        activeDay={activeStepDay}
                        onSelectDay={setActiveStepDay}
                        completedDays={new Set(journeyLogs.map(l => l.day_number))}
                     />
                  </div>

                  <div className="aspect-[4/3] lg:aspect-[16/8] rounded-[2.5rem] lg:rounded-[4.5rem] bg-white shadow-3xl shadow-[#FF8A75]/10 ring-1 ring-[#FF8A75]/10 overflow-hidden relative group border-2 lg:border-4 border-white">
                     <div className="absolute top-4 lg:top-8 left-4 lg:left-8 z-20 px-4 lg:px-6 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl bg-[#1a1a1a]/80 backdrop-blur-xl text-white text-[8px] lg:text-[9px] font-black uppercase tracking-widest border border-white/10">
                        Step {activeStepDay} Evolution
                     </div>
                     {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                           <Loader2 className="w-10 lg:w-12 h-10 lg:h-12 animate-spin text-[#FF8A75]/40" />
                        </div>
                     ) : (
                        <ImageComparison
                           beforeImage={beforeImage}
                           afterImage={afterImage}
                           disabled={activeStepDay < 2}
                        />
                     )}
                  </div>
                  
                  <div className="flex flex-col gap-6 lg:gap-8 p-8 lg:p-12 bg-white rounded-[2.5rem] lg:rounded-[4rem] shadow-2xl shadow-[#FF8A75]/5 border border-[#FF8A75]/10 relative">
                     <div className="absolute -top-3 left-8 lg:left-12 px-4 lg:px-6 py-1.5 rounded-full bg-[#FF8A75] text-white text-[7px] lg:text-[8px] font-black uppercase tracking-widest shadow-xl">
                        Instructor Insight
                     </div>
                     <div className="flex items-center justify-between">
                        <h4 className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-40 capitalize">{selectedStudent?.full_name}'s Record</h4>
                        <div className="hidden sm:flex items-center gap-3">
                           <div className="h-1 lg:h-1.5 w-1 lg:w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                           <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap">Auto-Synced</span>
                        </div>
                     </div>
                     <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observe the seeker's evolution..."
                        className="flex-1 bg-transparent border-none p-0 text-lg lg:text-xl font-medium text-slate-700 focus:ring-0 resize-none min-h-[140px] lg:min-h-[160px] placeholder:text-slate-200 placeholder:italic leading-relaxed"
                     />
                  </div>
               </div>
            </div>

            <div className="flex-1 lg:flex-[0.35] flex flex-col overflow-hidden p-6 lg:p-12 lg:pt-8 gap-8 lg:gap-12 bg-white/20 lg:bg-transparent">
               <div className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] lg:rounded-[4.5rem] p-6 lg:p-10 flex flex-col relative shadow-2xl shadow-slate-900/40 min-h-[500px] lg:min-h-0">
                  <div className="flex items-center justify-between mb-6 lg:mb-8 shrink-0">
                     <div className="space-y-1">
                        <h3 className="text-xl lg:text-2xl font-serif text-white tracking-tight">Portal</h3>
                        <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-80">Sync Portal</p>
                     </div>
                     <div className="h-10 lg:h-12 w-10 lg:w-12 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-[#FF8A75]">
                        <MessageSquare className="w-5 lg:w-6 h-5 lg:h-6" />
                     </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                     <div className="h-full relative">
                        {selectedStudent && selectedStudent.conversationId ? (
                           <ChatWindow
                              conversationId={selectedStudent.conversationId}
                              currentUser={currentUser}
                              conversationType="direct"
                              title={selectedStudent.full_name}
                              otherParticipant={{ id: selectedStudent.id, full_name: selectedStudent.full_name, avatar_url: selectedStudent.avatar_url, email: selectedStudent.email } as Profile}
                              className="h-full"
                              hideHeader={true}
                              isMultiParty={true}
                              dark={true}
                           />
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                              <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-2xl lg:rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-[#FF8A75] mb-6 animate-bounce">
                                 <Zap className="w-6 lg:w-8 h-6 lg:h-8" />
                              </div>
                              <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6">Portal Locked</p>
                              <button
                                 onClick={handleStartChat}
                                 className="h-12 lg:h-14 px-8 lg:px-10 rounded-2xl lg:rounded-[2rem] bg-[#FF8A75] text-white text-[8px] lg:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                              >
                                 Open Channel
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex-[0.6] bg-white rounded-[2.5rem] lg:rounded-[4.5rem] p-6 lg:p-10 border border-[#FF8A75]/10 shadow-xl flex flex-col min-h-[300px] lg:min-h-0 mb-12 lg:mb-0">
                  <div className="flex items-center justify-between mb-8 shrink-0">
                     <div className="space-y-1">
                        <h3 className="text-lg lg:text-xl font-serif text-slate-900 tracking-tight">Artifacts</h3>
                        <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Documentation</p>
                     </div>
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 lg:h-12 w-10 lg:w-12 rounded-xl lg:rounded-2xl bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#FF8A75] transition-all"
                     >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 lg:w-6 h-5 lg:h-6" />}
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                     {resources.map((res) => (
                        <button 
                           key={res.id} 
                           onClick={() => window.open(res.file_url, '_blank')}
                           className="w-full flex items-center gap-4 lg:gap-6 p-4 lg:p-6 rounded-2xl lg:rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-[#FF8A75]/20 hover:bg-white transition-all text-left group"
                        >
                           <div className="h-10 lg:h-12 w-10 lg:w-12 rounded-xl bg-white flex items-center justify-center text-[#FF8A75] shadow-sm shrink-0">
                              {res.content_type?.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-sm lg:text-base font-bold text-slate-800 truncate">{res.file_name}</p>
                              <p className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-[#FF8A75]/40 mt-1">Resource</p>
                           </div>
                           <Download className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                     ))}
                     {resources.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-12">
                           <FolderOpen className="w-10 h-10 mb-4" />
                           <p className="text-[8px] font-black uppercase tracking-widest">No Artifacts</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </main>
      </div>

      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-[#1a1a1a]/40 backdrop-blur-xl">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-lg bg-[#FFFAF7] rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-16 relative overflow-hidden shadow-2xl"
            >
               <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="absolute top-8 lg:top-12 right-8 lg:right-12 text-slate-300 hover:text-primary transition-colors"
               >
                  <X className="w-6 h-6 lg:w-8 lg:h-8" />
               </button>

               <div className="space-y-8 lg:space-y-12 text-center">
                  <div>
                     <h3 className="text-3xl lg:text-4xl font-serif text-slate-900 mb-2">Scheduling</h3>
                     <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Sync Temporal Spot</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black tracking-widest uppercase text-[#FF8A75] ml-4 lg:ml-6">Guided Soul</label>
                        <div className="h-14 lg:h-18 px-6 lg:px-8 rounded-2xl lg:rounded-3xl bg-white border border-[#FF8A75]/10 flex items-center text-base lg:text-md font-bold text-slate-900 capitalize italic">{selectedStudent?.full_name}</div>
                     </div>
                     
                     <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black tracking-widest uppercase text-[#FF8A75] ml-4 lg:ml-6">Selection</label>
                        <input 
                           type="datetime-local" 
                           className="h-14 lg:h-18 w-full px-6 lg:px-8 rounded-2xl lg:rounded-3xl bg-white border border-[#FF8A75]/10 text-base lg:text-md font-bold focus:ring-4 focus:ring-[#FF8A75]/5 outline-none transition-all" 
                        />
                     </div>
                  </div>

                  <button className="w-full h-16 lg:h-20 rounded-2xl lg:rounded-[2.5rem] bg-[#1a1a1a] text-white text-[10px] lg:text-[12px] font-black uppercase tracking-[0.4em] hover:bg-[#FF8A75] transition-all">
                     Confirm Slot
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.2); }
      `}</style>
    </div>
  );
}
