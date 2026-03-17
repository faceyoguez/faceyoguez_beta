'use client';
import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat';
import { PageHeader } from '@/components/layout/PageHeader';
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
} from 'lucide-react';
import type { Profile, StudentResource, LiveGrowthMetrics } from '@/types/database';

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

  // Resources state
  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Journey state
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [isLoadingJourney, setIsLoadingJourney] = useState(false);

  // Assign instructor modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Global search (add student to view)
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

  // Load data when student changes
  useEffect(() => {
    if (!selectedStudent) {
      setResources([]);
      setJourneyLogs([]);
      return;
    }

    const loadData = async () => {
      setIsLoadingResources(true);
      setIsLoadingJourney(true);
      const [resData, logsData] = await Promise.all([
        getStudentResources(selectedStudent.id),
        getJourneyLogs(selectedStudent.id),
      ]);
      setResources(resData);
      setJourneyLogs(logsData);
      setIsLoadingResources(false);
      setIsLoadingJourney(false);
    };
    loadData();

    // Realtime resource updates
    const supabase = createClient();
    const channel = supabase
      .channel(`staff-resources:${selectedStudent.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${selectedStudent.id}` },
        (payload) => setResources((prev) => [payload.new as StudentResource, ...prev])
      )
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
      // Use the student's assigned instructor so all parties share one conversation
      const assignedInstructorId =
        fromStudent?.assignedInstructorId ||
        students.find((s) => s.id === studentId)?.assignedInstructorId ||
        null;
      const { conversationId } = await getOrCreateSharedChat(studentId, assignedInstructorId);

      const fromSearch = globalSearchResults.find((s) => s.id === studentId);
      const source = fromStudent || fromSearch;
      if (source) {
        setSelectedStudent({ conversationId, id: source.id, full_name: source.full_name, avatar_url: source.avatar_url, email: source.email });
      } else {
        // Refresh the selected student's conversationId in-place
        setSelectedStudent((prev) => prev ? { ...prev, conversationId } : prev);
      }
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    } catch (e) { console.error(e); }
    setIsStartingChat(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedStudent) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { alert('File size exceeds 5MB limit.'); return; }
    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      const result = await uploadResource(selectedStudent.id, file.name, file.type, file.size, base64Data);
      if (result.success && result.data) {
        setResources((prev) => [result.data!, ...prev]);
        toast.success('File uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (err) { toast.error('Failed to process file'); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleAssignInstructor = async () => {
    if (!selectedStudent?.subscriptionId || !selectedInstructorId) return;
    setIsAssigning(true);
    try {
      await assignInstructor(selectedStudent.subscriptionId, selectedInstructorId);
      toast.success('Instructor assigned successfully!');
      setShowAssignModal(false);
      setSelectedStudent((prev) => prev ? { ...prev, assignedInstructorId: selectedInstructorId } : prev);
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign instructor');
    }
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
    if (contentType.includes('pdf')) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
    if (contentType.includes('image')) return { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (contentType.includes('video')) return { icon: PlayCircle, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
    return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
  };

  const latestJourneyPhoto = [...journeyLogs].filter(l => l.photo_url).sort((a, b) => b.day_number - a.day_number)[0]?.photo_url;

  return (
    <div className="flex flex-col p-4 lg:p-6 overflow-hidden h-[calc(100vh-2rem)]">
      <PageHeader
        title="Client Management"
        highlight="Command Center"
        description="Monitor all students, assign instructors, and track growth"
      />

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-12 min-h-0 h-[calc(100vh-140px)]">

        {/* ── LEFT COLUMN: Metrics + Student List ── */}
        <div className="flex flex-col lg:col-span-3 gap-4 min-h-0 overflow-y-auto">

          {/* Growth Metrics */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-3 text-white shadow-md">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">New Joinees</p>
              <p className="text-2xl font-extrabold">{metrics.newJoineesThisMonth}</p>
              <p className="text-[9px] opacity-70">this month</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 text-white shadow-md">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Renewals</p>
              <p className="text-2xl font-extrabold">{metrics.renewalsThisMonth}</p>
              <p className="text-[9px] opacity-70">this month</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-3 text-white shadow-md">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Total Active</p>
              <p className="text-2xl font-extrabold">{metrics.totalActiveStudents}</p>
              <p className="text-[9px] opacity-70">students</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-3 text-white shadow-md">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Expiring</p>
              <p className="text-2xl font-extrabold">{metrics.expiringThisWeek}</p>
              <p className="text-[9px] opacity-70">this week</p>
            </div>
          </div>

          {/* Alerts: Expiring Students */}
          {expiringStudents.length > 0 && (
            <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800">Expiring Soon</p>
              </div>
              <div className="space-y-1.5">
                {expiringStudents.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="flex items-center justify-between w-full text-left rounded-lg bg-white border border-amber-100 px-2.5 py-1.5 hover:border-amber-300 transition-all"
                  >
                    <p className="truncate text-xs font-bold text-gray-800">{s.full_name}</p>
                    <span className="shrink-0 text-[10px] font-bold text-red-500">{s.daysLeft}d</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Student List */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-pink-100/40 bg-white shadow-sm min-h-[200px]">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">All Students</h3>
                <span className="text-[11px] font-bold text-pink-500">{students.length}</span>
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full rounded-xl border border-pink-100/60 bg-white/50 py-2 pl-8 pr-3 text-xs outline-none transition-all focus:ring-2 focus:ring-pink-200"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 mb-1">
                {(['all', 'trial', 'paid'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterTrial(f)}
                    className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-all ${filterTrial === f ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {f === 'all' ? `All (${students.length})` : f === 'trial' ? `Trial (${trialStudents.length})` : `Paid (${students.length - trialStudents.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Student list items */}
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-6 text-xs text-gray-400">No students found</div>
              ) : (
                filtered.map((student) => {
                  const assignedName = getInstructorName(student.assignedInstructorId);
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`group flex items-center gap-2.5 rounded-xl border p-2.5 transition-all text-left ${
                        selectedStudent?.id === student.id
                          ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 shadow-sm'
                          : 'border-transparent bg-white/40 hover:border-pink-100 hover:bg-white/60'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-xs font-bold text-white shadow-sm">
                            {student.full_name?.charAt(0)}
                          </div>
                        )}
                        {student.isTrial && (
                          <span className="absolute -top-1 -right-1 rounded-full bg-amber-400 px-1 text-[7px] font-bold text-white">T</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-bold text-gray-800">{student.full_name}</p>
                          {student.isTrial ? (
                            <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-600">TRIAL</span>
                          ) : (
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${(student.daysLeft ?? 99) <= 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {student.daysLeft}d
                            </span>
                          )}
                        </div>
                        {assignedName ? (
                          <p className="text-[9px] text-blue-500 font-medium mt-0.5 truncate flex items-center gap-0.5">
                            <UserCheck className="h-2.5 w-2.5 shrink-0" />{assignedName}
                          </p>
                        ) : (
                          <p className="text-[9px] text-gray-400 mt-0.5">Unassigned</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN: Student Detail + Chat ── */}
        <div className="flex flex-col lg:col-span-5 gap-4 min-h-0">

          {/* Student header card */}
          {selectedStudent ? (
            <div className="shrink-0 rounded-2xl border border-pink-100/40 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedStudent.avatar_url ? (
                    <img src={selectedStudent.avatar_url} alt="" className="h-14 w-14 rounded-2xl border-2 border-pink-100 object-cover shadow" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-xl font-extrabold text-white shadow">
                      {selectedStudent.full_name?.charAt(0)}
                    </div>
                  )}
                  {selectedStudent.isTrial && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-white shadow">TRIAL</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold text-gray-900 truncate">{selectedStudent.full_name}</h2>
                  <p className="text-xs text-gray-500 truncate">{selectedStudent.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {selectedStudent.daysLeft !== null && selectedStudent.daysLeft !== undefined && (
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${(selectedStudent.daysLeft ?? 99) <= 3 ? 'bg-red-100 text-red-600' : 'bg-pink-50 text-pink-600'}`}>
                        <Clock className="h-3 w-3" />{selectedStudent.daysLeft} days left
                      </span>
                    )}
                    {getInstructorName(selectedStudent.assignedInstructorId) ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                        <UserCheck className="h-3 w-3" />{getInstructorName(selectedStudent.assignedInstructorId)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedInstructorId(selectedStudent.assignedInstructorId || ''); setShowAssignModal(true); }}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-pink-500 px-3 py-2 text-xs font-bold text-white shadow hover:bg-pink-600 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign
                </button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 rounded-2xl border border-dashed border-pink-200 bg-white/50 p-6 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Select a student to view details</p>
            </div>
          )}

          {/* Chat Window */}
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-pink-100/40 bg-white shadow-sm min-h-[300px]">
            <div className="px-5 pt-4 pb-3 shrink-0 flex items-center gap-2 border-b border-pink-50">
              <MessageSquare className="h-4 w-4 text-pink-500" />
              <h3 className="text-sm font-bold text-gray-900">
                {selectedStudent ? `Chat with ${selectedStudent.full_name}` : 'Direct Messages'}
              </h3>
            </div>
            <div className="flex-1 min-h-0">
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
                  isMultiParty={true}
                />
              ) : selectedStudent ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-200" />
                  <p className="text-sm font-bold text-gray-600">No conversation yet</p>
                  <p className="text-xs text-gray-400">Open a shared thread with {selectedStudent.full_name}</p>
                  <button
                    onClick={() => handleStartChatWithStudent(selectedStudent.id, selectedStudent)}
                    disabled={isStartingChat}
                    className="flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-pink-600 transition-all disabled:opacity-60"
                  >
                    {isStartingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Start Shared Chat
                  </button>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="mb-3 h-12 w-12 text-gray-200" />
                  <p className="text-sm font-medium text-gray-500">Select a student</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Progress Gallery + Resources ── */}
        <div className="flex flex-col lg:col-span-4 gap-4 min-h-0">

          {/* Quick Search to add any student */}
          <div className="shrink-0 rounded-2xl border border-pink-100/40 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-pink-500" />
              <h3 className="text-sm font-bold text-gray-900">Find Any Student</h3>
            </div>
            <div className="relative">
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-pink-100/60 bg-pink-50/30 py-2 pl-4 pr-3 text-xs outline-none focus:ring-2 focus:ring-pink-200"
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {globalSearchResults.length > 0 && (
              <div className="mt-2 rounded-xl border border-pink-100 bg-white shadow-lg overflow-hidden">
                {globalSearchResults.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStartChatWithStudent(s.id, undefined)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-pink-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {s.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-gray-800 truncate">{s.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{s.email}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress Gallery */}
          <div className="shrink-0 rounded-2xl border border-pink-100/40 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-pink-500" />
                <h3 className="text-sm font-bold text-gray-900">Progress Gallery</h3>
              </div>
              {isLoadingJourney && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {selectedStudent ? (
              journeyLogs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {journeyLogs.filter(l => l.photo_url).slice(0, 6).map((log) => (
                    <div key={log.id} className="relative aspect-square rounded-xl overflow-hidden border border-pink-100 bg-gray-50">
                      <img src={log.photo_url!} alt={`Day ${log.day_number}`} className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-1">
                        <p className="text-[9px] font-bold text-white">Day {log.day_number}</p>
                      </div>
                    </div>
                  ))}
                  {journeyLogs.filter(l => l.photo_url).length === 0 && (
                    <div className="col-span-3 flex items-center justify-center py-6 text-xs text-gray-400">
                      No photos uploaded yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-200 mb-1" />
                    <p className="text-xs text-gray-400">No journey data yet</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center py-6 text-xs text-gray-400">Select a student</div>
            )}
          </div>

          {/* Resources */}
          <div className="flex flex-1 flex-col rounded-2xl border border-pink-100/40 bg-white p-4 shadow-sm min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-pink-500" />
                <h3 className="text-sm font-bold text-gray-900">Resources</h3>
              </div>
              <div className="flex items-center gap-2">
                {isLoadingResources && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,image/*,.doc,.docx,.mp4"
                  onChange={handleFileUpload}
                />
                <button
                  disabled={!selectedStudent || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-pink-50 px-2.5 py-1.5 text-xs font-bold text-pink-500 hover:bg-pink-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Upload
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {resources.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-gray-400">No resources yet</div>
              ) : (
                resources.map((res) => {
                  const style = getFileIcon(res.content_type || '');
                  return (
                    <div
                      key={res.id}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/80 bg-white/60 p-3 transition-all hover:bg-white hover:shadow-sm"
                      onClick={() => window.open(res.file_url, '_blank')}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${style.bg} ${style.color} ${style.border}`}>
                        <style.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold text-gray-800">{res.file_name}</h4>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-tight text-gray-400">
                          {new Date(res.created_at).toLocaleDateString()} · {formatFileSize(res.file_size)}
                        </p>
                      </div>
                      <a
                        href={res.file_url}
                        download={res.file_name}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-pink-50 transition-colors"
                      >
                        <Download className="h-4 w-4 text-gray-300 transition-colors group-hover:text-pink-500" />
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ASSIGN INSTRUCTOR MODAL */}
      {showAssignModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-2xl overflow-hidden border border-white/40 animate-in fade-in zoom-in-95 duration-300">

            {/* Header */}
            <div className="relative flex flex-col p-6 bg-gradient-to-br from-pink-50 via-white to-pink-50/30 border-b border-pink-100/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500" />
              <div className="flex items-start justify-between">
                <div className="flex gap-4 items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 shadow-inner">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Assign Instructor</h3>
                    <p className="text-sm font-medium text-pink-600/80 mt-0.5">for {selectedStudent?.full_name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-700 transition-all bg-white border border-gray-100 shadow-sm">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 bg-white/50">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Select Instructor</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {instructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      onClick={() => setSelectedInstructorId(instructor.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all ${
                        selectedInstructorId === instructor.id
                          ? 'border-pink-400 bg-pink-50 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-pink-200'
                      }`}
                    >
                      {instructor.avatar_url ? (
                        <img src={instructor.avatar_url} alt="" className="h-9 w-9 rounded-full border border-pink-100 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-sm font-bold text-white">
                          {instructor.full_name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-800">{instructor.full_name}</p>
                          {(instructor as any).is_master_instructor && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                              <Crown className="h-2.5 w-2.5" /> Master
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{instructor.email}</p>
                      </div>
                      {selectedInstructorId === instructor.id && (
                        <div className="h-5 w-5 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end items-center bg-gray-50/80 p-6 border-t border-gray-100">
              <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all text-sm">
                Cancel
              </button>
              <button
                onClick={handleAssignInstructor}
                disabled={isAssigning || !selectedInstructorId}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed text-sm"
              >
                {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
