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
} from 'lucide-react';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';

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
      // Use the student's assigned instructor so master instructor joins the
      // existing shared conversation rather than creating a separate one.
      const fromList = students.find((s) => s.id === studentId);
      const assignedInstructorId = fromList?.assignedInstructorId || null;
      const { conversationId } = await getOrCreateSharedChat(studentId, assignedInstructorId);
      // Check if it's from the search results or the existing student list
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

        // Fetch upcoming meetings
        try {
          const meetingsData = await getInstructorUpcomingMeetings();
          setUpcomingMeetings(meetingsData || []);
        } catch (e) {
          console.error("Failed to load meetings", e);
        }
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

    const MAX_SIZE_MB = 5;
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule meeting');
      }

      const updatedList = await getInstructorUpcomingMeetings();
      setUpcomingMeetings(updatedList || []);

      setShowScheduleModal(false);
      setMeetingTopic('');
      setMeetingDate('');
      setMeetingTime('');
      setMeetingDuration('30');
    } catch (e: any) {
      console.error(e);
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
                    <div className="relative">
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
                      {student.isTrial && (
                        <span className="absolute -top-1 -right-1 rounded-full bg-amber-400 px-1 text-[7px] font-bold text-white">T</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-gray-800">
                          {student.full_name}
                        </p>
                        {student.isTrial ? (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-600">TRIAL</span>
                        ) : (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
                        )}
                      </div>
                      <p className="truncate text-[10px] text-gray-400">{student.email}</p>
                      {student.daysLeft !== null && student.daysLeft !== undefined && (
                        <p className={`text-[9px] font-bold mt-0.5 ${(student.daysLeft ?? 0) <= 3 ? 'text-red-500' : 'text-pink-400'}`}>
                          {student.daysLeft}d left
                        </p>
                      )}
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
              {selectedStudent && selectedStudent.conversationId ? (
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
                  isMultiParty={true}
                />
              ) : selectedStudent && !selectedStudent.conversationId ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-200" />
                  <p className="text-sm font-bold text-gray-600">No conversation yet</p>
                  <p className="text-xs text-gray-400">Start a conversation with {selectedStudent.full_name}</p>
                  <button
                    onClick={() => handleStartChatWithStudent(selectedStudent.id)}
                    disabled={isStartingChat}
                    className="flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-pink-600 transition-all disabled:opacity-60"
                  >
                    {isStartingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    Start Chat
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

        {/* ── Middle: Transformation Journey ── */}
        <div className="flex flex-col lg:col-span-5 min-h-0">
          <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-pink-100/40 bg-white p-5 shadow-sm min-h-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
                  Journey Path
                </h3>
                <p className="mt-0.5 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  {selectedStudent
                    ? (() => {
                        const d = selectedStudent.startDate
                          ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                          : 1;
                        return `DAY ${d} ANALYSIS`;
                      })()
                    : 'No student selected'}
                </p>
              </div>
              <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-pink-600">
                {selectedStudent?.startDate
                  ? (() => {
                      const d = Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1));
                      return `Week ${Math.ceil(d / 7)}`;
                    })()
                  : 'Week 1'}
              </span>
            </div>

            {selectedStudent ? (
              <div className="flex flex-1 flex-col overflow-hidden min-h-0 gap-3">
                {/* Journey path */}
                <div className="w-full shrink-0">
                  <JourneyProgress
                    currentDay={selectedStudent.startDate
                      ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedStudent.startDate).getTime()) / 86400000) + 1))
                      : 1}
                    activeDay={activeStepDay}
                    onSelectDay={setActiveStepDay}
                    completedDays={new Set(journeyLogs.map(l => l.day_number))}
                  />
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
        </div>

        {/* ── Right: Actions + Resources ── */}
        <div className="flex flex-col lg:col-span-4 gap-5 min-h-0">
          {/* Schedule a New Meeting */}
          <button
            disabled={!selectedStudent}
            onClick={() => setShowScheduleModal(true)}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ec4899] py-4 text-[13px] font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed">
            <Calendar className="h-5 w-5" />
            Schedule a New Meeting
          </button>

          {/* Next session card */}
          {nextMeeting ? (
            <div className="group shrink-0 relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-4 text-white shadow-lg transition-all duration-500 hover:-translate-y-1">
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
                    <h3 className="text-lg font-bold tracking-tight">{nextMeeting.topic}</h3>
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
                      <span className="text-xs font-bold">{new Date(nextMeeting.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                    <span className="text-[9px] font-bold uppercase text-gray-400">Time</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-pink-400" />
                      <span className="text-xs font-bold">
                        {new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  disabled={!isJoinEnabled}
                  onClick={() => window.open(nextMeeting.start_url, '_blank')}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 mt-1 text-sm font-bold transition-all shadow-lg ${isJoinEnabled ? 'border-white/20 bg-pink-600/80 text-white hover:bg-pink-600 hover:shadow-pink-500/20' : 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'}`}>
                  {isJoinEnabled ? 'Start Zoom' : 'Starts 5 min before'} <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="group shrink-0 relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <div className="relative z-10 flex flex-col items-center justify-center py-6 text-gray-400">
                <Video className="h-8 w-8 mb-2 text-gray-300" />
                <p className="text-xs font-medium">No upcoming meetings</p>
              </div>
            </div>
          )}

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

      {/* SCHEDULE MEETING MODAL */}
      {showScheduleModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-lg rounded-3xl bg-white/90 shadow-2xl overflow-hidden border border-white/40 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-300 backdrop-blur-xl">

            {/* Modal Header */}
            <div className="relative flex flex-col p-6 bg-gradient-to-br from-pink-50 via-white to-pink-50/30 border-b border-pink-100/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500"></div>
              <div className="flex items-start justify-between">
                <div className="flex gap-4 items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 shadow-inner">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Schedule Session</h3>
                    <p className="text-sm font-medium text-pink-600/80 mt-0.5 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> 1-on-1 with {selectedStudent?.full_name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-700 transition-all bg-white border border-gray-100 shadow-sm">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-white/50">
              <div className="group">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-pink-500 transition-colors">Meeting Topic</label>
                <input value={meetingTopic} onChange={(e) => setMeetingTopic(e.target.value)} type="text" className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 shadow-sm focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none transition-all" placeholder="e.g. Weekly Catchup & Posture Review" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-pink-500 transition-colors">Date</label>
                  <input value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} type="date" className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-900 shadow-sm focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none transition-all" />
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-pink-500 transition-colors">Time</label>
                  <input value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} type="time" className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-900 shadow-sm focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none transition-all" />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-pink-500 transition-colors">Duration</label>
                <div className="relative">
                  <select value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-900 shadow-sm focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none transition-all">
                    <option value="15">15 Minutes - Quick Sync</option>
                    <option value="30">30 Minutes - Standard</option>
                    <option value="45">45 Minutes - Deep Dive</option>
                    <option value="60">1 Hour - Full Session</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end items-center bg-gray-50/80 p-6 border-t border-gray-100">
              <button onClick={() => setShowScheduleModal(false)} className="px-5 py-2.5 font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all text-sm">Cancel</button>
              <button onClick={handleScheduleMeeting} disabled={isScheduling} className="relative flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(236,72,153,0.39)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.23)] hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed text-sm active:scale-95">
                {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                Generate Zoom Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
