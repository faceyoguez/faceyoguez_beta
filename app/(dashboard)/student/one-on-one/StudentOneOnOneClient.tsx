'use client';

import { useState, useEffect, useRef } from 'react';
import { OneOnOneChat } from '@/components/chat';
import { getStudentResources } from '@/lib/actions/resources';
import { getUpcomingMeetingsForStudent } from '@/lib/actions/meetings';
import { createClient } from '@/lib/supabase/client';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY, JOURNEY_MILESTONES } from '@/components/ui/journey-progress';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  FileText,
  Eye,
  Download,
  Lightbulb,
  Edit3,
  Camera,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  PlayCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfDay } from 'date-fns';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

interface Props {
  currentUser: Profile;
  hasSubscription: boolean;
  subscriptionStartDate: string | null;
  isTrial?: boolean;
}

export function StudentOneOnOneClient({ currentUser, hasSubscription, subscriptionStartDate, isTrial = false }: Props) {
  const currentDay = subscriptionStartDate
    ? Math.min(
      JOURNEY_MAX_DAY,
      Math.max(1, differenceInDays(startOfDay(new Date()), startOfDay(new Date(subscriptionStartDate))) + 1)
    )
    : 1;

  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [activeDay, setActiveDay] = useState(currentDay);
  const [notesInput, setNotesInput] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveDay(currentDay);
  }, [currentDay]);

  const activeLog = journeyLogs.find(l => l.day_number === activeDay);
  const day1Log = journeyLogs.find(l => l.day_number === 1);
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || selectedImageBase64 || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

  if (!activeLog?.photo_url && !selectedImageBase64) {
    const logsWithPhotos = [...journeyLogs]
      .filter(l => l.photo_url)
      .sort((a, b) => b.day_number - a.day_number);
    if (logsWithPhotos.length > 0) {
      afterImage = logsWithPhotos[0].photo_url as string;
    }
  }

  useEffect(() => {
    if (hasSubscription && currentUser) {
      const loadData = async () => {
        setIsLoadingResources(true);
        const [resData, logsData, meetingsData] = await Promise.all([
          getStudentResources(currentUser.id),
          getJourneyLogs(currentUser.id),
          getUpcomingMeetingsForStudent()
        ]);
        setResources(resData);
        setJourneyLogs(logsData);
        setUpcomingMeetings(meetingsData || []);
        setIsLoadingResources(false);
      };
      loadData();

      const supabase = createClient();
      const channel = supabase
        .channel(`resources:${currentUser.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'student_resources', filter: `student_id=eq.${currentUser.id}` },
          (payload) => setResources((prev) => [payload.new as StudentResource, ...prev])
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [hasSubscription, currentUser]);

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return { icon: FileText };
    if (contentType.includes('image')) return { icon: ImageIcon };
    if (contentType.includes('video')) return { icon: PlayCircle };
    return { icon: FileText };
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setSelectedImageBase64(base64Str.split(',')[1]);
      setSelectedImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLog = async () => {
    setIsSavingLog(true);
    const { success, data } = await saveDailyCheckIn(
      currentUser.id,
      activeDay,
      notesInput.trim() || null,
      selectedImageBase64,
      selectedImageMime || 'image/jpeg'
    );
    if (success && data) {
      setJourneyLogs(prev => [...prev.filter(l => l.day_number !== activeDay), data]);
      setSelectedImageBase64(null);
    }
    setIsSavingLog(false);
  };

  useEffect(() => {
    setNotesInput(activeLog?.notes || '');
    setSelectedImageBase64(null);
  }, [activeDay, activeLog]);

  const isPhotoDay = JOURNEY_MILESTONES.includes(activeDay) && !activeLog?.photo_url;
  const isSliderActive = currentDay >= 7;
  const studentMeetings = upcomingMeetings.filter(m => m.meeting_type === 'one_on_one');
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
    <div className="flex flex-col h-screen overflow-hidden bg-[#FFFAF7] selection:bg-[#FF8A75]/20 font-sans text-[#1a1a1a] relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_70%)] blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_60%)] blur-3xl opacity-40" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 flex-1 flex flex-col min-h-0 gap-8">
        <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#FF8A75]/10 mt-4">
          <div className="space-y-6 flex-1">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/10 text-[#FF8A75] text-[9px] font-black tracking-[0.3em] uppercase shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] shadow-[0_0_8px_#FF8A75]" />
              Personal 1-on-1 Classes
              <span className="mx-2 opacity-20">|</span>
              Month {Math.ceil(currentDay / 30)}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1a1a1a] tracking-tight leading-[1.1]">
                Your Dedicated Path
              </h1>
              <p className="text-sm font-medium text-[#6B7280]/80 max-w-xl leading-relaxed">
                Your personal face yoga journey, guided by an expert instructor.
              </p>
            </div>
          </div>
          {isTrial && (
            <div className="inline-flex px-6 py-3 bg-slate-900 rounded-2xl items-center justify-center shadow-2xl gap-4 shrink-0">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] leading-none">Status</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[10px] font-black uppercase text-[#FF8A75] tracking-widest leading-none">Trial Access Active</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8 relative z-10 overflow-y-auto custom-scrollbar pr-4">
            <div className="w-full shrink-0">
              {nextMeeting ? (
                <div className="group relative overflow-hidden rounded-[3.5rem] p-8 lg:p-10 border border-[#FF8A75]/10 bg-white/60 backdrop-blur-3xl transition-all duration-700 hover:border-[#FF8A75]/20 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xl shadow-[#FF8A75]/5">
                  <div className="space-y-6 flex-1 min-w-0">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 text-[#FF8A75] rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-[#FF8A75]/5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse shadow-[0_0_8px_#FF8A75]" />
                      Upcoming Session
                    </div>
                    <h3 className="text-4xl lg:text-5xl font-serif text-[#1a1a1a] tracking-tight leading-tight truncate">{nextMeeting.topic}</h3>
                    <div className="flex items-center gap-8 pt-6 border-t border-[#FF8A75]/10">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-black tracking-[0.3em] text-[#6B7280]/40 leading-none">Session Date</p>
                        <p className="text-sm font-bold text-[#1a1a1a] tracking-tight">{new Date(nextMeeting.start_time).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-black tracking-[0.3em] text-[#6B7280]/40 leading-none">Moment</p>
                        <p className="text-sm font-bold text-[#1a1a1a] tracking-tight">{new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      disabled={!isJoinEnabled}
                      onClick={() => window.open(nextMeeting.join_url, '_blank')}
                      className={cn(
                        "flex items-center justify-center gap-4 px-10 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 w-full shadow-lg",
                        isJoinEnabled
                          ? "bg-slate-900 text-white hover:bg-[#FF8A75] hover:scale-[1.02] active:scale-95"
                          : "bg-white/40 text-slate-300 border border-slate-200 cursor-not-allowed"
                      )}
                    >
                      {isJoinEnabled ? "Join Session" : "Session Not Started Yet"}
                      <ArrowUpRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 p-10 rounded-[3.5rem] bg-white/40 backdrop-blur-3xl border border-[#FF8A75]/5 text-[#6B7280] w-full min-h-[200px] shadow-sm">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#FF8A75]/10 flex items-center justify-center shadow-sm">
                    <Video className="w-5 h-5 text-[#FF8A75]/30" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/40 text-center">No Sessions Scheduled</p>
                </div>
              )}
            </div>

            <div className="w-full rounded-[3.5rem] p-8 lg:p-14 space-y-12 bg-white/60 backdrop-blur-3xl border border-[#FF8A75]/10 relative overflow-hidden shadow-xl shadow-[#FF8A75]/5 shrink-0">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.06)_0%,transparent_70%)] blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-8 relative z-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#FFFAF7] rounded-full border border-[#FF8A75]/10 text-[#FF8A75] text-[9px] font-black uppercase tracking-[0.4em] shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Progress Tracker
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-serif text-[#1a1a1a] tracking-tight leading-none">Your Progress</h3>
                </div>
                <div className="flex gap-4">
                  <div className="px-8 h-20 bg-slate-900 rounded-3xl flex flex-col items-center justify-center shadow-xl">
                    <span className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.4em] mb-1">Current</span>
                    <span className="text-xl font-bold text-white tracking-tight">Day {currentDay}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 py-12 px-8 bg-slate-50/50 backdrop-blur-3xl rounded-[2rem] border border-slate-100 overflow-x-auto no-scrollbar shadow-inner">
                <JourneyProgress
                  currentDay={currentDay}
                  activeDay={activeDay}
                  onSelectDay={setActiveDay}
                  completedDays={new Set(journeyLogs.map(l => l.day_number))}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 items-stretch gap-10 relative z-10">
                <div className="flex flex-col">
                  <div className="rounded-[3rem] overflow-hidden border border-[#FF8A75]/5 bg-black h-[400px] lg:h-[500px] relative shadow-2xl flex-1">
                    <ImageComparison
                      beforeImage={beforeImage}
                      afterImage={afterImage}
                      disabled={!isSliderActive}
                    />
                  </div>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-[#FF8A75] shadow-xl">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-3xl font-serif text-[#1a1a1a] tracking-tight">Your Notes</h5>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Day {activeDay}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 rounded-[2rem] bg-white/40 p-8 border border-slate-200/50 min-h-[220px] shadow-inner">
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full h-full resize-none bg-transparent text-slate-700 text-lg font-medium outline-none border-none focus:ring-0 custom-scrollbar font-sans"
                      placeholder="How are you feeling today? Note any changes you noticed."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 shrink-0 mt-auto">
                    <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />
                    {isPhotoDay && (
                      <button onClick={() => fileInputRef.current?.click()} className="h-16 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:border-[#FF8A75]/20 hover:text-[#FF8A75] transition-all">
                        <Camera className="w-4 h-4" /> Take Photo
                      </button>
                    )}
                    <button onClick={handleSaveLog} disabled={isSavingLog} className={cn("h-16 rounded-2xl bg-slate-900 text-white shadow-lg flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-colors duration-300", !isPhotoDay && "col-span-2")}>
                      {isSavingLog ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 relative z-10 h-full min-h-0">
            <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-[#FF8A75]/10 flex flex-col overflow-hidden shadow-xl shadow-[#FF8A75]/5">
              <div className="px-8 py-6 border-b border-[#FF8A75]/5 bg-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 bg-[#FF8A75] rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Chat with Your Instructor</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <OneOnOneChat currentUser={currentUser} hideHeader={true} className="h-full w-full border-0 absolute inset-0" />
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-[#FF8A75]/10 bg-white shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75] mb-4">Resources</h3>
              <div className="space-y-3">
                {resources.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FFFAF7]/60 border border-[#FF8A75]/10">
                    <span className="text-xs font-bold truncate pr-4">{res.file_name}</span>
                    <button onClick={() => window.open(res.file_url, '_blank')} className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-[#FF8A75] hover:bg-[#FF8A75] hover:text-white transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
