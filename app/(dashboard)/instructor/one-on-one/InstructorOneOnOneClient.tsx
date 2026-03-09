'use client';

import { useState } from 'react';
import { ChatWindow } from '@/components/chat';
import { PageHeader } from '@/components/layout/PageHeader';
import { searchStudents, getOrCreateDirectChat } from '@/lib/actions/chat';
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
} from 'lucide-react';
import type { Profile } from '@/types/database';

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

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="1-on-1"
        highlight="Sessions"
        description="Manage your one-on-one students"
      />

      <div className="grid h-[calc(100vh-160px)] min-h-[700px] grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ── Left: Student list ── */}
        <div className="flex h-full flex-col lg:col-span-3">
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-pink-100/40 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-pink-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Students
                </h3>
              </div>
              <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                {students.length} Active
              </span>
            </div>

            {/* Local search */}
            <div className="relative mb-3">
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
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <Users className="mb-2 h-8 w-8 text-gray-200" />
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

            {/* Global student search */}
            <div className="mt-3 border-t border-pink-100/40 pt-3">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Search all students
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-pink-100/60 bg-white/50 py-2 pl-8 pr-3 text-xs outline-none transition-all focus:ring-2 focus:ring-pink-200"
                />
                {isSearching && (
                  <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-pink-400" />
                )}

                {globalSearchResults.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-48 overflow-y-auto rounded-xl border border-pink-100 bg-white shadow-xl">
                    {globalSearchResults.map((student) => {
                      const hasOneOnOne = student.subscriptions?.some(
                        (s) => s.plan_type === 'one_on_one' && s.status === 'active'
                      );
                      const alreadyExists = students.some((s) => s.id === student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            if (alreadyExists) {
                              const existing = students.find((s) => s.id === student.id);
                              if (existing) {
                                setSelectedStudent(existing);
                                setGlobalSearchQuery('');
                                setGlobalSearchResults([]);
                              }
                            } else {
                              handleStartChatWithStudent(student.id);
                            }
                          }}
                          disabled={isStartingChat || (!hasOneOnOne && !alreadyExists)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {student.avatar_url ? (
                            <img src={student.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-[10px] font-bold text-white">
                              {student.full_name?.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-gray-800">
                              {student.full_name}
                            </p>
                            <p className="truncate text-[10px] text-gray-500">{student.email}</p>
                          </div>
                          {alreadyExists ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-600">
                              Active
                            </span>
                          ) : !hasOneOnOne ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-gray-500">
                              No 1:1
                            </span>
                          ) : (
                            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[9px] font-bold text-pink-600">
                              Chat
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Center: Chat Window (main panel) ── */}
        <div className="flex h-full flex-col lg:col-span-5">
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
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-pink-100/40 bg-white/70 text-gray-400 backdrop-blur-xl">
              <MessageSquare className="mb-3 h-12 w-12 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">Select a student to chat</p>
              <p className="mt-1 text-xs text-gray-400">
                Choose from the list or search for a student
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Actions + Resources ── */}
        <div className="flex h-full flex-col gap-4 lg:col-span-4">
          {/* Student Info Card */}
          {selectedStudent && (
            <div className="rounded-2xl border border-pink-100/40 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3">
                {selectedStudent.avatar_url ? (
                  <img
                    src={selectedStudent.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-lg font-bold text-white shadow-sm">
                    {selectedStudent.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedStudent.full_name}</h3>
                  <p className="text-[10px] text-gray-500">{selectedStudent.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-600">
                    Active • 1-on-1
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Journey Progress */}
          <div className="rounded-2xl border border-pink-100/40 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Journey Path</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {selectedStudent?.full_name || 'Select a student'}
                </p>
              </div>
              <span className="rounded-lg border border-pink-200 bg-pink-100 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-pink-600">
                Week 2
              </span>
            </div>
            {/* Progress bar */}
            <div className="relative px-2">
              <div className="absolute left-0 top-2.5 h-0.5 w-full rounded-full bg-pink-100/80" />
              <div className="absolute left-0 top-2.5 h-0.5 rounded-full bg-pink-500" style={{ width: '57%' }} />
              <div className="relative z-10 flex w-full justify-between">
                {['START', 'WK 1', 'NOW', 'WK 3', 'GOAL'].map((label, i) => {
                  const isNow = label === 'NOW';
                  const isPast = i < 2;
                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      {isNow ? (
                        <div className="-mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-pink-500 bg-white shadow-md">
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
                        </div>
                      ) : isPast ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-pink-500 shadow-sm">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-white bg-gray-100 shadow-sm" />
                      )}
                      <span
                        className={`text-[8px] font-bold ${isNow ? 'text-[9px] font-extrabold text-pink-600' : isPast ? 'text-gray-400' : 'text-gray-300'
                          }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Next session card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-5 text-white shadow-lg transition-all duration-500 hover:-translate-y-1">
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
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-pink-600/80">
                Join Zoom <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Resources */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-pink-100/40 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-100 bg-pink-50 text-pink-500">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Resources</h3>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-500 transition-all hover:bg-pink-100">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {[
                { name: 'Masseter_Release.pdf', date: 'Today', size: '1.2 MB', icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                { name: 'Week_2_Routine.pdf', date: 'Sep 15', size: '2.8 MB', icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                { name: 'Dietary_Focus_V1.docx', date: 'Sep 10', size: '450 KB', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
                { name: 'Morning_Setup.mp4', date: 'Sep 08', size: '15 MB', icon: PlayCircle, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
              ].map((res, i) => (
                <div
                  key={i}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/80 bg-white/60 p-3 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${res.bg} ${res.color} ${res.border}`}
                  >
                    <res.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-bold text-gray-800">{res.name}</h4>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-tight text-gray-400">
                      {res.date} · {res.size}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 transition-colors group-hover:text-pink-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
