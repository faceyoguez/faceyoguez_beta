'use client';
import React from 'react';
import { useState } from 'react';
import { ChatWindow } from '@/components/chat';
import { PageHeader } from '@/components/layout/PageHeader';
import { searchStudents, getOrCreateDirectChat } from '@/lib/actions/chat';
import { uploadResource, getStudentResources } from '@/lib/actions/resources';
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
} from 'lucide-react';
import type { Profile, StudentResource } from '@/types/database';

import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTrigger,
} from '@/components/ui/stepper';

const MILESTONE_DAYS = [1, 7, 14, 21, 30];

interface StudentInfo {
  conversationId: string;
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
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
      const { conversationId } = await getOrCreateDirectChat(studentId);
      const student = globalSearchResults.find((s) => s.id === studentId);
      if (student) {
        const newStudent: StudentInfo = {
          conversationId,
          id: student.id,
          full_name: student.full_name,
          avatar_url: student.avatar_url,
          email: student.email,
        };
        setSelectedStudent(newStudent);
      }
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An error occurred';
      console.error('Start chat error:', message);
    }
    setIsStartingChat(false);
  };

  // Fetch resources and journey logs when a student is selected
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

        if (logsData.length > 0) {
          const latestDay = [...logsData].sort((a, b) => b.day_number - a.day_number)[0].day_number;
          setActiveStepDay(latestDay);
        } else {
          setActiveStepDay(1);
        }

        setIsLoadingResources(false);
        setIsLoadingJourney(false);
      };
      loadData();

      // Real-time subscription for new resources
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
    } else {
      setResources([]);
      setJourneyLogs([]);
    }
  }, [selectedStudent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedStudent) return;
    const file = e.target.files[0];

    // Basic size validation (e.g., 5MB limit)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }

    setIsUploading(true);
    try {
      // Read file to base64
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
        console.error('Upload error details:', result.error);
        alert(result.error || 'Upload failed. Check console for details.');
      }
    } catch (err: any) {
      console.error('File read error:', err);
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
    if (contentType.includes('pdf')) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
    if (contentType.includes('image')) return { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (contentType.includes('video')) return { icon: PlayCircle, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
    return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
  };

  return (
    <div className="flex flex-col p-4 lg:p-6 overflow-hidden h-[calc(100vh-2rem)]">
      <PageHeader
        title="1-on-1"
        highlight="Sessions"
        description="Manage your one-on-one students"
      />

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-12 min-h-0 h-[calc(100vh-140px)]">
        {/* ── Left: Student list & Chat ── */}
        <div className="flex flex-col h-full lg:col-span-3 gap-5 min-h-0">
          <div className="relative flex flex-[0.35] min-h-[150px] shrink-0 flex-col overflow-hidden rounded-2xl border border-pink-100/40 bg-white shadow-sm">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between pointer-events-none">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                STUDENTS
              </h3>
              <span className="text-[11px] font-bold text-pink-500">
                {students.length} Active
              </span>
            </div>

            {/* Local search */}
            <div className="relative px-5 mb-4 shrink-0">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter students..."
                className="w-full rounded-xl border border-pink-100/60 bg-white/50 py-2 pl-8 pr-3 text-xs outline-none transition-all focus:ring-2 focus:ring-pink-200"
              />
            </div>

            {/* Student list */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 pb-5">
              {filtered.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-gray-400">No students found</p>
                </div>
              ) : (
                filtered.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`group flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 ${selectedStudent?.id === student.id
                      ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 shadow-sm'
                      : 'border-transparent bg-white/40 hover:border-pink-100 hover:bg-white/60'
                      }`}
                  >
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-xs font-bold text-white shadow-sm">
                        {student.full_name?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-gray-800">
                          {student.full_name}
                        </p>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
                      </div>
                      <p className="truncate text-[10px] text-gray-400">{student.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="relative flex flex-[0.65] min-h-[250px] flex-col overflow-hidden rounded-2xl border border-pink-100/40 bg-white shadow-sm">
            <div className="px-5 pt-5 pb-3 shrink-0 flex items-center gap-2 border-b border-pink-50">
              <MessageSquare className="h-4 w-4 text-pink-500" />
              <h3 className="text-sm font-bold text-gray-900">Direct Messages</h3>
            </div>
            <div className="flex-1 min-h-0">
              {selectedStudent ? (
                <ChatWindow
                  key={selectedStudent.conversationId}
                  conversationId={selectedStudent.conversationId}
                  currentUser={currentUser}
                  conversationType="direct"
                  title={selectedStudent.full_name}
                  otherParticipant={{
                    id: selectedStudent.id,
                    full_name: selectedStudent.full_name,
                    avatar_url: selectedStudent.avatar_url,
                    email: selectedStudent.email,
                  } as Profile}
                  className="h-full"
                  hideHeader={true}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="mb-3 h-12 w-12 text-gray-200" />
                  <p className="text-sm font-medium text-gray-500">Select a student</p>
                </div>
              )}
            </div>
          </div>
        </div >

        {/* ── Middle: Transformation Journey ── */}
        <div className="flex flex-col lg:col-span-5 min-h-0">
          <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-pink-100/40 bg-white p-5 shadow-sm min-h-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
                  Journey Path
                </h3>
                <p className="mt-0.5 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  {selectedStudent ? `DAY ${activeStepDay} ANALYSIS` : 'No student selected'}
                </p>
              </div>
              <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-pink-600">
                Week {Math.ceil(activeStepDay / 7)}
              </span>
            </div>

            {selectedStudent ? (
              <div className="flex flex-1 flex-col overflow-hidden min-h-0 gap-3">
                {/* Journey path */}
                <div className="w-full shrink-0">
                  <Stepper value={activeStepDay} onValueChange={setActiveStepDay} className="w-full mt-2 mb-2">
                    <StepperNav>
                      {MILESTONE_DAYS.map((day) => (
                        <StepperItem
                          key={day}
                          step={day}
                          completed={journeyLogs.some(l => l.day_number === day)}
                        >
                          <StepperTrigger>
                            <StepperIndicator>{day}</StepperIndicator>
                          </StepperTrigger>
                          {MILESTONE_DAYS.indexOf(day) < MILESTONE_DAYS.length - 1 && (
                            <StepperSeparator className="mx-2" />
                          )}
                        </StepperItem>
                      ))}
                    </StepperNav>
                  </Stepper>
                </div>

                {/* Slider */}
                <div className="relative w-full flex-[1.5] min-h-0 overflow-hidden rounded-2xl shadow-sm border border-pink-50">
                  {isLoadingJourney ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
                    </div>
                  ) : (
                    <ImageComparison
                      beforeImage={beforeImage}
                      afterImage={afterImage}
                      disabled={activeStepDay < 7}
                      altBefore="Day 1 Baseline"
                      altAfter={`Day ${activeStepDay} Progress`}
                    />
                  )}
                </div>

                {/* Daily check-in read-only */}
                <div className="flex flex-col flex-1 shrink-0 overflow-hidden min-h-0 mt-2 bg-pink-50/20 rounded-xl p-4 border border-pink-50">
                  <h5 className="mb-4 flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    <Edit3 className="h-4 w-4 text-pink-500" />
                    Daily Reflection
                  </h5>
                  <div className="space-y-5 overflow-y-auto flex-1 text-gray-700">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider">Q: How do you feel today?</p>
                      <p className="text-[13px] italic leading-relaxed text-gray-800 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        {activeLog?.notes ? `"${activeLog.notes}"` : 'No reflection submitted for this day yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <ImageIcon className="mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm font-medium">Select a student</p>
              </div>
            )}
          </div>
        </div >

        {/* ── Right: Actions + Resources ── */}
        <div className="flex flex-col lg:col-span-4 gap-5 min-h-0">
          {/* Schedule a New Meeting */}
          <button className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ec4899] py-4 text-[13px] font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-pink-600">
            <Calendar className="h-5 w-5" />
            Schedule a New Meeting
          </button >

          {/* Next session card */}
          < div className="group shrink-0 relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-4 text-white shadow-lg transition-all duration-500 hover:-translate-y-1" >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink-500/30 blur-[60px] transition-transform duration-700 group-hover:scale-125" />
            <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-pink-300">
                      Next Live Call
                    </p>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">1:1 Review</h3>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 p-2 backdrop-blur-md">
                  <Video className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 flex-col justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-400">Date</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-pink-400" />
                    <span className="text-xs font-bold">Sep 24</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-400">Time</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-pink-400" />
                    <span className="text-xs font-bold">10:00 AM</span>
                  </div>
                </div>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 mt-1 text-sm font-bold text-white transition-all hover:bg-white/20">
                Join Zoom <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div >

          {/* Resources */}
          <div className="flex flex-1 flex-col rounded-2xl border border-pink-100/40 bg-white p-5 shadow-sm min-h-0 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-100 bg-pink-50 text-pink-500">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Resources</h3>
              </div>
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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-500 transition-all hover:bg-pink-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {isLoadingResources ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : resources.length === 0 ? (
                <div className="flex justify-center items-center py-8 text-xs text-gray-400">
                  No resources uploaded yet.
                </div>
              ) : (
                resources.map((res) => {
                  const style = getFileIcon(res.content_type || '');
                  return (
                    <div
                      key={res.id}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/80 bg-white/60 p-3 transition-all hover:bg-white hover:shadow-sm"
                      onClick={() => window.open(res.file_url, '_blank')}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.bg} ${style.color} ${style.border}`}
                      >
                        <style.icon className="h-5 w-5" />
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
    </div >
  );
}
