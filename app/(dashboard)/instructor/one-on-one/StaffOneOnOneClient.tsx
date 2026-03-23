'use client';
import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat';
import { searchStudents, getOrCreateSharedChat } from '@/lib/actions/chat';
import { uploadResource, getStudentResources } from '@/lib/actions/resources';
import { assignInstructor } from '@/lib/actions/subscription';
import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  MessageSquare,
  Loader2,
  Users,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  FileText,
  PlayCircle,
  Download,
  X,
  ChevronRight,
  RefreshCw,
  Crown,
  UserPlus,
  Activity,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  CheckCircle,
  Filter
} from 'lucide-react';
import type { Profile, StudentResource, LiveGrowthMetrics } from '@/types/database';
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
  metrics: LiveGrowthMetrics;
  instructors: Profile[];
}

export function StaffOneOnOneClient({ currentUser, students, metrics, instructors }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(students[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrial, setFilterTrial] = useState<'all' | 'trial' | 'paid'>('all');

  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [isLoadingJourney, setIsLoadingJourney] = useState(false);
  const [activeStepDay, setActiveStepDay] = useState<number>(1);

  // Derived journey variables
  const activeLog = journeyLogs.find((l) => l.day_number === activeStepDay);
  const day1Log = journeyLogs.find((l) => l.day_number === 1);
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';
  if (!activeLog?.photo_url) {
    const logsWithPhotos = [...journeyLogs].filter(l => l.photo_url).sort((a, b) => b.day_number - a.day_number);
    if (logsWithPhotos.length > 0) afterImage = logsWithPhotos[0].photo_url as string;
  }

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<
    Array<{ id: string; full_name: string; email: string; avatar_url: string | null }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const filtered = students.filter((s) => {
    const matchesQuery =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (filterTrial === 'trial') return s.isTrial;
    if (filterTrial === 'paid') return !s.isTrial;
    return true;
  });

  const expiringStudents = students.filter((s) => s.daysLeft !== null && s.daysLeft !== undefined && s.daysLeft <= 3);
  const trialStudents = students.filter((s) => s.isTrial);

  const getInstructorName = (instructorId: string | null | undefined) => {
    if (!instructorId) return null;
    return instructors.find((i) => i.id === instructorId)?.full_name || null;
  };

  useEffect(() => {
    if (!selectedStudent) {
      setResources([]); setJourneyLogs([]); return;
    }

    const loadData = async () => {
      setIsLoadingResources(true); setIsLoadingJourney(true);
      const [resData, logsData] = await Promise.all([
        getStudentResources(selectedStudent.id),
        getJourneyLogs(selectedStudent.id),
      ]);
      setResources(resData); setJourneyLogs(logsData);
      if (logsData.length > 0) {
        const latestDay = [...logsData].sort((a, b) => b.day_number - a.day_number)[0].day_number;
        setActiveStepDay(latestDay);
      } else setActiveStepDay(1);
      setIsLoadingResources(false); setIsLoadingJourney(false);
    };
    loadData();

    const supabase = createClient();
    const channel = supabase
      .channel(`staff-resources:${selectedStudent.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${selectedStudent.id}` },
        (payload) => setResources((prev) => [payload.new as StudentResource, ...prev]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent]);

  const handleGlobalSearch = async (query: string) => {
    setGlobalSearchQuery(query);
    if (query.length < 2) { setGlobalSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = await searchStudents(query);
      setGlobalSearchResults(results || []);
    } catch (e) { console.error(e); }
    setIsSearching(false);
  };

  const handleStartChatWithStudent = async (studentId: string, fromStudent?: StudentInfo) => {
    setIsStartingChat(true);
    try {
      const assignedInstructorId =
        fromStudent?.assignedInstructorId ||
        students.find((s) => s.id === studentId)?.assignedInstructorId || null;
      const { conversationId } = await getOrCreateSharedChat(studentId, assignedInstructorId);

      const fromSearch = globalSearchResults.find((s) => s.id === studentId);
      const source = fromStudent || fromSearch;
      if (source) {
        setSelectedStudent({ conversationId, id: source.id, full_name: source.full_name, avatar_url: source.avatar_url, email: source.email });
      } else {
        setSelectedStudent((prev) => prev ? { ...prev, conversationId } : prev);
      }
      setGlobalSearchQuery(''); setGlobalSearchResults([]);
    } catch (e) { console.error(e); }
    setIsStartingChat(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedStudent) return;
    const file = e.target.files[0];
    if (file.size > 20 * 1024 * 1024) { toast.error('File size exceeds 20MB limit.'); return; }
    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      const result = await uploadResource(selectedStudent.id, file.name, file.type, file.size, base64Data);
      if (result.success && result.data) {
        setResources((prev) => [result.data!, ...prev]);
        toast.success('Resource manifested successfully');
      } else toast.error(result.error || 'Manifestation failed');
    } catch (err) { toast.error('Failed to process offering'); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleAssignInstructor = async () => {
    if (!selectedStudent?.subscriptionId || !selectedInstructorId) return;
    setIsAssigning(true);
    try {
      await assignInstructor(selectedStudent.subscriptionId, selectedInstructorId);
      toast.success('Guide aligned successfully!');
      setShowAssignModal(false);
      setSelectedStudent((prev) => prev ? { ...prev, assignedInstructorId: selectedInstructorId } : prev);
    } catch (e: any) { toast.error(e.message || 'Failed to align guide'); }
    setIsAssigning(false);
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
    if (contentType.includes('video')) return { icon: PlayCircle, color: 'text-brand-emerald' };
    return { icon: FileText, color: 'text-foreground/40' };
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vh] bg-primary/2 rounded-full blur-[120px] -z-10" />

      {/* Header: Student-style airy title & metrics */}
      <header className="shrink-0 p-6 lg:p-10 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">Registry</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 italic">Soul Management Hub</p>
          </div>

          {/* Quick Metrics (Student Hub Style) */}
          <div className="hidden lg:flex items-center gap-8 ml-4">
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 leading-none">New Souls</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{metrics.newJoineesThisMonth}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 leading-none">Alignments</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{metrics.renewalsThisMonth}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 leading-none">Total Active</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{metrics.totalActiveStudents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search souls..."
              className="h-12 w-64 pl-12 pr-6 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/10 text-[12px] font-medium placeholder:text-foreground/20 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="h-12 w-12 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 flex items-center justify-center text-foreground/40 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
             <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-6 lg:p-10 gap-4 xl:gap-8 min-w-0">
        
        {/* LEFT: Registry List (Student Rail Style) */}
        <div className="w-64 xl:w-80 flex flex-col gap-6 shrink-0 h-full min-w-0">
          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-6">Directory</h3>
              
              <div className="flex gap-1 bg-foreground/5 p-1 rounded-xl mb-4">
                {(['all', 'trial', 'paid'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterTrial(f)}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      filterTrial === f 
                        ? "bg-white text-foreground shadow-sm" 
                        : "text-foreground/40 hover:text-foreground/60"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filtered.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group",
                    selectedStudent?.id === student.id 
                      ? "bg-white border border-outline-variant/10 shadow-md scale-[1.02]" 
                      : "bg-transparent border border-transparent hover:bg-white/40 hover:border-outline-variant/5"
                  )}
                >
                  <div className="relative shrink-0">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-sm font-bold text-primary">
                        {student.full_name[0]}
                      </div>
                    )}
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", student.isTrial ? "bg-primary animate-pulse" : "bg-brand-emerald")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{student.full_name}</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/20 mt-0.5">{student.isTrial ? "Discovery" : "Aligned"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Active Unfolding (Journey & Focus) */}
        <div className="flex-1 flex flex-col gap-8 overflow-hidden min-w-0">
          <div className="h-full flex flex-col bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden overflow-y-auto custom-scrollbar">
            {selectedStudent ? (
              <div className="flex flex-col min-h-full">
                {/* Profile Header (Student Focus Area Style) */}
                <div className="p-10 border-b border-outline-variant/5 flex items-center justify-between shrink-0 bg-white/20">
                  <div className="flex items-center gap-8">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm relative group">
                      {selectedStudent.avatar_url ? (
                        <img src={selectedStudent.avatar_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary bg-primary/5">
                          {selectedStudent.full_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">{selectedStudent.full_name}</h2>
                       <div className="flex items-center gap-6">
                         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                            <Clock className="w-3.5 h-3.5" /> Start: {selectedStudent.startDate ? new Date(selectedStudent.startDate).toLocaleDateString() : 'Unmanifested'}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                            <ShieldCheck className={cn("w-3.5 h-3.5", selectedStudent.isTrial ? "text-primary/60" : "text-brand-emerald/60")} /> {selectedStudent.isTrial ? "Trial Access" : "Full Alignment"}
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="h-12 px-6 rounded-xl bg-white border border-outline-variant/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4 text-primary" />
                      {selectedStudent.assignedInstructorId ? 'Re-align Guide' : 'Assign Guide'}
                    </button>
                    {/* Communion button removed as chat is now persistent on right */}
                  </div>
                </div>

                {/* Journey & Transformation Focus */}
                <div className="p-10 space-y-12">
                   {/* Journey Progress */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Transformation Path</h3>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest">Day {activeStepDay} of {JOURNEY_MAX_DAY}</span>
                      </div>
                      <JourneyProgress 
                        currentDay={selectedStudent.startDate
                          ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                          : 1}
                        activeDay={activeStepDay} 
                        onSelectDay={setActiveStepDay}
                        completedDays={new Set(journeyLogs.map(l => l.day_number))}
                      />
                    </div>

                    {/* Image Comparison / Visual Log */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Visual Resonance</h3>
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" />
                             <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20 italic text-right">Manifestation comparison</span>
                          </div>
                        </div>
                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-outline-variant/10 shadow-2xl bg-foreground">
                          <ImageComparison 
                            beforeImage={beforeImage}
                            afterImage={afterImage}
                            beforeLabel="Foundation"
                            afterLabel={`Day ${activeStepDay}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Soul Chronicles</h3>
                        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-outline-variant/5 min-h-[300px] flex flex-col">
                           {activeLog ? (
                             <div className="flex-1 flex flex-col">
                               <div className="flex items-center justify-between mb-6">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary italic">Observation {activeStepDay}</span>
                                  <span className="text-[8px] text-foreground/20">{new Date(activeLog.created_at).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm font-medium leading-relaxed text-foreground/70 italic whitespace-pre-wrap flex-1">
                                 "{activeLog.notes || 'The silence speaks of unspoken progress.'}"
                               </p>
                               <div className="mt-8 pt-6 border-t border-outline-variant/5 flex items-center justify-between">
                                  <div className="flex -space-x-2">
                                     {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-primary/10" />)}
                                  </div>
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">Frequency stable</span>
                               </div>
                             </div>
                           ) : (
                             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                               <Sparkles className="w-12 h-12 mb-4" />
                               <p className="text-[10px] font-bold uppercase tracking-widest">Day {activeStepDay} awaits manifestation</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                <Users className="w-16 h-16 mb-6" />
                <p className="text-[14px] font-bold uppercase tracking-widest">Select a soul to begin management</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Communion & Artifacts (Instructor Pattern) */}
        <div className="w-72 xl:w-96 flex flex-col gap-8 shrink-0 h-full min-w-0">
          
          {/* Interaction Box (ChatWindow) */}
          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b border-outline-variant/5 flex items-center justify-between shrink-0 bg-white/20">
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Communion</h3>
                <p className="text-sm font-serif font-bold text-foreground italic">Direct Sequence</p>
              </div>
              <div className={cn("h-2.5 w-2.5 rounded-full border-2 border-white", selectedStudent ? "bg-brand-emerald animate-pulse" : "bg-foreground/10")} />
            </div>

            <div className="flex-1 min-h-0 bg-white/10">
              {selectedStudent?.conversationId ? (
                <ChatWindow
                  key={selectedStudent.conversationId}
                  conversationId={selectedStudent.conversationId}
                  currentUser={currentUser}
                  conversationType="direct"
                  title={selectedStudent.full_name}
                  otherParticipant={{ id: selectedStudent.id, full_name: selectedStudent.full_name, avatar_url: selectedStudent.avatar_url, email: selectedStudent.email } as Profile}
                  className="h-full"
                  hideHeader={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20">
                  <MessageSquare className="w-10 h-10 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Initialize dialogue below</p>
                  {selectedStudent && (
                    <button
                      onClick={() => handleStartChatWithStudent(selectedStudent.id)}
                      disabled={isStartingChat}
                      className="mt-6 h-10 px-6 rounded-xl bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                    >
                      {isStartingChat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
                      Ignite
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Registry Artifacts (Resources) */}
          <div className="h-72 bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col shrink-0 overflow-hidden">
             <div className="flex items-center justify-between mb-8 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Registry Artifacts</h3>
                <button
                  disabled={!selectedStudent || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-20 border border-primary/10"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
             </div>

             <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                {resources.map((res) => {
                   const style = getFileIcon(res.content_type || '');
                   return (
                      <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-4 p-4 bg-white/40 border border-outline-variant/5 rounded-2xl hover:border-primary/20 hover:bg-white hover:shadow-md transition-all text-left group">
                         <div className={cn("h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/20 group-hover:bg-primary/5 group-hover:text-primary transition-colors", style.color)}>
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
                   <div className="h-40 flex flex-col items-center justify-center opacity-20 bg-foreground/[0.02] border border-dashed border-outline-variant/20 rounded-2xl">
                      <FolderOpen className="w-6 h-6 mb-2" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">Registry pristine</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* MODAL: Guide Alignment (Student-style overlay) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowAssignModal(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <h3 className="text-3xl font-serif font-bold text-foreground tracking-tight">Align New Guide</h3>
              <p className="text-sm text-foreground/40 font-medium italic">Resolving cosmic resonance for {selectedStudent?.full_name}</p>
            </header>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {instructors.map((instructor) => (
                <button
                  key={instructor.id}
                  onClick={() => setSelectedInstructorId(instructor.id)}
                  className={cn(
                    "w-full flex items-center gap-5 p-5 rounded-2xl transition-all group border",
                    selectedInstructorId === instructor.id 
                      ? "bg-foreground text-background border-foreground shadow-lg" 
                      : "bg-surface-container/50 hover:bg-white text-foreground border-outline-variant/5 shadow-sm"
                  )}
                >
                  <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-outline-variant/10">
                    {instructor.avatar_url ? (
                      <img src={instructor.avatar_url} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-primary/5 flex items-center justify-center text-lg font-bold text-primary">
                        {instructor.full_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate">{instructor.full_name}</p>
                    <p className={cn("text-[10px] font-bold truncate mt-0.5 opacity-40", selectedInstructorId === instructor.id ? "text-background" : "text-foreground")}>
                      {instructor.email}
                    </p>
                  </div>
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all", selectedInstructorId === instructor.id ? "bg-primary border-primary text-white" : "border-outline-variant/20 text-transparent")}>
                     <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="flex-1 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
              >
                Relinquish
              </button>
              <button
                onClick={handleAssignInstructor}
                disabled={isAssigning || !selectedInstructorId}
                className="flex-[2] h-14 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:scale-100"
              >
                {isAssigning ? 'Synchronizing...' : (
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
