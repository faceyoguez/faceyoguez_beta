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

        if (logsData.length > 0) {
          const latestDay = [...logsData].sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0].day_number;
          setActiveStepDay(latestDay);
        }

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
      alert('Reflection preserved successfully.');
    } else {
      alert(error || 'Failed to save reflection.');
    }
    setIsSavingLog(false);
  };

  useEffect(() => {
    setNotesInput(activeLog?.notes || '');
    setSelectedImageBase64(null);
  }, [activeStepDay, activeLog]);

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
    <div className="p-6 lg:p-10 space-y-12 pb-24 lg:pb-12 h-full overflow-y-auto relative animate-in fade-in duration-1000">
      
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm">
            <User className="w-3.5 h-3.5" />
            1-on-1 Elite Experience
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-black text-foreground tracking-tight leading-none">
            Your Dedicated Path
          </h1>
          <p className="text-lg text-foreground/50 italic font-medium max-w-xl">
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
              <div className="group relative overflow-hidden rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/10 bg-black text-white transition-all duration-700 hover:scale-[1.02] flex flex-col justify-between">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] -translate-y-12 translate-x-12 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                  <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                      <div className="flex items-start justify-between">
                           <div className="space-y-3">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white rounded-full text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-md border border-white/10">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  Live Ritual Soon
                              </div>
                              <h3 className="text-3xl font-serif font-black text-white tracking-tight leading-none">{nextMeeting.topic}</h3>
                           </div>
                      </div>

                      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pt-6 border-t border-white/10">
                          <div className="flex items-center gap-6">
                               <div className="space-y-1">
                                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 leading-none">Date</p>
                                  <p className="text-base font-bold text-white tracking-tight">{new Date(nextMeeting.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                               </div>
                               <div className="w-px h-8 bg-white/10" />
                               <div className="space-y-1">
                                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 leading-none">Time</p>
                                  <p className="text-base font-bold text-white tracking-tight">{new Date(nextMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               </div>
                          </div>

                          <button
                              disabled={!isJoinEnabled}
                              onClick={() => window.open(nextMeeting.join_url, '_blank')}
                              className={cn(
                                  "flex items-center justify-center gap-3 px-6 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl w-full xl:w-auto",
                                  isJoinEnabled 
                                      ? "bg-primary text-white hover:bg-primary/90 hover:scale-105 shadow-primary/20" 
                                      : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                              )}
                          >
                              {isJoinEnabled ? "Enter Portal" : "Locked"}
                              <ArrowUpRight className="h-4 w-4 shrink-0" />
                          </button>
                      </div>
                  </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center gap-5 p-12 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.03)] text-foreground/40 h-full min-h-[220px]">
                  <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Video className="w-6 h-6 text-primary/40" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-center">No live rituals scheduled</p>
               </div>
            )}

            {/* Weekly wisdom / Tip */}
            <div className="p-8 rounded-[2rem] bg-white border border-white shadow-[0_20px_50px_rgba(255,138,117,0.08)] relative overflow-hidden group flex flex-col justify-center h-full min-h-[220px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 flex flex-col gap-6 items-start">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Elite Wisdom</h4>
                  <p className="text-sm font-medium leading-relaxed text-foreground/70 italic">
                    &quot;Your face is the mirror of your history. Honor each movement as a prayer to your own vitality.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Transformation Journey ── */}
          <div className="w-full rounded-[3rem] p-8 lg:p-12 space-y-12 bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_40px_100px_rgba(0,0,0,0.06)] relative overflow-hidden group/trans">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none transition-transform duration-1000 group-hover/trans:scale-125" />
            
            <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-8 relative z-10">
              <div className="space-y-5">
                 <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full border border-white shadow-sm text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                    <TrendingUp className="w-4 h-4" />
                    Evolution Log
                 </div>
                 <h3 className="text-4xl lg:text-6xl font-serif font-black text-foreground tracking-tight leading-none group-hover/trans:text-primary transition-colors duration-500">Transcendence</h3>
                 <p className="text-sm font-medium text-foreground/50 italic max-w-md leading-relaxed">
                    A profound mirror of your structural metamorphosis over {JOURNEY_MAX_DAY} sacred days.
                 </p>
              </div>
              <div className="flex gap-4 self-start 2xl:self-end">
                 <div className="px-8 py-5 bg-white rounded-3xl border border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center min-w-[130px] hover:scale-105 transition-transform duration-300">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Current Node</span>
                    <span className="text-3xl font-serif font-black text-foreground tracking-tight">Day {currentDay}</span>
                 </div>
                 <div className="px-8 py-5 bg-black text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center min-w-[130px] hover:scale-105 transition-transform duration-300">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Culmination</span>
                    <span className="text-3xl font-serif font-black text-white tracking-tight">{JOURNEY_MAX_DAY} Days</span>
                 </div>
              </div>
            </div>

            {/* Journey path selector */}
            <div className="relative z-10 p-4 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white shadow-inner overflow-x-auto custom-scrollbar">
              <JourneyProgress
                currentDay={currentDay}
                activeDay={activeStepDay}
                onSelectDay={setActiveStepDay}
                completedDays={new Set(journeyLogs.map(l => l.day_number))}
              />
            </div>

            {/* Visual Mirror + Daily Reflections */}
            <div className="grid grid-cols-1 items-stretch gap-12 relative z-10">
              
              {/* Comparison Mirror */}
              <div className="flex flex-col h-full space-y-6">
                  <div className="flex items-center justify-between px-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 italic">Ancestral vs Ascendant</h4>
                     <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-6" />
                     <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] bg-white px-5 py-2 rounded-full shadow-sm">Day 1 / Day {activeStepDay}</span>
                  </div>
                  
                  <div className="rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.12)] border-8 border-white bg-white h-[450px] lg:h-[550px] relative group w-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />
                    {activeStepDay < 1 && !afterImage ? (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-foreground/5">
                        <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-foreground/20 shadow-sm">
                            <ImageIcon className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.3em] leading-relaxed">The Mirror is Empty<br />Awaiting your origin.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full w-full">
                        <ImageComparison
                            beforeImage={beforeImage}
                            afterImage={afterImage}
                            disabled={false}
                            altBefore="Ancestral Baseline"
                            altAfter={`Unfolding Day ${activeStepDay}`}
                        />
                      </div>
                    )}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 text-white text-[10px] font-black uppercase tracking-[0.4em] bg-black/60 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20 shadow-2xl">
                       Drag to witness
                    </div>
                  </div>
              </div>

              {/* Daily reflections */}
              <div className="flex flex-col h-full space-y-8 pt-10 border-t border-primary/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-black text-white flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-110 transition-transform duration-500 shrink-0">
                        <Edit3 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-2xl font-serif font-black text-foreground tracking-tight leading-none">Inner Monologue</h5>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Node {activeStepDay}</p>
                    </div>
                  </div>
                  {activeLog?.updated_at && (
                    <div className="px-5 py-2 bg-white text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm self-start sm:self-auto border border-primary/5">
                        Inscribed {new Date(activeLog.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                     </div>
                  )}
                </div>

                <div className="min-h-[220px] rounded-[3rem] bg-white/80 p-8 sm:p-12 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-700 shadow-sm border border-white/60 hover:shadow-md">
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full h-full resize-none bg-transparent text-foreground/80 placeholder:text-foreground/30 text-lg font-medium leading-relaxed outline-none custom-scrollbar italic"
                    placeholder="Document the subtle energetic shifts. How does your structure feel today?"
                  />
                </div>

                {selectedImageBase64 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between p-5 px-8 rounded-full bg-primary text-white shadow-[0_20px_40px_rgba(255,138,117,0.3)]">
                        <div className="flex items-center gap-5">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Snapshot Captured</p>
                        </div>
                        <button onClick={() => { setSelectedImageBase64(null); setSelectedImageMime(null); }} className="h-10 w-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors font-black text-sm">
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center gap-5 p-8 sm:p-10 rounded-[2.5rem] bg-white hover:bg-white/80 border border-white shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500">
                    <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Imprint Photo</span>
                  </button>
                  
                  <button
                    onClick={handleSaveLog}
                    disabled={isSavingLog}
                    className="relative group overflow-hidden flex flex-col items-center justify-center gap-5 p-8 sm:p-10 rounded-[2.5rem] bg-foreground text-background shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-50 disabled:hover:scale-100">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="h-16 w-16 flex items-center justify-center rounded-full bg-background/10 shadow-sm group-hover:rotate-12 transition-transform duration-500 relative z-10">
                       {isSavingLog ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle className="h-6 w-6" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10">
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
           <div className="h-[550px] shrink-0 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-[0_40px_100px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] group/chat">
             <div className="px-8 py-5 border-b border-white/60 bg-white/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                      <User className="w-4 h-4" />
                   </div>
                   <div>
                       <h3 className="text-sm font-bold text-foreground font-serif leading-tight">Elite Support</h3>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">Direct Line</p>
                   </div>
                </div>
                <div className="flex gap-2 items-center px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-black tracking-[0.2em] text-primary uppercase">Active</span>
                </div>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col bg-white/20">
                 <OneOnOneChat
                    currentUser={currentUser}
                    hideHeader={true}
                    className="flex-1 h-full w-full border-0 bg-transparent rounded-none"
                 />
             </div>
           </div>

           {/* Guidelines Panel */}
           <div className="flex flex-col rounded-[2.5rem] p-8 border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative overflow-hidden bg-white/50 backdrop-blur-2xl group max-h-[500px]">
             <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
             <div className="flex items-center justify-between mb-8 relative z-10 shrink-0">
               <div className="space-y-1">
                 <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Sacred Texts</h3>
                 <p className="text-2xl font-serif font-black text-foreground tracking-tight">Guidelines</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                 <BookOpen className="h-4 w-4" />
               </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-4">
               {isLoadingResources ? (
                 <div className="flex h-32 items-center justify-center">
                   <Loader2 className="h-6 w-6 animate-spin text-primary/20" />
                 </div>
               ) : resources.length === 0 ? (
                 <div className="flex h-32 items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 italic">
                   The archive is empty.
                 </div>
               ) : (
                 resources.map(res => {
                   const style = getFileIcon(res.content_type || '');
                   return (
                     <div key={res.id} className="group/item flex items-center gap-4 p-4 rounded-3xl bg-white/80 border border-white/40 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                       <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-primary/5 text-primary transition-transform group-hover/item:scale-110 group-hover/item:rotate-3 shadow-sm border border-primary/5">
                         <style.icon className="h-4 w-4" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <h4 className="truncate text-[13px] font-bold text-foreground group-hover/item:text-primary transition-colors">{res.file_name}</h4>
                         <div className="mt-1 flex items-center gap-3">
                           <span className="text-[8px] font-black text-foreground/40 uppercase tracking-[0.2em]">{formatFileSize(res.file_size)}</span>
                         </div>
                       </div>
                       <div className="flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity -translate-x-2 group-hover/item:translate-x-0 duration-300">
                         <button
                           onClick={() => window.open(res.file_url, '_blank')}
                           className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-foreground hover:bg-primary hover:text-white transition-colors shadow-sm"
                         >
                           <Eye className="h-3.5 w-3.5" />
                         </button>
                         <a
                           href={res.file_url}
                           download={res.file_name}
                           className="h-8 w-8 flex items-center justify-center rounded-full bg-foreground text-background hover:scale-110 transition-transform shadow-md"
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 138, 117, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

