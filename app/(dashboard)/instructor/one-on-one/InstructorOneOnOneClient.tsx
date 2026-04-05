'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatWindow } from '@/components/chat';
import { searchStudents, getOrCreateSharedChat } from '@/lib/actions/chat';
import { uploadResource, getStudentResources } from '@/lib/actions/resources';
import { getInstructorUpcomingMeetings } from '@/lib/actions/meetings';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Calendar,
  Clock,
  Video,
  ArrowUpRight,
  FolderOpen,
  Plus,
  FileText,
  PlayCircle,
  Download,
  MessageSquare,
  Loader2,
  Users,
  Image as ImageIcon,
  X,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Activity,
  History,
  Zap,
  LayoutDashboard,
  Heart
} from 'lucide-react';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── AUTHENTIC PEACH ZEN DESIGN TOKENS ───
const TOKENS = {
  primary: '#FF8A75',        // The Core Peach
  primaryLight: '#FFF0ED',   // Soft Surface
  background: '#FFFAF7',     // Sanctuary Bone
  text: '#1a1a1a',           // Authority Dark
  textMuted: '#9a817d',      // Dusty Rose Muted
  surface: '#FFFFFF',        // Pure Interaction
  accent: '#FF6B4E',         // Salmon Action
};

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
  // ─── STATE MANAGEMENT ───
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(students[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [resources, setResources] = useState<StudentResource[]>([]);
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
  const [activeStepDay, setActiveStepDay] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const compassScrollRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ─── EFFECTS: DATA FLOW ───
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
        
        // Reset journey position to student's current day
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

    // Real-time Resources
    const supabase = createClient();
    const channel = supabase
      .channel(`instructor-one-on-one:${selectedStudent.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${selectedStudent.id}` },
        (payload) => setResources(prev => [payload.new as StudentResource, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent]);

  // Scroll to bottom of chat if it's there
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedStudent?.conversationId]);

  // ─── DERIVED DATA ───
  const day1Log = journeyLogs.find(l => l.day_number === 1);
  const activeLog = journeyLogs.find(l => l.day_number === activeStepDay);
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';
  
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── HANDLERS ───
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

  return (
    <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-sans animate-in fade-in duration-1000 relative">
      
      {/* Kinetic Aura Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">

         {/* ─── PURE ZEN HEADER ─── */}
         <header className="shrink-0 h-24 px-12 flex items-center justify-between border-b border-[#FF8A75]/10 bg-white/40 backdrop-blur-3xl">
            <div className="flex items-center gap-12">
               <div className="flex items-center gap-6">
                  <div className="h-10 w-1.5 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
                  <div>
                     <h1 className="text-3xl font-serif text-slate-900 tracking-tight leading-none">Sanctuary Curator</h1>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-2 opacity-60">Unified Consultation Hub</p>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="relative group w-80">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
                  <input
                     type="text"
                     placeholder="Seek resonance..."
                     className="h-12 w-full pl-14 pr-8 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#FF8A75]/10 text-[11px] font-bold focus:ring-4 focus:ring-[#FF8A75]/5 outline-none transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="h-12 px-8 rounded-2xl bg-[#1a1a1a] text-white flex items-center gap-4 hover:bg-[#FF8A75] hover:-rotate-1 transition-all shadow-xl shadow-black/10 group"
               >
                  <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Schedule Alignment</span>
               </button>
            </div>
         </header>

         {/* ─── SOUL COMPASS ─── */}
         <nav className="shrink-0 h-20 bg-white/20 backdrop-blur-md border-b border-[#FF8A75]/5 flex items-center px-12 z-50">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] shrink-0 mr-10">Soul Compass:</span>
            <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-2" ref={compassScrollRef}>
               {filteredStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                     <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={cn(
                           "flex items-center gap-4 px-6 py-2.5 rounded-full transition-all shrink-0 border whitespace-nowrap group",
                           isSelected 
                              ? "bg-white border-[#FF8A75]/30 shadow-xl shadow-[#FF8A75]/5 ring-4 ring-[#FF8A75]/5" 
                              : "bg-transparent border-transparent opacity-40 hover:opacity-100"
                        )}
                     >
                        <div className="h-9 w-9 rounded-xl overflow-hidden ring-[3px] ring-white shadow-lg bg-slate-100 flex items-center justify-center">
                           {student.avatar_url ? (
                              <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           ) : (
                              <span className="text-sm font-serif text-[#FF8A75]">{student.full_name[0]}</span>
                           )}
                        </div>
                        <div className="text-left">
                           <p className={cn("text-xs font-bold tracking-tight capitalize", isSelected ? "text-slate-900" : "text-slate-400")}>
                              {student.full_name.split(' ')[0]}
                           </p>
                           <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] mt-1 opacity-80">
                              Evolution {student.startDate ? Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1 : 1}
                           </p>
                        </div>
                     </button>
                  );
               })}
            </div>
         </nav>

         {/* ─── UNIFIED CANVAS ─── */}
         <main className="flex-1 flex overflow-hidden">
            
            {/* LEFT COLUMN: TRANSFORMATION MIRROR (65%) */}
            <div className="flex-[0.65] flex flex-col overflow-y-auto custom-scrollbar p-12 pt-8 gap-12">
               <div className="flex items-center justify-between underline-offset-8">
                  <div>
                     <h2 className="text-5xl font-serif text-slate-900 tracking-tight">Transformation Mirror</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-4 opacity-60">Progressive Resonance Analysis</p>
                  </div>
                  {selectedStudent?.startDate && (
                     <div className="px-10 py-5 bg-white rounded-[2.5rem] border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 text-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/40 block mb-2">Consistency Node</span>
                        <span className="text-3xl font-bold text-slate-900 leading-none">Day {Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))}</span>
                     </div>
                  )}
               </div>

               <div className="space-y-12">
                  <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[3rem] border border-[#FF8A75]/5">
                     <JourneyProgress
                        currentDay={selectedStudent?.startDate
                           ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                           : 1}
                        activeDay={activeStepDay}
                        onSelectDay={setActiveStepDay}
                        completedDays={new Set(journeyLogs.map(l => l.day_number))}
                     />
                  </div>

                  <div className="aspect-[16/8] rounded-[4.5rem] bg-white shadow-3xl shadow-[#FF8A75]/10 ring-1 ring-[#FF8A75]/10 overflow-hidden relative group border-4 border-white">
                     <div className="absolute top-8 left-8 z-20 px-6 py-2 rounded-2xl bg-[#1a1a1a]/80 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-widest border border-white/10 group-hover:scale-105 transition-transform duration-700">
                        Evolution Step {activeStepDay}
                     </div>
                     {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                           <Loader2 className="w-12 h-12 animate-spin text-[#FF8A75]/40" />
                        </div>
                     ) : (
                        <ImageComparison
                           beforeImage={beforeImage}
                           afterImage={afterImage}
                           disabled={activeStepDay < 2}
                        />
                     )}
                  </div>
                  
                  {/* Evolution Notes */}
                  <div className="flex flex-col gap-8 p-12 bg-white rounded-[4rem] shadow-2xl shadow-[#FF8A75]/5 border border-[#FF8A75]/10 relative group">
                     <div className="absolute -top-3 left-12 px-6 py-1.5 rounded-full bg-[#FF8A75] text-white text-[8px] font-black uppercase tracking-widest shadow-xl">
                        Curatorial Insight
                     </div>
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-40">Phase Observations</h4>
                        <div className="flex items-center gap-3">
                           <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                           <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Synchronized Portal</span>
                        </div>
                     </div>
                     <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Transcribe the seeker's evolution..."
                        className="flex-1 bg-transparent border-none p-0 text-xl font-medium text-slate-700 focus:ring-0 resize-none min-h-[160px] placeholder:text-slate-200 placeholder:italic leading-relaxed"
                     />
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: INTERACTION HUB (35%) */}
            <div className="flex-[0.35] flex flex-col overflow-hidden p-12 pt-8 gap-12">
               
               {/* Top Half: Communion Pulse (Chat) */}
               <div className="flex-1 bg-[#1a1a1a] rounded-[4.5rem] p-10 flex flex-col relative shadow-2xl shadow-slate-900/40 min-h-0">
                  <div className="flex items-center justify-between mb-8 shrink-0">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-serif text-white tracking-tight">Communion Hub</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-80">Unified Resonance Portal</p>
                     </div>
                     <div className="h-12 w-12 bg-[#FF8A75]/10 border border-[#FF8A75]/20 rounded-2xl flex items-center justify-center text-[#FF8A75] shadow-inner">
                        <MessageSquare className="w-6 h-6" />
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
                           />
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                              <div className="h-16 w-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-[#FF8A75] mb-8 rotate-12">
                                 <Zap className="w-8 h-8" />
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-8">Portal Potential Locked</p>
                              <button
                                 onClick={handleStartChat}
                                 className="h-14 px-10 rounded-[2rem] bg-[#FF8A75] text-white text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-[#FF8A75]/40 transition-all hover:-translate-y-1"
                              >
                                 Initiate Alignment
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Bottom Half: Registry Artifacts (Files) */}
               <div className="flex-[0.6] bg-white/40 backdrop-blur-3xl rounded-[4.5rem] p-10 border border-[#FF8A75]/10 shadow-xl flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-10 shrink-0">
                     <div className="space-y-1">
                        <h3 className="text-xl font-serif text-slate-900 tracking-tight">Registry Artifacts</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Sacred Documentation</p>
                     </div>
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-12 rounded-2xl bg-[#1a1a1a] text-white flex items-center justify-center shadow-xl shadow-black/10 hover:bg-[#FF8A75] transition-all group/add"
                     >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 group-hover/add:rotate-90 transition-transform" />}
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-3">
                     {resources.map((res) => (
                        <button 
                           key={res.id} 
                           onClick={() => window.open(res.file_url, '_blank')}
                           className="w-full flex items-center gap-6 p-6 rounded-[2.5rem] bg-white border border-transparent hover:border-[#FF8A75]/20 hover:shadow-2xl hover:shadow-[#FF8A75]/5 transition-all text-left group/res"
                        >
                           <div className="h-14 w-14 rounded-2xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] group-hover/res:rotate-12 transition-all shrink-0">
                              {res.content_type?.includes('image') ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-base font-bold text-slate-800 truncate">{res.file_name}</p>
                              <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75]/40 mt-1.5">Manifest Artifact</p>
                           </div>
                           <Download className="w-5 h-5 text-slate-200 group-hover/res:text-[#FF8A75] transition-all" />
                        </button>
                     ))}
                     {resources.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                           <FolderOpen className="w-12 h-12 mb-6 text-[#FF8A75]" />
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Registry Vacuum</p>
                        </div>
                     )}
                  </div>
               </div>

            </div>
         </main>
      </div>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#1a1a1a]/30 backdrop-blur-3xl">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="w-full max-w-lg bg-[#FFFAF7] rounded-[4rem] p-16 relative overflow-hidden shadow-2xl shadow-black/20 text-center border border-white/50"
            >
               <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF8A75]/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
               <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="absolute top-12 right-12 text-[#1a1a1a]/20 hover:text-[#FF8A75] transition-colors"
               >
                  <X className="w-8 h-8" />
               </button>

               <div className="space-y-12 relative z-10">
                  <div>
                     <h3 className="text-4xl font-serif text-slate-900 mb-2">Temporal Alignment</h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Setting Sacred Time</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black tracking-widest uppercase text-[#FF8A75] ml-6">Guided Soul</label>
                        <div className="h-18 px-8 rounded-3xl bg-white border border-[#FF8A75]/10 flex items-center text-lg font-bold text-slate-900 capitalize">{selectedStudent?.full_name}</div>
                     </div>
                     
                     <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black tracking-widest uppercase text-[#FF8A75] ml-6">Sacred Temporal Spot</label>
                        <input 
                           type="datetime-local" 
                           className="h-18 w-full px-8 rounded-3xl bg-white border border-[#FF8A75]/10 text-lg font-bold text-slate-900 focus:ring-8 focus:ring-[#FF8A75]/5 outline-none transition-all" 
                        />
                     </div>
                  </div>

                  <button className="w-full h-20 rounded-[2.5rem] bg-[#1a1a1a] text-white text-[12px] font-black uppercase tracking-[0.4em] hover:bg-[#FF8A75] shadow-2xl transition-all group/submit">
                     Commit Alignment
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.3); }
      `}</style>
    </div>
  );
}
