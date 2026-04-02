'use client';

import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat';
import { PageHeader } from '@/components/layout/PageHeader';
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
  Edit3,
  Check,
  MessageSquare,
  Loader2,
  Users,
  Image as ImageIcon,
  X,
  User,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { cn } from '@/lib/utils';

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
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(
    students[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sliderValue, setSliderValue] = useState(50);

  // Resources state
  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Journey state
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [activeStepDay, setActiveStepDay] = useState<number>(1);
  const [isLoadingJourney, setIsLoadingJourney] = useState(false);

  // Meetings state
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');

  // Derived journey variables
  const activeLog = journeyLogs.find((l) => l.day_number === activeStepDay);
  const day1Log = journeyLogs.find((l) => l.day_number === 1);
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';
  if (!activeLog?.photo_url) {
    const logsWithPhotos = [...journeyLogs].filter(l => l.photo_url).sort((a, b) => b.day_number - a.day_number);
    if (logsWithPhotos.length > 0) afterImage = logsWithPhotos[0].photo_url as string;
  }

  // Search functionality
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      subscriptions?: Array<{ plan_type: string; status: string }>;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGlobalSearch = async (query: string) => {
    setGlobalSearchQuery(query);
    if (query.length < 2) {
      setGlobalSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchStudents(query);
      setGlobalSearchResults(results || []);
    } catch (e) {
      console.error('Search error:', e);
    }
    setIsSearching(false);
  };

  const handleStartChatWithStudent = async (studentId: string) => {
    setIsStartingChat(true);
    try {
      const fromList = students.find((s) => s.id === studentId);
      const assignedInstructorId = fromList?.assignedInstructorId || null;
      const { conversationId } = await getOrCreateSharedChat(studentId, assignedInstructorId);
      const fromSearch = globalSearchResults.find((s) => s.id === studentId);
      const source = fromSearch || fromList;
      if (source) {
        setSelectedStudent({
          conversationId,
          id: source.id,
          full_name: source.full_name,
          avatar_url: source.avatar_url,
          email: source.email,
        });
      }
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    } catch (e: unknown) {
      console.error('Start chat error:', e);
    }
    setIsStartingChat(false);
  };

  React.useEffect(() => {
    if (selectedStudent) {
      const loadData = async () => {
        setIsLoadingResources(true);
        setIsLoadingJourney(true);
        const [resData, logsData] = await Promise.all([
          getStudentResources(selectedStudent.id),
          getJourneyLogs(selectedStudent.id)
        ]);
        setResources(resData);
        setJourneyLogs(logsData);

        const actualCurrentDay = selectedStudent.startDate
          ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
          : 1;
        setActiveStepDay(actualCurrentDay);

        setIsLoadingResources(false);
        setIsLoadingJourney(false);

        try {
          const meetingsData = await getInstructorUpcomingMeetings();
          setUpcomingMeetings(meetingsData || []);
        } catch (e) {
          console.error("Failed to load meetings", e);
        }
      };
      loadData();

      const supabase = createClient();
      const channel = supabase
        .channel(`resources:${selectedStudent.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'student_resources',
            filter: `student_id=eq.${selectedStudent.id}`,
          },
          (payload) => {
            setResources((prev) => [payload.new as StudentResource, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedStudent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedStudent) return;
    const file = e.target.files[0];

    const MAX_SIZE_MB = 10; // Slightly larger for instructors
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');

      const result = await uploadResource(
        selectedStudent.id,
        file.name,
        file.type,
        file.size,
        base64Data
      );

      if (result.success && result.data) {
        setResources((prev) => [result.data!, ...prev]);
      } else {
        alert(result.error || 'Upload failed.');
      }
    } catch (err: any) {
      alert('Failed to process file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return { icon: FileText, color: 'text-primary' };
    if (contentType.includes('image')) return { icon: ImageIcon, color: 'text-brand-rose' };
    if (contentType.includes('video')) return { icon: PlayCircle, color: 'text-brand-maize' };
    return { icon: FileText, color: 'text-foreground/40' };
  };

  const handleScheduleMeeting = async () => {
    if (!selectedStudent || !meetingTopic || !meetingDate || !meetingTime) {
      alert('Please fill out all fields');
      return;
    }

    setIsScheduling(true);
    try {
      const startDateTime = new Date(`${meetingDate}T${meetingTime}`).toISOString();

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: meetingTopic,
          startTime: startDateTime,
          durationMinutes: parseInt(meetingDuration, 10),
          meetingType: 'one_on_one',
          studentId: selectedStudent.id,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule meeting');

      const updatedList = await getInstructorUpcomingMeetings();
      setUpcomingMeetings(updatedList || []);

      setShowScheduleModal(false);
      setMeetingTopic('');
      setMeetingDate('');
      setMeetingTime('');
      setMeetingDuration('30');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const studentMeetings = upcomingMeetings.filter(m => m.student_id === selectedStudent?.id);
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-primary/2 rounded-full blur-[120px] -z-10" />

      {/* Header: Student-style airy title */}
      <header className="shrink-0 p-6 lg:p-10 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">One-on-One</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30">Personal Guidance Hub</p>
          </div>

          <div className="hidden lg:flex items-center gap-8 ml-4">
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="h-12 px-6 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 shadow-sm flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:border-primary/20 hover:scale-[1.02] transition-all"
            >
              <Calendar className="w-4 h-4 text-primary" />
              Schedule Alignment
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search students..."
              className="h-12 w-64 pl-12 pr-6 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/10 text-[12px] font-medium placeholder:text-foreground/20 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-6 lg:p-10 gap-4 xl:gap-8 min-w-0">
        
        {/* LEFT: Student Rail */}
        <div className="w-64 xl:w-80 flex flex-col gap-6 shrink-0 h-full min-w-0">
          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/5">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30">Journey Navigation</h3>
              <span className="text-[9px] font-bold text-primary opacity-40">Continuum</span>
              <p className="text-xs font-bold text-foreground leading-none">Space & Time Tracking</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filtered.map((student) => {
                const elapsedDays = student.startDate ? Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1 : 1;
                const isEmergency = elapsedDays >= 25;

                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group",
                      selectedStudent?.id === student.id 
                        ? (isEmergency ? "bg-red-50/50 border border-red-500/20 shadow-md scale-[1.02]" : "bg-white border border-outline-variant/10 shadow-md scale-[1.02]") 
                        : "bg-transparent border border-transparent hover:bg-white/40 hover:border-outline-variant/5"
                    )}
                  >
                    <div className="relative shrink-0">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold", isEmergency ? "bg-red-500/10 text-red-600" : "bg-primary/5 text-primary")}>
                          {student.full_name[0]}
                        </div>
                      )}
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", isEmergency ? "bg-red-500 animate-pulse" : (student.isTrial ? "bg-primary animate-pulse" : "bg-brand-emerald"))} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={cn("text-sm font-bold truncate transition-colors", isEmergency ? "text-red-600 group-hover:text-red-700" : "text-foreground group-hover:text-primary")}>
                          {student.full_name}
                        </h4>
                        {student.isTrial && (
                          <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100 leading-none">Trial</span>
                        )}
                      </div>
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5", isEmergency ? "text-red-500/70" : "text-foreground/20")}>{isEmergency ? `Day ${elapsedDays}: Ending Soon` : "Aligned"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: Journey Unfolding */}
        <div className="flex-1 flex flex-col gap-8 overflow-hidden min-w-0">
          <div className="h-full flex flex-col bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden overflow-y-auto custom-scrollbar p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-primary leading-none">
                  Transformation Landscape
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] tracking-tight leading-none group-hover:text-[#FF8A75] transition-colors">
                  {selectedStudent?.full_name}
                </h3>
              </div>
              {selectedStudent?.startDate && (
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-bold text-foreground/20 tracking-[0.3em] uppercase mb-1">Mastery Path</span>
                  <span className="text-2xl font-bold text-foreground">
                    Day <span className="text-primary underline decoration-primary/20 underline-offset-8">{Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))}</span>
                  </span>
                </div>
              )}
            </div>

            {selectedStudent ? (
              <div className="flex-1 flex flex-col gap-12">
                <div className="w-full">
                  <JourneyProgress
                    currentDay={selectedStudent.startDate
                        ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                        : 1}
                    activeDay={activeStepDay}
                    onSelectDay={setActiveStepDay}
                    completedDays={new Set(journeyLogs.map(l => l.day_number))}
                  />
                </div>

                <div className="flex-1 min-h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/60 relative group">
                  {isLoadingJourney ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-2xl">
                        <Loader2 className="w-12 h-12 animate-spin text-primary/60" />
                    </div>
                  ) : (
                    <ImageComparison
                      beforeImage={beforeImage}
                      afterImage={afterImage}
                      disabled={activeStepDay < 2} 
                      altBefore="Genesis"
                      altAfter={`Day ${activeStepDay}`}
                    />
                  )}
                </div>

                {/* Photo Download Tools */}
                <div className="flex gap-4">
                    <button 
                      disabled={!journeyLogs.find(l => l.day_number === 1)?.photo_url}
                      onClick={() => {
                         const url = journeyLogs.find(l => l.day_number === 1)?.photo_url;
                         if (url) window.open(url, '_blank');
                      }}
                      className="flex-1 h-14 rounded-[1.5rem] bg-white/40 backdrop-blur-md border border-outline-variant/10 shadow-sm flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest hover:border-primary/20 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-white/40 group"
                    >
                      <Download className="w-3.5 h-3.5 text-primary group-hover:-translate-y-0.5 transition-transform" />
                      Extract Day 1
                    </button>
                    <button 
                      disabled={!journeyLogs.find(l => l.day_number === 25)?.photo_url}
                      onClick={() => {
                         const url = journeyLogs.find(l => l.day_number === 25)?.photo_url;
                         if (url) window.open(url, '_blank');
                      }}
                      className="flex-1 h-14 rounded-[1.5rem] bg-white/40 backdrop-blur-md border border-outline-variant/10 shadow-sm flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest hover:border-primary/20 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-white/40 group"
                    >
                      <Download className="w-3.5 h-3.5 text-primary group-hover:-translate-y-0.5 transition-transform" />
                      Extract Day 25
                    </button>
                </div>

                {/* Moved Registry Artifacts (Update PDF) Section */}
                <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-lg flex flex-col -mt-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">
                        {selectedStudent.daysLeft !== null && selectedStudent.daysLeft !== undefined ? `${selectedStudent.daysLeft} Days Remain` : 'Elite Member'}
                    </h3>
                    <button
                      disabled={!selectedStudent || isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-20 border border-primary/10"
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {resources.map((res) => {
                       const style = getFileIcon(res.content_type || '');
                       return (
                          <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-4 p-4 bg-white border border-outline-variant/5 rounded-2xl hover:border-primary/20 hover:shadow-md transition-all text-left">
                             <div className={cn("h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/20", style.color)}>
                                <style.icon className="w-4 h-4" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{res.file_name}</p>
                                <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">{formatFileSize(res.file_size)}</p>
                             </div>
                          </button>
                       );
                    })}
                    {resources.length === 0 && (
                       <div className="h-40 flex flex-col items-center justify-center opacity-10 grayscale">
                          <FolderOpen className="w-8 h-8 mb-2" />
                          <p className="text-sm font-medium text-[#374151] leading-relaxed">
                            {activeLog?.notes || 'No reflections shared for this day.'}
                          </p>
                       </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl bg-primary/[0.02] p-8 border border-primary/5 text-xl font-bold text-foreground/60 leading-relaxed text-center px-20">
                  {activeLog?.notes ? `"${activeLog.notes}"` : 'Soul reflection for this stage is currently unmanifested.'}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                <Sparkles className="w-16 h-16 mb-6" />
                <p className="text-[14px] font-bold uppercase tracking-widest text-center">Select a soul journey to observe the unfolding</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Communion & Artifacts */}
        <div className="w-72 xl:w-96 flex flex-col gap-8 shrink-0 h-full min-w-0">
          
          {/* Interaction Box (Chat) */}
          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b border-outline-variant/5 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Chat</h3>
              <MessageSquare className="w-4 h-4 text-foreground/10" />
            </div>
            
            <div className="flex-1 min-h-0">
              {selectedStudent && selectedStudent.conversationId ? (
                <ChatWindow
                  key={selectedStudent.conversationId}
                  conversationId={selectedStudent.conversationId}
                  currentUser={currentUser}
                  conversationType="direct"
                  title={selectedStudent.full_name}
                  otherParticipant={{ id: selectedStudent.id, full_name: selectedStudent.full_name, avatar_url: selectedStudent.avatar_url, email: selectedStudent.email } as Profile}
                  className="h-full"
                  hideHeader={true}
                  isMultiParty={true}
                />
              ) : selectedStudent ? (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/20">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-medium text-foreground/30">No dialogue sequence active for this manifestor.</p>
                  <button
                    onClick={() => handleStartChatWithStudent(selectedStudent.id)}
                    disabled={isStartingChat}
                    className="h-12 px-8 rounded-xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all"
                  >
                    {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initiate Sequence'}
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                  <User className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for Focus</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowScheduleModal(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <p className="text-xs font-bold text-foreground">Awaiting Response</p>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Temporal Alignment</h3>
              <h2 className="text-3xl font-bold text-foreground tracking-tight truncate">
                {selectedStudent?.full_name}
              </h2>
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="text-[9px] font-bold uppercase tracking-widest">Client Portal</span>
              </div>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Calibration Topic</label>
                <input
                  type="text"
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  placeholder="e.g. Morning Face Yoga Session"
                  className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground placeholder:text-foreground/20 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">Active Path</p>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                disabled={isScheduling || !meetingTopic || !meetingDate || !meetingTime}
                className="flex-[2] h-14 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20"
              >
                {isScheduling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Commit Alignment
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
