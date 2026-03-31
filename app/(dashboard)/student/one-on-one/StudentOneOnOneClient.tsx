'use client';

import { useState, useEffect, useRef } from 'react';
import { OneOnOneChat } from '@/components/chat';
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
  PlayCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, StudentResource, MeetingWithDetails } from '@/types/database';

interface Props {
  currentUser: Profile;
  hasSubscription: boolean;
  subscriptionStartDate: string | null;
}

export function StudentOneOnOneClient({ currentUser, hasSubscription, subscriptionStartDate }: Props) {
  // Day elapsed since subscription started
  const currentDay = subscriptionStartDate
    ? Math.min(
        JOURNEY_MAX_DAY,
        Math.max(1, Math.floor((Date.now() - new Date(subscriptionStartDate).getTime()) / 86400000) + 1)
      )
    : 1;

  const [resources, setResources] = useState<StudentResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);

  // Journey logic state
  const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
  const [notesInput, setNotesInput] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLog = journeyLogs.find(l => l.day_number === currentDay);
  const day1Log = journeyLogs.find(l => l.day_number === 1);

  // Set default view images
  const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
  let afterImage = activeLog?.photo_url || selectedImageBase64 || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return { icon: FileText, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' };
    if (contentType.includes('image')) return { icon: ImageIcon, color: 'text-brand-rose', bg: 'bg-brand-rose/5', border: 'border-brand-rose/10' };
    if (contentType.includes('video')) return { icon: PlayCircle, color: 'text-brand-emerald', bg: 'bg-brand-emerald/5', border: 'border-brand-emerald/10' };
    return { icon: FileText, color: 'text-foreground/40', bg: 'bg-foreground/5', border: 'border-outline-variant/10' };
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
      const base64Data = base64Str.split(',')[1];
      setSelectedImageBase64(base64Data);
      setSelectedImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLog = async () => {
    if (!notesInput.trim() && !selectedImageBase64) {
      alert('Please add some reflections or a photo to preserve this moment.');
      return;
    }
    setIsSavingLog(true);
    const { success, error, data } = await saveDailyCheckIn(
      currentUser.id,
      currentDay,
      notesInput.trim() || null,
      selectedImageBase64,
      selectedImageMime || 'image/jpeg'
    );
    if (success && data) {
      setJourneyLogs(prev => {
        const filtered = prev.filter(l => l.day_number !== currentDay);
        return [...filtered, data];
      });
      setSelectedImageBase64(null);
      setSelectedImageMime(null);
      alert('Reflection preserved successfully.');
    } else {
      alert(error || 'Failed to save reflection.');
    }
    setIsSavingLog(false);
  };

  useEffect(() => {
    setNotesInput(activeLog?.notes || '');
    setSelectedImageBase64(null);
  }, [currentDay, activeLog]);

  const PHOTO_UPLOAD_DAYS = [1, 7, 14, 21, 25];
  const isPhotoDay = PHOTO_UPLOAD_DAYS.includes(currentDay);
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
    <div className="p-6 lg:p-10 space-y-12 pb-24 lg:pb-12 h-full overflow-y-auto relative animate-in fade-in duration-1000 bg-[#FFFAF7]/40 font-sans text-[#374151]">
      
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black tracking-[0.2em] uppercase">
            <User className="w-3.5 h-3.5" />
            1-on-1 Elite Experience
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-[#1a1a1a] tracking-tight leading-none">
            Your Dedicated Path
          </h1>
          <p className="text-sm font-medium text-[#6B7280] italic max-w-xl">
            A bespoke transformation journey guided by ancient flow and structural renewal.
          </p>
        </div>
      </header>

      {/* ── Main Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
        
        {/* ── Left Column: Primary Content ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10 relative z-10">
          
          {/* Top Row: Next Meeting & Elite Wisdom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Next session card */}
            {nextMeeting ? (
              <div className="group relative overflow-hidden rounded-[2.5rem] p-8 border border-[#FF8A75]/10 bg-white transition-all duration-700 hover:border-[#FF8A75]/20 flex flex-col justify-between h-full">
                  <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                      <div className="flex items-start justify-between">
                           <div className="space-y-3">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8A75]/5 text-[#FF8A75] rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-[#FF8A75]/10">
                                  <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                                  Live Ritual Soon
                              </div>
                              <h3 className="text-3xl font-serif italic font-bold text-[#1a1a1a] tracking-tight leading-none">{nextMeeting.topic}</h3>
                           </div>
                      </div>

                      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pt-6 border-t border-[#FF8A75]/10">
                          <div className="flex items-center gap-8">
                               <div className="space-y-1.5">
                                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#6B7280] leading-none">Date</p>
                                  <p className="text-sm font-bold text-[#1a1a1a] tracking-tight">{new Date(nextMeeting.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                               </div>
                               <div className="w-px h-8 bg-[#FF8A75]/10" />
                               <div className="space-y-1.5">
                                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#6B7280] leading-none">Time</p>
                                  <p className="text-sm font-bold text-[#1a1a1a] tracking-tight">{new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               </div>
                          </div>

                          <button
                              disabled={!isJoinEnabled}
                              onClick={() => window.open(nextMeeting.join_url, '_blank')}
                              className={cn(
                                  "flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 w-full xl:w-auto",
                                  isJoinEnabled 
                                      ? "bg-[#FF8A75] text-white hover:bg-[#ff4081] active:scale-95" 
                                      : "bg-[#FFFAF7]/60 text-[#6B7280] border border-[#FF8A75]/10 cursor-not-allowed"
                              )}
                          >
                              {isJoinEnabled ? "Enter Portal" : "Locked"}
                              <ArrowUpRight className="h-4 w-4 shrink-0" />
                          </button>
                      </div>
                  </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center gap-5 p-12 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 text-[#6B7280] h-full min-h-[220px]">
                  <div className="h-14 w-14 rounded-full bg-[#FFFAF7]/60 border border-[#FF8A75]/10 flex items-center justify-center">
                      <Video className="w-6 h-6 text-[#FF8A75]/40" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">No live rituals scheduled</p>
               </div>
            )}

            {/* Weekly wisdom / Tip */}
            <div className="p-8 rounded-[2.5rem] bg-[#FFFAF7]/60 border border-[#FF8A75]/10 relative overflow-hidden group flex flex-col justify-center h-full min-h-[220px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A75]/10 rounded-full blur-[40px] -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 flex flex-col gap-6 items-start">
                <div className="h-12 w-12 rounded-full bg-white border border-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75] group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Elite Wisdom</h4>
                  <p className="text-sm font-medium leading-relaxed text-[#6B7280] italic">
                    &quot;Your face is the mirror of your history. Honor each movement as a prayer to your own vitality.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Transformation Journey ── */}
          <div className="w-full rounded-[3rem] p-8 lg:p-12 space-y-12 bg-white border border-[#FF8A75]/10 relative overflow-hidden group/trans">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FF8A75]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none transition-transform duration-1000 group-hover/trans:scale-125" />
            
            <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-8 relative z-10">
              <div className="space-y-5">
                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#FFFAF7]/60 rounded-full border border-[#FF8A75]/10 text-[#FF8A75] text-[9px] font-black uppercase tracking-[0.3em]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Evolution Log
                 </div>
                 <h3 className="text-4xl lg:text-5xl font-serif italic font-bold text-[#1a1a1a] tracking-tight leading-none transition-colors duration-500">Transcendence</h3>
                 <p className="text-sm font-medium text-[#6B7280] italic max-w-md leading-relaxed">
                    A profound mirror of your structural metamorphosis over {JOURNEY_MAX_DAY} sacred days.
                 </p>
              </div>
              <div className="flex gap-4 self-start 2xl:self-end">
                 <div className="px-8 py-5 bg-[#FFFAF7]/60 rounded-[2rem] border border-[#FF8A75]/10 flex flex-col items-center justify-center min-w-[130px] hover:scale-105 transition-transform duration-300">
                    <span className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.3em] mb-2">Current Node</span>
                    <span className="text-3xl font-serif italic font-bold text-[#1a1a1a] tracking-tight">Day {currentDay}</span>
                 </div>
                 <div className="px-8 py-5 bg-white border border-[#FF8A75]/20 rounded-[2rem] flex flex-col items-center justify-center min-w-[130px] hover:scale-105 transition-transform duration-300">
                    <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-[0.3em] mb-2">Culmination</span>
                    <span className="text-3xl font-serif italic text-[#1a1a1a] tracking-tight">{JOURNEY_MAX_DAY} Days</span>
                 </div>
              </div>
            </div>

            {/* Journey path selector */}
            <div className="relative z-10 p-4 bg-[#FFFAF7]/40 rounded-[3rem] border border-[#FF8A75]/10 overflow-x-auto custom-scrollbar">
              <JourneyProgress
                currentDay={currentDay}
                activeDay={currentDay}
                completedDays={new Set(journeyLogs.map(l => l.day_number))}
              />
            </div>

            {/* Visual Mirror + Daily Reflections */}
            <div className="grid grid-cols-1 items-stretch gap-12 relative z-10">
              
              {/* Comparison Mirror */}
              <div className="flex flex-col h-full space-y-6">
                  <div className="flex items-center justify-between px-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6B7280] italic">Ancestral vs Ascendant</h4>
                     <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF8A75]/20 to-transparent mx-6" />
                     <span className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.3em] bg-white border border-[#FF8A75]/10 px-5 py-2 rounded-full">Day 1 / Day {currentDay}</span>
                  </div>
                  
                  <div className="rounded-[3rem] overflow-hidden border border-[#FF8A75]/10 bg-white h-[450px] lg:h-[550px] relative group w-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />
                    {currentDay < 1 && !afterImage ? (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-[#FFFAF7]/40">
                        <div className="h-24 w-24 rounded-full bg-white border border-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]/40">
                            <ImageIcon className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.3em] leading-relaxed">The Mirror is Empty<br />Awaiting your origin.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full w-full">
                        <ImageComparison
                            beforeImage={beforeImage}
                            afterImage={afterImage}
                            disabled={!isSliderActive}
                            altBefore="Ancestral Baseline"
                            altAfter={`Unfolding Day ${currentDay}`}
                        />
                      </div>
                    )}
                    {isSliderActive && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 text-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.4em] bg-white/90 backdrop-blur-md px-8 py-3 rounded-full border border-[#FF8A75]/20 shadow-lg">
                         Drag to witness
                      </div>
                    )}
                  </div>
              </div>

              {/* Daily reflections */}
              <div className="flex flex-col h-full space-y-8 pt-10 border-t border-[#FF8A75]/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] flex items-center justify-center hover:scale-110 transition-transform duration-500 shrink-0">
                        <Edit3 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-2xl font-serif italic font-bold text-[#1a1a1a] tracking-tight leading-none">Inner Monologue</h5>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Node {currentDay}</p>
                    </div>
                  </div>
                  {activeLog?.updated_at && (
                    <div className="px-5 py-2 bg-white text-[#FF8A75] rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm self-start sm:self-auto border border-[#FF8A75]/10">
                        Inscribed {new Date(activeLog.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                     </div>
                  )}
                </div>

                <div className="min-h-[220px] rounded-[3rem] bg-[#FFFAF7]/40 p-8 sm:p-12 focus-within:ring-2 focus-within:ring-[#FF8A75]/20 transition-all duration-700 border border-[#FF8A75]/10">
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full h-full resize-none bg-transparent text-[#374151] placeholder:text-[#6B7280]/50 text-lg font-medium leading-relaxed outline-none custom-scrollbar italic"
                    placeholder="Document the subtle energetic shifts. How does your structure feel today?"
                  />
                </div>

                {selectedImageBase64 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between p-5 px-8 rounded-full bg-white border border-[#FF8A75]/20 text-[#1a1a1a]">
                        <div className="flex items-center gap-5">
                            <div className="h-10 w-10 rounded-full bg-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Snapshot Captured</p>
                        </div>
                        <button onClick={() => { setSelectedImageBase64(null); setSelectedImageMime(null); }} className="h-10 w-10 flex items-center justify-center hover:bg-[#FF8A75]/5 rounded-full transition-colors font-black text-sm">
                            ✕
                        </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                  />
                  {isPhotoDay && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex flex-col items-center justify-center gap-5 p-8 sm:p-10 rounded-[2.5rem] bg-white hover:bg-[#FFFAF7]/60 border border-[#FF8A75]/10 transition-all duration-500">
                      <div className="h-16 w-16 flex items-center justify-center rounded-full bg-[#FF8A75]/10 text-[#FF8A75] group-hover:scale-110 group-hover:bg-[#FF8A75] group-hover:text-white transition-all duration-500">
                        <Camera className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Imprint Photo</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleSaveLog}
                    disabled={isSavingLog}
                    className={cn(
                      "relative group overflow-hidden flex flex-col items-center justify-center gap-5 p-8 sm:p-10 rounded-[2.5rem] bg-[#FF8A75] text-white hover:bg-[#ff4081] transition-all duration-500 disabled:opacity-50 disabled:hover:scale-100",
                      !isPhotoDay && "col-span-2"
                    )}>
                    <div className="relative z-10 h-16 w-16 flex items-center justify-center rounded-full bg-white/20 transition-transform duration-500">
                       {isSavingLog ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle className="h-6 w-6" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                        {isSavingLog ? 'Inscribing...' : 'Seal the Record'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Stacked Chat & Guidelines ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8 sticky top-10 h-max z-20">
           
           {/* Chat Panel */}
           <div className="h-[550px] shrink-0 bg-white rounded-[2.5rem] border border-[#FF8A75]/10 flex flex-col overflow-hidden transition-all duration-700 hover:border-[#FF8A75]/20 group/chat">
             <div className="px-8 py-5 border-b border-[#FF8A75]/10 bg-[#FFFAF7]/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]">
                      <User className="w-4 h-4" />
                   </div>
                   <div>
                       <h3 className="text-sm font-bold text-[#1a1a1a] font-serif leading-tight">Elite Support</h3>
                       <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Direct Line</p>
                   </div>
                </div>
                <div className="flex gap-2 items-center px-4 py-1.5 bg-white rounded-full border border-[#FF8A75]/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                    <span className="text-[8px] font-black tracking-[0.2em] text-[#FF8A75] uppercase">Active</span>
                </div>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col bg-white">
                 <OneOnOneChat
                    currentUser={currentUser}
                    hideHeader={true}
                    className="flex-1 h-full w-full border-0 bg-transparent rounded-none"
                 />
             </div>
           </div>

           {/* Guidelines Panel */}
           <div className="flex flex-col rounded-[2.5rem] p-8 border border-[#FF8A75]/10 bg-white relative overflow-hidden group max-h-[500px]">
             <div className="flex items-center justify-between mb-8 relative z-10 shrink-0">
               <div className="space-y-1">
                 <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Sacred Texts</h3>
                 <p className="text-2xl font-serif italic font-bold text-[#1a1a1a] tracking-tight">Guidelines</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-[#FFFAF7] border border-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]">
                 <BookOpen className="h-4 w-4" />
               </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-4">
               {isLoadingResources ? (
                 <div className="flex h-32 items-center justify-center">
                   <Loader2 className="h-6 w-6 animate-spin text-[#FF8A75]/50" />
                 </div>
               ) : resources.length === 0 ? (
                 <div className="flex h-32 items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7280] italic">
                   The archive is empty.
                 </div>
               ) : (
                 resources.map(res => {
                   const style = getFileIcon(res.content_type || '');
                   return (
                     <div key={res.id} className="group/item flex items-center gap-4 p-4 rounded-3xl bg-[#FFFAF7]/60 border border-[#FF8A75]/10 hover:bg-white hover:border-[#FF8A75]/20 transition-all duration-300">
                       <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75] transition-transform group-hover/item:scale-110 group-hover/item:rotate-3">
                         <style.icon className="h-4 w-4" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <h4 className="truncate text-sm font-bold text-[#1a1a1a]">{res.file_name}</h4>
                         <div className="mt-1 flex items-center gap-3">
                           <span className="text-[8px] font-black text-[#6B7280] uppercase tracking-[0.2em]">{formatFileSize(res.file_size)}</span>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button
                           onClick={() => window.open(res.file_url, '_blank')}
                           className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-[#FF8A75]/10 text-[#FF8A75] hover:bg-[#FF8A75] hover:text-white transition-colors"
                         >
                           <Eye className="h-3.5 w-3.5" />
                         </button>
                         <a
                           href={res.file_url}
                           download={res.file_name}
                           className="h-8 w-8 flex items-center justify-center rounded-full bg-[#FF8A75] text-white hover:bg-[#ff4081] transition-transform"
                         >
                           <Download className="h-3.5 w-3.5" />
                         </a>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>

        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 138, 117, 0.2); border-radius: 10px; }
      `}</style>
    </div>

  );
}

