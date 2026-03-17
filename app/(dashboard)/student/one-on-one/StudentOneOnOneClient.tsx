'use client';

import { useState, useEffect, useRef } from 'react';
import { OneOnOneChat } from '@/components/chat';
import { PageHeader } from '@/components/layout/PageHeader';
import { getStudentResources } from '@/lib/actions/resources';
import { getUpcomingMeetingsForStudent } from '@/lib/actions/meetings';
import { createClient } from '@/lib/supabase/client';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
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
  PlayCircle
} from 'lucide-react';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

interface Props {
  currentUser: Profile;
  hasSubscription: boolean;
  subscriptionStartDate: string | null;
}

export function StudentOneOnOneClient({ currentUser, hasSubscription, subscriptionStartDate }: Props) {
  // Day elapsed since subscription started (clamped to 1–JOURNEY_MAX_DAY)
  const currentDay = subscriptionStartDate
    ? Math.min(
        JOURNEY_MAX_DAY,
        Math.max(1, Math.floor((Date.now() - new Date(subscriptionStartDate).getTime()) / 86400000) + 1)
      )
    : 1;

  const [sliderValue, setSliderValue] = useState(50);
  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);

  // Journey logic state
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [activeStepDay, setActiveStepDay] = useState<number>(1);
  const [notesInput, setNotesInput] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLog = journeyLogs.find(l => l.day_number === activeStepDay);
  const day1Log = journeyLogs.find(l => l.day_number === 1);

  // Set default view images
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || selectedImageBase64 || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

  // Find the latest uploaded photo if the active day has no photo, so the right side is always the current status 
  // (unless uploading a new one, or viewing a specific old one)
  if (!activeLog?.photo_url && !selectedImageBase64) {
    const logsWithPhotos = [...journeyLogs].filter(l => l.photo_url).sort((a, b) => b.day_number - a.day_number);
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

        // Set active day to latest logged milestone, or day 1
        if (logsData.length > 0) {
          const latestDay = [...logsData].sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0].day_number;
          setActiveStepDay(latestDay);
        }

        setIsLoadingResources(false);
      };
      loadData();

      // Real-time subscription for new resources
      const supabase = createClient();
      const channel = supabase
        .channel(`resources:${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'student_resources',
            filter: `student_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('New resource received:', payload.new);
            setResources((prev) => [payload.new as StudentResource, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [hasSubscription, currentUser]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return { icon: FileText, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' };
    if (contentType.includes('image')) return { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (contentType.includes('video')) return { icon: PlayCircle, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
    return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      // Extract just the base64 data without the data URL prefix
      const base64Data = base64Str.split(',')[1];
      setSelectedImageBase64(base64Data);
      setSelectedImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLog = async () => {
    if (!notesInput.trim() && !selectedImageBase64) {
      alert('Please add some notes or a photo to save.');
      return;
    }

    setIsSavingLog(true);
    const { success, error, data } = await saveDailyCheckIn(
      currentUser.id,
      activeStepDay,
      notesInput.trim() || null,
      selectedImageBase64,
      selectedImageMime || 'image/jpeg'
    );

    if (success && data) {
      setJourneyLogs(prev => {
        const filtered = prev.filter(l => l.day_number !== activeStepDay);
        return [...filtered, data];
      });
      setSelectedImageBase64(null);
      setSelectedImageMime(null);
      alert('Journey log saved successfully!');
    } else {
      alert(error || 'Failed to save log.');
    }
    setIsSavingLog(false);
  };

  // Pre-fill notes when switching days
  useEffect(() => {
    setNotesInput(activeLog?.notes || '');
    setSelectedImageBase64(null); // Clear selected photo on day switch
  }, [activeStepDay, activeLog]);

  const studentMeetings = upcomingMeetings.filter(m => m.meeting_type === 'one_on_one');
  const nextMeeting = studentMeetings.length > 0 ? studentMeetings[0] : null;

  const [isJoinEnabled, setIsJoinEnabled] = useState(false);

  useEffect(() => {
    if (!nextMeeting) return;

    const checkTime = () => {
      const meetingTime = new Date(nextMeeting.start_time).getTime();
      const now = Date.now();
      // 5 minutes = 300000 ms
      setIsJoinEnabled(meetingTime - now <= 300000);
    };

    checkTime();
    const interval = setInterval(checkTime, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [nextMeeting]);

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Your"
        highlight="1-on-1 Hub"
        description="Track progress and connect with your instructor"
      />

      {/* ── Top row: Chat + Side panels ── */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Chat — ALWAYS visible */}
        <OneOnOneChat
          currentUser={currentUser}
          className="h-[480px]"
        />

        {/* Side panels */}
        <div className="flex h-[480px] flex-col gap-4">
          {/* Next session card */}
          {nextMeeting ? (
            <div className="group relative shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-pink-200/30 ring-1 ring-black/5">
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 z-20" />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800" />
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />
              <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />
              <div className="relative z-10 p-5 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-green-400">Upcoming Session</p>
                    </div>
                    <h3 className="text-base font-extrabold tracking-tight text-white">{nextMeeting.topic}</h3>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-2.5 backdrop-blur-md shadow-inner">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                      <Calendar className="h-3.5 w-3.5 text-pink-300" /> {new Date(nextMeeting.start_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                      <Clock className="h-3.5 w-3.5 text-pink-300" /> {new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    disabled={!isJoinEnabled}
                    onClick={() => window.open(nextMeeting.join_url, '_blank')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${isJoinEnabled ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_4px_14px_0_rgba(236,72,153,0.5)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95' : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'}`}>
                    {isJoinEnabled ? <><Video className="h-3.5 w-3.5" /> Join Now</> : 'Starts 5 min before'}
                    {isJoinEnabled && <ExternalLink className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <div className="group relative shrink-0 overflow-hidden rounded-2xl p-5 text-gray-500 bg-white/70 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl flex flex-col items-center justify-center h-[120px]">
                <Video className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium">No upcoming sessions</p>
             </div>
          )}

          {/* Guidelines & Resources */}
          <div className="flex flex-col h-[180px] shrink-0 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Guidelines & Resources</h3>
              <div className="rounded bg-pink-50 p-1 text-pink-500">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {isLoadingResources ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : resources.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
                  No resources available.
                </div>
              ) : (
                resources.map(res => {
                  const style = getFileIcon(res.content_type || '');
                  return (
                    <div key={res.id} className="group flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-white/60 bg-white/50 p-2.5 shadow-sm transition-shadow hover:shadow-md">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.bg} ${style.color} ${style.border} shadow-sm transition-transform group-hover:scale-105`}>
                        <style.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold text-gray-800">{res.file_name}</h4>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="rounded bg-white/60 px-1.5 text-[10px] text-gray-500">{formatFileSize(res.file_size)}</span>
                          <span className="text-[10px] font-bold text-pink-500">{new Date(res.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => window.open(res.file_url, '_blank')}
                          className="rounded-lg border border-gray-100 bg-white p-1.5 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={res.file_url}
                          download={res.file_name}
                          className="rounded-lg border border-pink-100 bg-pink-50 p-1.5 text-pink-600 shadow-sm transition-colors hover:bg-pink-100"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly wisdom */}
          <div className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl">
            <div className="absolute -right-6 -top-6 pointer-events-none h-24 w-24 rounded-full bg-amber-100 opacity-50 blur-2xl" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-500 shadow-sm">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold text-gray-700">Weekly Wisdom</h4>
                <p className="line-clamp-3 text-xs leading-relaxed text-gray-600">
                  Remember to keep your shoulders relaxed during the jaw exercises. Tension in the
                  neck can reduce effectiveness of the facial movements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transformation Journey ── */}
      <div className="w-full rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-pink-100/40 backdrop-blur-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              Transformation Journey
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-600">
                Day {currentDay}
              </span>
            </h3>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              Visual progress tracking & daily feedback
            </p>
          </div>
        </div>

        {/* Journey path */}
        <div className="relative mb-10 w-full">
          <JourneyProgress
            currentDay={currentDay}
            activeDay={activeStepDay}
            onSelectDay={setActiveStepDay}
            completedDays={new Set(journeyLogs.map(l => l.day_number))}
          />
        </div>

        {/* Before / After + Daily check-in */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          {/* Slider */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-md bg-white">
            {activeStepDay < 7 || !afterImage ? (
              <div className="w-full aspect-[4/3] bg-pink-50/30 flex flex-col items-center justify-center overflow-hidden">
                {beforeImage ? (
                  <img src={beforeImage} alt="Day 1 Baseline" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-50 text-pink-300" />
                    <span className="text-xs font-medium text-gray-500">No Day 1 photo uploaded</span>
                  </div>
                )}
              </div>
            ) : (
              <ImageComparison
                beforeImage={beforeImage}
                afterImage={afterImage}
                disabled={false}
                altBefore="Day 1 Baseline"
                altAfter={`Day ${activeStepDay} Progress`}
              />
            )}
          </div>

          {/* Daily check-in */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <h5 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <span className="rounded bg-pink-100 p-1 text-pink-500">
                  <Edit3 className="h-4 w-4" />
                </span>
                Day {currentDay} Check-in
              </h5>
              {activeLog?.updated_at && (
                <span className="text-[10px] text-gray-400">Last saved: {new Date(activeLog.updated_at).toLocaleDateString()}</span>
              )}
            </div>
            <div className="mb-4 flex-1 rounded-xl border border-white/50 bg-white/40 p-1 shadow-inner transition-all focus-within:ring-2 focus-within:ring-pink-100">
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="h-full min-h-[160px] w-full resize-none rounded-lg border-none bg-transparent p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                placeholder="How did your session go today? Record any observations..."
              />
            </div>

            {selectedImageBase64 && (
              <div className="mb-4 text-xs font-semibold text-pink-600 bg-pink-50 p-2 rounded-lg border border-pink-100 flex items-center justify-between">
                <span>Photo selected! Save log to upload.</span>
                <button onClick={() => { setSelectedImageBase64(null); setSelectedImageMime(null); }} className="p-1 hover:bg-pink-100 rounded text-pink-700">✕</button>
              </div>
            )}

            <div className="flex gap-3 relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex w-1/3 items-center justify-center rounded-xl border border-dashed border-pink-300 bg-pink-50/50 px-4 py-2.5 transition-all hover:border-pink-400 hover:bg-pink-50">
                <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-pink-500 shadow-sm transition-transform group-hover:scale-110">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-gray-600">Add Photo</span>
              </button>
              <button
                onClick={handleSaveLog}
                disabled={isSavingLog}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-xs font-bold tracking-wide text-white shadow-md shadow-pink-200/30 transition-all hover:shadow-lg disabled:opacity-50">
                {isSavingLog ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {isSavingLog ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
