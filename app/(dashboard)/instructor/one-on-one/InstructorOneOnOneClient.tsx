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
      const { conversationId } = await getOrCreateSharedChat(selectedStudent.id, selectedStudent.assignedInstructorId);
      setSelectedStudent(prev => prev ? { ...prev, conversationId } : null);
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] overflow-hidden font-sans">
      
      {/* ─── PURE ZEN HEADER ─── */}
      <header className="shrink-0 h-24 px-12 flex items-center justify-between border-b border-[#FF8A75]/10 bg-[#FFFAF7]/80 backdrop-blur-xl z-[60]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1 bg-[#FF8A75] rounded-full" />
            <div>
              <h1 className="text-2xl font-serif text-slate-900 tracking-tight leading-none">Sanctuary Curator</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1.5 opacity-60">Unified Consultation Hub</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
            <input
              type="text"
              placeholder="Locate Soul..."
              className="h-14 w-72 pl-14 pr-8 rounded-2xl bg-white border border-slate-100 placeholder:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-[#FF8A75]/10 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="flex h-14 items-center gap-3 px-8 rounded-2xl bg-[#1a1a1a] text-white hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 group"
          >
            <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest leading-none">Schedule Alignment</span>
          </button>
        </div>
      </header>

      {/* ─── SOUL COMPASS ─── */}
      <nav className="shrink-0 h-24 bg-white/40 backdrop-blur-md border-b border-[#FF8A75]/5 flex items-center px-12 overflow-hidden z-50">
        <div className="flex items-center gap-10 overflow-x-auto no-scrollbar py-2" ref={compassScrollRef}>
          {filteredStudents.map((student) => {
            const isSelected = selectedStudent?.id === student.id;
            return (
              <motion.button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center gap-4 px-6 py-2.5 rounded-full transition-all shrink-0 border",
                  isSelected 
                    ? "bg-white border-[#FF8A75]/20 shadow-lg shadow-[#FF8A75]/5" 
                    : "bg-transparent border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <div className="h-10 w-10 rounded-xl overflow-hidden ring-2 ring-white shadow-sm bg-slate-100 flex items-center justify-center">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-slate-300">{student.full_name[0]}</span>
                  )}
                </div>
                <div className="text-left">
                  <p className={cn("text-xs font-black tracking-tight", isSelected ? "text-slate-900" : "text-slate-400")}>
                    {student.full_name.split(' ')[0]}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] mt-0.5 opacity-80">
                    Day {student.startDate ? Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1 : 1}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ─── UNIFIED CANVAS ─── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: TRANSFORMATION MIRROR (65%) */}
        <div className="flex-[0.65] flex flex-col overflow-y-auto custom-scrollbar p-12 border-r border-[#FF8A75]/5">
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-5xl font-serif text-slate-900 tracking-tight">Transformation Mirror</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-3">Analyzing Progressive Glow</p>
              </div>
              {selectedStudent?.startDate && (
                <div className="px-8 py-4 bg-white rounded-3xl border border-[#FF8A75]/10 shadow-sm text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]/40 block mb-1">Consistency</span>
                  <span className="text-2xl font-bold text-slate-900 leading-none">Day {Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))}</span>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <JourneyProgress
                currentDay={selectedStudent?.startDate
                  ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                  : 1}
                activeDay={activeStepDay}
                onSelectDay={setActiveStepDay}
                completedDays={new Set(journeyLogs.map(l => l.day_number))}
              />

              <div className="aspect-[16/8] rounded-[3.5rem] bg-white shadow-3xl shadow-[#FF8A75]/5 ring-1 ring-[#FF8A75]/10 overflow-hidden relative group">
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
              <div className="flex flex-col gap-6 p-10 bg-white rounded-[2.5rem] shadow-sm border border-[#FF8A75]/5">
                <div className="flex items-center justify-between underline-offset-8 decoration-[#FF8A75]/40">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Phase Insights & Observations</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75]/60">Auto-Saving Insight</span>
                  </div>
                </div>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record your curatorial observations for this stage..."
                  className="flex-1 bg-transparent border-none p-0 text-base font-medium text-slate-700 focus:ring-0 resize-none min-h-[160px] placeholder:text-slate-200 placeholder:italic leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTION HUB (35%) */}
        <div className="flex-[0.35] flex flex-col overflow-hidden bg-white/20">
          
          {/* Top Half: Communion (Chat) */}
          <div className="flex-[0.6] flex flex-col border-b border-[#FF8A75]/5 min-h-0">
             <div className="px-10 py-8 flex items-center justify-between shrink-0">
               <div>
                  <h3 className="text-xl font-serif text-slate-900 tracking-tight">Communion Hub</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] mt-1">Direct Exchange</p>
               </div>
               <div className="h-10 w-10 bg-[#FF8A75]/5 rounded-xl flex items-center justify-center text-[#FF8A75]">
                  <MessageSquare className="w-5 h-5" />
               </div>
             </div>

             <div className="flex-1 overflow-hidden p-6 pt-0">
               <div className="h-full bg-white rounded-[2.5rem] shadow-sm ring-1 ring-[#FF8A75]/10 overflow-hidden relative">
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
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/50">
                      <Zap className="w-8 h-8 text-[#FF8A75]/20 mb-6" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-6">Portal Potential</p>
                      <button
                        onClick={handleStartChat}
                        className="px-8 h-12 rounded-full bg-[#1a1a1a] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-all"
                      >
                        Initiate Portal
                      </button>
                    </div>
                  )}
               </div>
             </div>
          </div>

          {/* Bottom Half: Registry (Files) */}
          <div className="flex-[0.4] flex flex-col min-h-0 p-10 pt-4">
             <div className="flex items-center justify-between mb-8 shrink-0">
               <div>
                  <h3 className="text-xl font-serif text-slate-900 tracking-tight">Registry Artifacts</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] mt-1">Shared Documents</p>
               </div>
               <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-xl bg-[#FF8A75] text-white flex items-center justify-center shadow-lg shadow-[#FF8A75]/20 hover:scale-105 transition-all"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {resources.map((res) => (
                  <button 
                    key={res.id} 
                    onClick={() => window.open(res.file_url, '_blank')}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white border border-transparent hover:border-[#FF8A75]/10 hover:shadow-xl hover:shadow-[#FF8A75]/5 transition-all text-left"
                  >
                     <div className="h-12 w-12 rounded-xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] shadow-inner shrink-0 leading-none">
                        {res.content_type?.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{res.file_name}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1">Registry Artifact</p>
                     </div>
                     <Download className="w-4 h-4 text-slate-100" />
                  </button>
                ))}
                {resources.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-[#FF8A75]/10 rounded-[2rem] opacity-30">
                    <FolderOpen className="w-8 h-8 mb-4 text-[#FF8A75]" />
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none">Empty Registry</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      </main>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[4rem] shadow-4xl p-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-10 right-10 h-10 w-10 flex items-center justify-center text-slate-200 hover:text-[#FF8A75] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-12">
                <div>
                  <h3 className="text-3xl font-serif text-slate-900 mb-2">Temporal Alignment</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Setting Sacred Time</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[9px] font-black tracking-widest uppercase text-slate-300 ml-4">Guided Soul</label>
                    <div className="h-14 px-6 rounded-2xl bg-slate-50 flex items-center text-sm font-bold text-slate-900">{selectedStudent?.full_name}</div>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[9px] font-black tracking-widest uppercase text-slate-300 ml-4">Temporal Spot</label>
                    <input type="datetime-local" className="h-14 px-6 rounded-2xl bg-slate-50 border-none text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#FF8A75]/10" />
                  </div>
                </div>

                <button className="w-full h-16 rounded-3xl bg-[#1a1a1a] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#FF8A75] shadow-2xl shadow-slate-900/10 transition-all">
                  Commit To Ritual
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
