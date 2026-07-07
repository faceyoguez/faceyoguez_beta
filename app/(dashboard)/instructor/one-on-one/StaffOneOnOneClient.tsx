'use client';
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { ChatWindow } from '@/components/chat';
import { searchStudents, getOrCreateSharedChat, getStudentsConversationMeta } from '@/lib/actions/chat';
import { uploadResource, getStudentResources } from '@/lib/actions/resources';
import { assignInstructor } from '@/lib/actions/subscription';
import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { sendWhatsAppMessage } from '@/lib/actions/whatsapp';
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
  File,
  FileText,
  PlayCircle,
  Download,
  X,
  ChevronRight,
  ChevronLeft,
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
  Filter,
  Mail,
  Calendar,
  Video,
  Trash2
} from 'lucide-react';
import type { Profile, StudentResource, LiveGrowthMetrics, MeetingWithDetails } from '@/types/database';
import { AnglePhotoViewer } from '@/components/ui/angle-photo-tracker';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';
import { getInstructorUpcomingMeetings, deleteMeeting } from '@/lib/actions/meetings';
import { cn, formatISTDate, formatISTTime, getSessionStatus, localInputToIST } from '@/lib/utils';

interface StudentInfo {
  conversationId: string | null;
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone?: string | null;
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
  const [docPage, setDocPage] = useState(1);

  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);

  // Derived journey variables
  const activeLog = journeyLogs.find((l: JourneyLog) => l.day_number === activeStepDay);
  const day1Log   = journeyLogs.find((l: JourneyLog) => l.day_number === 1);

  const studentMeetings = upcomingMeetings.filter((m: MeetingWithDetails) => m.student_id === selectedStudent?.id);
  const nextMeeting = studentMeetings.length > 0 ? studentMeetings[0] : null;

  const filteredResources = resources.filter(res => !res.file_url?.includes('zoom.us') && !res.content_type?.includes('zoom'));

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const [globalSearchResults, setGlobalSearchResults] = useState<
    Array<{ id: string; full_name: string; email: string; avatar_url: string | null }>
  >([]);
  const [studentListPage, setStudentListPage] = useState(1);
  const STUDENTS_PER_PAGE = 5;
  const [isMounted, setIsMounted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Conversation metadata: lastMessageAt + unreadCount per student
  const [convMeta, setConvMeta] = useState<Record<string, { lastMessageAt: string | null; unreadCount: number }>>({});

  useEffect(() => {
    setIsMounted(true);
    // Fetch conversation metadata for sorting by last message
    if (students.length > 0) {
      getStudentsConversationMeta(students.map(s => s.id)).then(meta => {
        setConvMeta(meta as any);
      }).catch(console.error);
    }
  }, []);

  const sortedAndFiltered = React.useMemo(() => {
    return [...students]
      .filter((s) => {
        const matchesQuery =
          s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
        if (filterTrial === 'trial') return s.isTrial;
        if (filterTrial === 'paid') return !s.isTrial;
        return true;
      })
      .sort((a, b) => {
        // 1. Expiry priority (within 5 days)
        const aExpiring = a.daysLeft !== null && a.daysLeft !== undefined && a.daysLeft <= 5;
        const bExpiring = b.daysLeft !== null && b.daysLeft !== undefined && b.daysLeft <= 5;
        
        if (aExpiring && !bExpiring) return -1;
        if (!aExpiring && bExpiring) return 1;
        
        // 2. Most recent message first
        const aMsg = convMeta[a.id]?.lastMessageAt || '';
        const bMsg = convMeta[b.id]?.lastMessageAt || '';
        if (bMsg > aMsg) return 1;
        if (aMsg > bMsg) return -1;

        // 3. Latest onboarding (startDate desc) as fallback
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        return bDate - aDate;
      });
  }, [students, searchQuery, filterTrial, convMeta]);

  // Reset page when filters change
  useEffect(() => {
    setStudentListPage(1);
  }, [searchQuery, filterTrial]);

  const paginatedStudents = sortedAndFiltered.slice(
    (studentListPage - 1) * STUDENTS_PER_PAGE,
    studentListPage * STUDENTS_PER_PAGE
  );

  const expiringStudents = students.filter((s) => s.daysLeft !== null && s.daysLeft !== undefined && s.daysLeft <= 3);
  const trialStudents = students.filter((s) => s.isTrial);

  const getInstructorName = (instructorId: string | null | undefined) => {
    if (!instructorId) return null;
    return instructors.find((i: Profile) => i.id === instructorId)?.full_name || null;
  };

  useEffect(() => {
    if (!selectedStudent) {
      setResources([]); setJourneyLogs([]); return;
    }

    const loadData = async () => {
      setIsLoadingResources(true); setIsLoadingJourney(true);
      setDocPage(1);
      const [resData, logsData, meetingsData] = await Promise.all([
        getStudentResources(selectedStudent.id),
        getJourneyLogs(selectedStudent.id),
        getInstructorUpcomingMeetings()
      ]);
      setResources(resData); setJourneyLogs(logsData); setUpcomingMeetings(meetingsData || []);

      const actualCurrentDay = selectedStudent.startDate
        ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
        : 1;
      setActiveStepDay(actualCurrentDay);
      setIsLoadingResources(false); setIsLoadingJourney(false);
    };
    loadData();

    const supabase = createClient();
    const channel = supabase
      .channel(`staff-resources:${selectedStudent.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${selectedStudent.id}` },
        (payload: { new: StudentResource }) => setResources((prev: StudentResource[]) => [payload.new, ...prev]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent]);

  const handleGlobalSearch = async (query: string) => {
    setSearchQuery(query); // Update local search too for consistency
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
        students.find((s: StudentInfo) => s.id === studentId)?.assignedInstructorId || null;
      const { conversationId } = await getOrCreateSharedChat(studentId, assignedInstructorId);

      const fromSearch = globalSearchResults.find((s: { id: string; full_name: string; email: string; avatar_url: string | null }) => s.id === studentId);
      const source = fromStudent || fromSearch;
      if (source) {
        setSelectedStudent({ conversationId, id: source.id, full_name: source.full_name, avatar_url: source.avatar_url, email: source.email });
      } else {
        setSelectedStudent((prev: StudentInfo | null) => prev ? { ...prev, conversationId } : prev);
      }
      setSearchQuery(''); setGlobalSearchResults([]);
    } catch (e) { console.error(e); }
    setIsStartingChat(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedStudent) return;
    const file = e.target.files[0];
    if (file.size > 20 * 1024 * 1024) { toast.error('File size exceeds 20MB limit.'); return; }
    setIsUploading(true);
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
        setResources((prev: StudentResource[]) => [result.data!, ...prev]);
        toast.success('Document shared successfully');
      } else {
        toast.error(result.error || 'Failed to share');
      }
    } catch (err) { 
      console.error(err);
      toast.error('Error sharing document'); 
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const handleAssignInstructor = async () => {
    if (!selectedStudent?.subscriptionId || !selectedInstructorId) return;
    setIsAssigning(true);
    try {
      await assignInstructor(selectedStudent.subscriptionId, selectedInstructorId);
      toast.success('Instructor assigned successfully!');
      setShowAssignModal(false);
      setSelectedStudent((prev: StudentInfo | null) => prev ? { ...prev, assignedInstructorId: selectedInstructorId } : prev);
    } catch (e: any) { toast.error(e.message || 'Failed to assign instructor'); }
    setIsAssigning(false);
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

  const handleDownloadAllPhotos = async () => {
    if (!selectedStudent || journeyLogs.length === 0) {
      toast.error('No photos available to download.');
      return;
    }

    // Collect all (url, filename) pairs from every log
    const photoEntries: { url: string; fileName: string }[] = [];
    for (const log of journeyLogs) {
      if (log.photo_url) {
        photoEntries.push({ url: log.photo_url, fileName: `Day_${log.day_number}_front.jpg` });
      }
      if (log.photo_url_left) {
        photoEntries.push({ url: log.photo_url_left, fileName: `Day_${log.day_number}_left.jpg` });
      }
      if (log.photo_url_right) {
        photoEntries.push({ url: log.photo_url_right, fileName: `Day_${log.day_number}_right.jpg` });
      }
    }

    if (photoEntries.length === 0) {
      toast.error('No photos have been uploaded by this student yet.');
      return;
    }

    setIsDownloadingPhotos(true);
    const loadingId = toast.loading(`Bundling ${photoEntries.length} photo(s)…`);

    try {
      const zip = new JSZip();
      const studentFolder = zip.folder(
        selectedStudent.full_name.replace(/\s+/g, '_') || 'student_photos'
      )!;

      // Fetch all photos in parallel via a proxy-safe approach
      await Promise.all(
        photoEntries.map(async ({ url, fileName }) => {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
            const finalName = fileName.replace(/\.jpg$/, `.${ext}`);
            studentFolder.file(finalName, blob);
          } catch (err) {
            console.warn(`Skipping ${fileName}:`, err);
          }
        })
      );

      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${selectedStudent.full_name.replace(/\s+/g, '_')}_all_photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success(`Downloaded ${photoEntries.length} photos successfully!`, { id: loadingId });
    } catch (err: any) {
      toast.error('Download failed. Please try again.', { id: loadingId });
      console.error('Photo download error:', err);
    } finally {
      setIsDownloadingPhotos(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden lg:overflow-hidden font-jakarta">

      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vh] bg-primary/2 rounded-full blur-[120px] -z-10" />

      {/* Header: Student-style airy title & metrics */}
      <header className="shrink-0 p-4 lg:p-10 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4 lg:gap-12">
          <div className="space-y-1">
            <h1 className="text-xl lg:text-4xl font-aktiv font-bold tracking-tight text-foreground">Student Register</h1>
            <p className="text-[8px] lg:text-[10px] font-aktiv font-bold uppercase tracking-[0.3em] text-foreground/30">Operations Control</p>
          </div>

          {/* Quick Metrics (Student Hub Style) */}
          <div className="hidden lg:flex items-center gap-6 ml-4">
            {[
              { label: 'New Admissions', value: metrics.newJoineesThisMonth || 0, icon: Sparkles, bg: 'bg-primary/5', color: 'text-primary' },
              { label: 'Total Enrolments', value: metrics.renewalsThisMonth || 0, icon: Activity, bg: 'bg-brand-emerald/5', color: 'text-brand-emerald' },
              { label: 'Active Students', value: metrics.totalActiveStudents || 0, icon: Users, bg: 'bg-foreground/5', color: 'text-foreground/60' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="h-1 w-1 rounded-full bg-primary/40" />
                  <p className="text-[8px] font-aktiv font-black uppercase tracking-[0.2em] text-foreground/40 leading-none">{stat.label}</p>
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-outline-variant/10 shadow-sm min-w-[120px] transition-all hover:bg-white/80">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center border transition-transform hover:scale-110 shrink-0", stat.bg, stat.color, "border-current/5")}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-aktiv font-bold text-primary leading-none tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}

            {/* Download Photos shortcut */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 ml-1">
                <div className="h-1 w-1 rounded-full bg-primary/40" />
                <p className="text-[8px] font-aktiv font-black uppercase tracking-[0.2em] text-foreground/40 leading-none">Progress Photos</p>
              </div>
              <button
                onClick={handleDownloadAllPhotos}
                disabled={isDownloadingPhotos || !selectedStudent}
                title={selectedStudent ? `Download all photos for ${selectedStudent.full_name}` : 'Select a student first'}
                className="flex items-center gap-3 bg-white/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-outline-variant/10 shadow-sm transition-all hover:bg-white/80 hover:border-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/5 text-primary shrink-0">
                  {isDownloadingPhotos
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                </div>
                <p className="text-[11px] font-aktiv font-bold text-foreground/50 whitespace-nowrap leading-none">
                  {isDownloadingPhotos ? 'Bundling…' : 'Download All'}
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="relative group">
            <Search className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="h-10 lg:h-12 w-40 lg:w-64 pl-10 lg:pl-12 pr-4 lg:pr-6 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/10 text-[12px] font-jakarta font-medium placeholder:text-foreground/20 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="hidden lg:flex h-12 w-12 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 items-center justify-center text-foreground/40 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 lg:p-10 gap-4 xl:gap-8 min-w-0">

        {/* LEFT: Registry List (Unified Mobile & Desktop) */}
        <div className="flex w-full lg:w-72 xl:w-80 flex-col gap-4 lg:gap-6 shrink-0 lg:h-full min-w-0 h-[45vh] lg:h-auto">
          {/* Filters */}
          <div className="flex gap-1 bg-white/40 backdrop-blur-xl p-1 rounded-2xl border border-outline-variant/10 shadow-sm shrink-0">
            {[
              { id: 'all', label: 'All', count: students.length },
              { id: 'trial', label: 'Unsub', count: students.filter((s: StudentInfo) => s.isTrial).length },
              { id: 'paid', label: 'Paid', count: students.filter((s: StudentInfo) => !s.isTrial).length }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterTrial(f.id as any)}
                className={cn(
                  "flex-1 h-9 lg:h-10 rounded-xl text-[8px] lg:text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                  filterTrial === f.id
                    ? "bg-white text-primary shadow-sm border border-outline-variant/10"
                    : "text-foreground/30 hover:text-primary transition-colors"
                )}
              >
                <span>{f.label}</span>
                <span className="text-[7px] font-jakarta opacity-40 px-1 py-0.5 bg-foreground/5 rounded-md">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 lg:p-8 border-b border-outline-variant/5 shrink-0">
              <h3 className="text-[10px] font-aktiv font-bold uppercase tracking-[0.2em] text-foreground/30">Student List</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 custom-scrollbar">
              {paginatedStudents.map((student) => {
                const elapsedDays = student.startDate ? Math.floor((Date.now() - new Date(student.startDate).getTime()) / 86400000) + 1 : 1;
                const isEnded = elapsedDays > 30;
                const isEnding = !isEnded && elapsedDays >= 25;
                const isEmergency = isEnded || isEnding;
                const isExpiringSoon = student.daysLeft !== null && student.daysLeft !== undefined && student.daysLeft <= 5;
                const isSelected = selectedStudent?.id === student.id;
                const unread = !isSelected ? (convMeta[student.id]?.unreadCount || 0) : 0;

                return (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedStudent(student);
                      setConvMeta(prev => ({ ...prev, [student.id]: { ...prev[student.id], unreadCount: 0 } }));
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedStudent(student); }}
                    className={cn(
                      "w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-all text-left group cursor-pointer",
                      selectedStudent?.id === student.id
                        ? (isEmergency ? "bg-red-50/50 border border-red-500/20 shadow-md scale-[1.02]" : "bg-white border border-outline-variant/10 shadow-md scale-[1.02]")
                        : unread > 0
                          ? "bg-[#FF8A75]/5 border border-[#FF8A75]/20 hover:bg-[#FF8A75]/10"
                          : "bg-transparent border border-transparent hover:bg-white/40 hover:border-outline-variant/5",
                      isExpiringSoon && selectedStudent?.id !== student.id && unread === 0 && "bg-amber-50/30 border-amber-100/50"
                    )}
                  >
                    <div className="relative shrink-0">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold", isEmergency ? "bg-red-500/10 text-red-600" : "bg-primary/5 text-primary")}>
                          {student.full_name[0]}
                        </div>
                      )}
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white", isEmergency ? "bg-red-500 animate-pulse" : (student.isTrial ? "bg-primary animate-pulse" : "bg-brand-emerald"))} />
                      {unread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4 px-1 rounded-full bg-[#FF8A75] text-white text-[8px] font-black flex items-center justify-center leading-none shadow-md animate-pulse z-10">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={cn("text-[13px] font-aktiv font-bold truncate transition-colors", isEmergency ? "text-red-600 group-hover:text-red-700" : unread > 0 ? "text-primary" : "text-foreground group-hover:text-primary")}>
                            {student.full_name}
                          </h4>
                          {student.isTrial && (
                            <span className="text-[7px] font-aktiv font-medium uppercase text-white bg-amber-500 px-1 py-0.5 rounded shadow-sm leading-none whitespace-nowrap">
                              Unsubscribed
                            </span>
                          )}
                          {isExpiringSoon && (
                             <span className="text-[7px] font-aktiv font-medium uppercase text-amber-600 bg-amber-100 px-1 py-0.5 rounded shadow-sm leading-none whitespace-nowrap flex items-center gap-1">
                               <Clock className="w-2 h-2" /> {student.daysLeft}d left
                             </span>
                          )}
                        </div>
                        {unread > 0 && (
                          <span className="text-[7px] font-black text-[#FF8A75] uppercase tracking-widest whitespace-nowrap shrink-0">
                            {unread} new
                          </span>
                        )}
                      </div>
                      <p className={cn("text-[9px] font-aktiv font-bold uppercase tracking-wider truncate", isEmergency ? "text-red-500/70" : unread > 0 ? "text-primary/60" : "text-foreground/30")}>
                        {isEmergency
                          ? (isEnded ? 'Plan Ended' : `Day ${elapsedDays}: Ending Soon`)
                          : (student.isTrial
                            ? "Not Yet Subscribed"
                            : unread > 0
                              ? `${unread} unread message${unread > 1 ? 's' : ''}`
                              : `Aligned: ${getInstructorName(student.assignedInstructorId) || 'Pending'}`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Student List Pagination */}
            {sortedAndFiltered.length > STUDENTS_PER_PAGE && (
              <div className="p-3 lg:p-4 border-t border-outline-variant/5 bg-white/20 backdrop-blur-sm flex items-center justify-between shrink-0">
                <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">
                  Page {studentListPage} of {Math.ceil(sortedAndFiltered.length / STUDENTS_PER_PAGE)}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setStudentListPage(p => Math.max(1, p - 1))}
                    disabled={studentListPage === 1}
                    className="h-7 w-7 lg:h-8 lg:w-8 rounded-lg border border-outline-variant/10 flex items-center justify-center disabled:opacity-20 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setStudentListPage(p => Math.min(Math.ceil(sortedAndFiltered.length / STUDENTS_PER_PAGE), p + 1))}
                    disabled={studentListPage === Math.ceil(sortedAndFiltered.length / STUDENTS_PER_PAGE)}
                    className="h-7 w-7 lg:h-8 lg:w-8 rounded-lg border border-outline-variant/10 flex items-center justify-center disabled:opacity-20 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Active Unfolding (Journey & Focus) */}
        <div className="flex-1 flex flex-col gap-4 lg:gap-8 lg:overflow-hidden min-w-0">
          <div className="flex flex-col bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm lg:overflow-hidden lg:overflow-y-auto lg:h-full custom-scrollbar">
            {selectedStudent ? (
              <div className="flex flex-col min-h-full">
                {/* Profile Header (Student Focus Area Style) */}
                <div className="p-4 lg:p-10 border-b border-outline-variant/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 bg-white/20">
                  <div className="flex items-center gap-4 lg:gap-8">
                    <div className="h-14 w-14 lg:h-20 lg:w-20 rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm relative group shrink-0">
                      {selectedStudent.avatar_url ? (
                        <img src={selectedStudent.avatar_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary bg-primary/5">
                          {selectedStudent.full_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        <h2 className="text-xl lg:text-3xl font-bold text-foreground tracking-tight truncate">
                          {selectedStudent.full_name}
                        </h2>
                        {selectedStudent.isTrial && (
                          <span className="text-[10px] font-medium uppercase text-white bg-amber-500 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            Unsubscribed
                          </span>
                        )}
                        <button
                          onClick={() => setShowAssignModal(true)} 
                          className="h-8 px-4 rounded-lg bg-primary/5 border border-primary/10 text-[9px] font-aktiv font-bold uppercase tracking-widest hover:bg-primary hover:text-white hover:scale-[1.02] transition-all flex items-center gap-2 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {selectedStudent.assignedInstructorId ? 'Change Instructor' : 'Assign Instructor'}
                        </button>
                        <button
                          onClick={() => setShowScheduleModal(true)} 
                          className="h-8 px-4 rounded-lg bg-primary/5 border border-primary/10 text-[9px] font-aktiv font-bold uppercase tracking-widest hover:bg-primary hover:text-white hover:scale-[1.02] transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Schedule Meeting
                        </button>
                      </div>
                        <div className="flex items-center gap-2 text-[10px] font-aktiv font-bold uppercase tracking-widest text-foreground/30">
                          <Clock className="w-3.5 h-3.5" /> Admission Date: {selectedStudent.startDate && isMounted ? new Date(selectedStudent.startDate).toLocaleDateString() : (selectedStudent.startDate ? '---' : 'Pending')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-aktiv font-bold uppercase tracking-widest text-foreground/30">
                          <ShieldCheck className={cn("w-3.5 h-3.5", selectedStudent.isTrial ? "text-amber-500/60" : "text-brand-emerald/60")} /> {selectedStudent.isTrial ? "Not Yet Subscribed" : "Full Enrolment"}
                        </div>
                        <a 
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedStudent.email}&su=${encodeURIComponent('Face Yoga Consultation')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] font-aktiv font-bold uppercase tracking-widest text-foreground/30 hover:text-red-500 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" /> {selectedStudent.email}
                        </a>
                      </div>
                    </div>

                  <div className="flex items-center gap-3">
                    {selectedStudent?.phone && (
                      <button
                        onClick={async (e) => {
                          const msg = `Hi ${selectedStudent.full_name.split(' ')[0]}! This is the Faceyoguez team. We are reaching out regarding your session...`;
                          const loadingToast = toast.loading('Sending WhatsApp...');
                          try {
                            if (!selectedStudent.phone) throw new Error('No phone number');
                            const result = await sendWhatsAppMessage(selectedStudent.phone, msg);
                            if (result.success) {
                              toast.success('Message sent via Official API', { id: loadingToast });
                            } else {
                              toast.dismiss(loadingToast);
                              const cleanPhone = selectedStudent.phone?.replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }
                          } catch (err) {
                            toast.dismiss(loadingToast);
                            const cleanPhone = selectedStudent.phone?.replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                          }
                        }}
                        className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                        title="Message on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 lg:w-6 lg:h-6">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Journey & Transformation Focus */}
                <div className="p-4 lg:p-10 space-y-8 lg:space-y-12">

                  {/* Scheduled Live Sessions */}
                  {studentMeetings.length > 0 && (
                    <div className="space-y-3">
                      {studentMeetings.map((meeting) => {
                        const status = getSessionStatus(meeting.start_time, meeting.duration_minutes || 45, meeting.calendar_event_id);
                        const isExpired = status === 'expired';
                        const isCompleted = status === 'completed';
                        return (
                          <div 
                            key={meeting.id}
                            onClick={() => !isExpired && !isCompleted && window.open(meeting.join_url, '_blank')}
                            className={cn(
                              "border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 shadow-sm",
                              isExpired ? "bg-slate-50 border-slate-100 opacity-60 cursor-default"
                              : isCompleted ? "bg-emerald-50 border-emerald-100 cursor-default"
                              : "cursor-pointer bg-primary/10 border-primary/20 hover:bg-primary/15"
                            )}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", isCompleted ? 'bg-emerald-200 text-emerald-700' : 'bg-primary text-white')}>
                                <Video className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Scheduled Live Session</span>
                                  {isExpired && <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Expired</span>}
                                  {isCompleted && <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">✓ Completed</span>}
                                </div>
                                <h4 className={cn("text-sm font-bold truncate mt-0.5", isExpired ? 'line-through text-slate-400' : isCompleted ? 'text-slate-500' : 'text-slate-800')}>{meeting.topic}</h4>
                                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                  {formatISTDate(meeting.start_time)} · {formatISTTime(meeting.start_time)} IST
                                </p>
                              </div>
                            </div>
                            {!isExpired && !isCompleted && (
                              <div className="shrink-0 flex items-center gap-3">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to cancel this meeting? An apology email will be sent to the student.")) {
                                      await handleDeleteMeeting(meeting.id);
                                    }
                                  }}
                                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 transition-colors"
                                  title="Cancel/Delete Meeting"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary bg-white border border-primary/10 px-3.5 py-2 rounded-xl">
                                  Join Call <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Image Comparison / Visual Log */}
                  <div className="grid grid-cols-1 gap-10">
                    {/* 3-Angle Photo Viewer */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-aktiv font-bold uppercase tracking-[0.2em] text-foreground/30">📸 Progress Photos</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">Day {activeStepDay} · 3-Angle</span>
                          <button
                            onClick={handleDownloadAllPhotos}
                            disabled={isDownloadingPhotos || journeyLogs.length === 0}
                            title="Download all uploaded photos as ZIP"
                            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary/5 text-primary border border-primary/10 text-[9px] font-aktiv font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isDownloadingPhotos
                              ? <><Loader2 className="w-3 h-3 animate-spin" /> Bundling…</>
                              : <><Download className="w-3 h-3" /> Download All</>}
                          </button>
                        </div>
                      </div>
                      {isLoadingJourney ? (
                        <div className="flex items-center justify-center h-40">
                          <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <JourneyProgress
                            currentDay={selectedStudent.startDate ? Math.min(30, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1)) : 1}
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
                          allLogs={journeyLogs}
                        />
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-aktiv font-bold uppercase tracking-[0.2em] text-foreground/30">Daily Log</h3>
                      <div className="bg-white/40 backdrop-blur-md rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-outline-variant/5 min-h-[200px] lg:min-h-[300px] flex flex-col">
                        {activeLog ? (
                          <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-[9px] font-aktiv font-bold uppercase tracking-widest text-primary">Day {activeStepDay} Notes</span>
                              <span className="text-[8px] font-jakarta text-foreground/20">{isMounted ? new Date(activeLog.created_at).toLocaleDateString() : '---'}</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-foreground/70 whitespace-pre-wrap flex-1">
                              "{activeLog.notes || 'No notes added for today.'}"
                            </p>
                            <div className="mt-8 pt-6 border-t border-outline-variant/5 flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map((i: any) => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-primary/10" />)}
                              </div>
                              <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">On track</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                            <Sparkles className="w-12 h-12 mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting daily update</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                    <div className="bg-white/40 backdrop-blur-md p-4 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-outline-variant/10 shadow-lg flex flex-col -mt-4 lg:-mt-6">
                      <div className="flex items-center justify-between mb-8 shrink-0">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[10px] font-aktiv font-bold uppercase tracking-[0.2em] text-foreground/30">Shared Documents</h3>
                          <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[8px] font-black uppercase tracking-wider">{filteredResources.length} Total</span>
                        </div>
                        <button
                          disabled={!selectedStudent || isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-20 border border-primary/10"
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                      </div>

                      <div className="space-y-2 flex-1">
                        {filteredResources.slice((docPage - 1) * 5, docPage * 5).map((res) => {
                          const style = getFileIcon(res.content_type || '');
                          return (
                            <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-4 p-3 bg-white border border-outline-variant/5 rounded-2xl hover:border-primary/20 hover:shadow-md transition-all text-left group">
                              <div className={cn("h-9 w-9 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/20 group-hover:bg-primary/5 group-hover:text-primary transition-colors", style.color)}>
                                <style.icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-jakarta font-bold text-foreground truncate">{res.file_name}</p>
                                <p className="text-[9px] font-aktiv font-bold text-foreground/20 uppercase tracking-widest mt-0.5">{formatFileSize(res.file_size)}</p>
                              </div>
                            </button>
                          );
                        })}
                        
                        {filteredResources.length > 5 && (
                          <div className="mt-6 pt-6 border-t border-outline-variant/5 flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">Page {docPage} of {Math.ceil(filteredResources.length / 5)}</span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setDocPage(p => Math.max(1, p - 1))}
                                disabled={docPage === 1}
                                className="h-8 w-8 rounded-lg border border-outline-variant/10 flex items-center justify-center disabled:opacity-20 hover:bg-white transition-colors"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => setDocPage(p => Math.min(Math.ceil(filteredResources.length / 5), p + 1))}
                                disabled={docPage === Math.ceil(filteredResources.length / 5)}
                                className="h-8 w-8 rounded-lg border border-outline-variant/10 flex items-center justify-center disabled:opacity-20 hover:bg-white transition-colors"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {filteredResources.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-10">
                            <File className="w-12 h-12 mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No documents shared yet</p>
                          </div>
                        )}
                    </div>
                    </div>
                  </div>
                </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                <Users className="w-16 h-16 mb-6" />
                <p className="text-[14px] font-aktiv font-bold uppercase tracking-widest">Select a soul to begin management</p>
              </div>
            )}
          </div>
        </div>


      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-foreground text-background rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60]"
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {selectedStudent?.conversationId && !isChatOpen && (
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-emerald rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Floating Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 lg:bottom-28 lg:right-10 w-[90vw] sm:w-[400px] h-[70vh] sm:h-[700px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-outline-variant/10 z-[60] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/5 bg-foreground/5 shrink-0">
            <h3 className="text-sm font-bold tracking-tight">
              Chat with {selectedStudent?.full_name || 'Student'}
            </h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 hover:bg-white rounded-full transition-colors text-foreground/50 hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-white/50 relative">
            {selectedStudent?.conversationId ? (
              <ChatWindow
                key={selectedStudent.conversationId}
                conversationId={selectedStudent.conversationId!}
                currentUser={currentUser}
                conversationType="direct"
                title={selectedStudent.full_name}
                otherParticipant={{ id: selectedStudent.id, full_name: selectedStudent.full_name, avatar_url: selectedStudent.avatar_url, email: selectedStudent.email } as Profile}
                className="h-full"
                hideHeader={true}
                isMultiParty={true}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                <MessageSquare className="w-10 h-10 mb-4" />
                <p className="text-[10px] font-aktiv font-bold uppercase tracking-widest">No active chat</p>
                {selectedStudent && (
                  <button
                    onClick={() => handleStartChatWithStudent(selectedStudent.id)}
                    disabled={isStartingChat}
                    className="mt-6 h-10 px-6 rounded-xl bg-foreground text-background text-[9px] font-aktiv font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                  >
                    {isStartingChat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
                    Start Chat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Guide Alignment (Student-style overlay) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowAssignModal(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <h3 className="text-3xl font-aktiv font-bold text-foreground tracking-tight">Align New Guide</h3>
              <p className="text-sm text-foreground/40 font-medium">Loading chat for {selectedStudent?.full_name}</p>
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
                    <p className="text-sm font-aktiv font-bold truncate">{instructor.full_name}</p>
                    <p className={cn("text-[10px] font-aktiv font-bold truncate mt-0.5 opacity-40", selectedInstructorId === instructor.id ? "text-background" : "text-foreground")}>
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
                className="flex-1 h-14 rounded-2xl text-[10px] font-aktiv font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
              >
                Relinquish
              </button>
              <button
                onClick={handleAssignInstructor}
                disabled={isAssigning || !selectedInstructorId}
                className="flex-[2] h-14 rounded-2xl bg-foreground text-background text-[10px] font-aktiv font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:scale-100"
              >
                {isAssigning ? 'Synchronizing...' : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Confirm Assignment
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowScheduleModal(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <h3 className="text-3xl font-aktiv font-bold text-foreground tracking-tight">Schedule Meeting</h3>
              <p className="text-sm text-foreground/40 font-medium">Create 1-on-1 Consultation for {selectedStudent?.full_name}</p>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-400 ml-4">Target Student</label>
                <div className="h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary font-aktiv font-bold text-sm">
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
                  className="h-14 w-full px-5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:border-primary/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 h-14 rounded-2xl text-[10px] font-aktiv font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                disabled={isScheduling || !meetingDateTime}
                className="flex-[2] h-14 rounded-2xl bg-foreground text-background text-[10px] font-aktiv font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:scale-100"
              >
                {isScheduling ? 'Scheduling...' : (
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Set Schedule
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
