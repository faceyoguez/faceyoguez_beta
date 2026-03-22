'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { markModuleAsComplete } from '@/app/actions/lms';
import { toast } from 'sonner';
import { 
  Play, 
  Pause,
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Flame,
  Award,
  Video,
  Layout,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface Module {
  id: string;
  title: string;
  youtube_video_id: string;
  order_index: number;
  thumbnail_url: string | null;
}

interface CourseViewerProps {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  completedModuleIds: Set<string>;
  studentId: string;
}

export function CourseViewer({
  courseId,
  courseTitle,
  modules,
  completedModuleIds: initialCompleted,
  studentId
}: CourseViewerProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(initialCompleted);
  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    const firstIncomplete = modules.find(m => !initialCompleted.has(m.id));
    return firstIncomplete?.id || modules[0]?.id;
  });
  
  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  const playerRef = useRef<any>(null);
  const apiLoaded = useRef(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // ── YouTube API Integration ──
  useEffect(() => {
    if (!apiLoaded.current) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      apiLoaded.current = true;
    }

    const onPlayerStateChange = (event: any) => {
      // YT.PlayerState.PLAYING is 1
      if (event.data === 1) {
        setIsPlaying(true);
        setDuration(playerRef.current?.getDuration() || 0);
        startProgressTracking();
      } else {
        setIsPlaying(false);
        stopProgressTracking();
      }

      // YT.PlayerState.ENDED is 0
      if (event.data === 0) {
        handleAutoMarkComplete();
      }
    };

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      
      const activeModule = modules.find(m => m.id === activeModuleId);
      if (!activeModule) return;

      // Defensive check: if player exists and has the method, use it
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById(activeModule.youtube_video_id);
          setCurrentTime(0);
          return;
        } catch (e) {
          console.error('Player reuse failed, re-initializing:', e);
        }
      }

      // If we reach here, we need to create/re-create the player
      // Ensure the target element exists
      if (!document.getElementById('lms-player')) return;

      playerRef.current = new window.YT.Player('lms-player', {
        height: '100%',
        width: '100%',
        videoId: activeModule.youtube_video_id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1
        },
        events: {
          onStateChange: onPlayerStateChange,
          onReady: (event: any) => {
             event.target.setVolume(volume);
             setDuration(event.target.getDuration());
          },
          onError: (e: any) => {
            console.error('YT Player Error:', e.data);
            toast.error('Failed to load video. Please try again.');
          }
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      stopProgressTracking();
      // We don't necessarily want to destroy on every ID change if we reuse,
      // but if the component unmounts we definitely should.
      // However, to be extra safe with the "loadVideoById" error, 
      // let's at least ensure we don't have a broken reference.
    };
  }, [activeModuleId]);

  const startProgressTracking = () => {
    stopProgressTracking();
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    playerRef.current?.seekTo(time, true);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('lms-player-container');
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeModule = useMemo(() => 
    modules.find(m => m.id === activeModuleId), [modules, activeModuleId]
  );

  const handleAutoMarkComplete = async () => {
    if (!activeModule || completedIds.has(activeModule.id)) return;
    
    toast.info('Video finished! Progress saved 🧘‍♂️');
    
    const result = await markModuleAsComplete(activeModule.id, studentId);
    if (result.success) {
      const nextSet = new Set(completedIds);
      nextSet.add(activeModule.id);
      setCompletedIds(nextSet);

      const currentIndex = modules.findIndex(m => m.id === activeModuleId);
      if (currentIndex < modules.length - 1) {
        setActiveModuleId(modules[currentIndex + 1].id);
        toast.success(`Module mastered! Starting: ${modules[currentIndex + 1].title}`);
      } else {
        toast.success('Congratulations! You finished the course! 🎉');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-160px)]">
      
      {/* ── VIDEO PLAYER SIDE (8 cols) ── */}
      <div className="lg:col-span-8 space-y-6">
        <div 
          id="lms-player-container"
          className="relative aspect-video rounded-[3rem] overflow-hidden bg-black shadow-2xl ring-4 ring-brand-primary/10 group"
        >
          {/* The Actual Video */}
          <div id="lms-player" className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.01]"></div>
          
          {/* Custom Overlay to block interaction with native YT elements */}
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay}></div>

          {/* 1. BRANDING MASKING - Corner Accents (Hiding the pops without zooming) */}
          <div className="absolute top-0 left-0 w-64 h-24 z-20 bg-gradient-to-br from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 z-20 bg-gradient-to-tr from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Custom Status Badge - Top Left */}
          <div className="absolute top-6 left-6 z-30 pointer-events-none">
             <div className="bg-brand-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-xl backdrop-blur-md flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Master Class
             </div>
          </div>

          {/* 2. FROSTED PAUSE OVERLAY - Hides "Suggested Videos" and Title when paused */}
          <div className={cn(
            "absolute inset-0 z-20 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none",
            isPlaying ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}>
             <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center border-2 border-brand-primary/50 shadow-[0_0_50px_rgba(var(--brand-primary),0.3)] animate-pulse">
                <Play className="w-10 h-10 text-white fill-current translate-x-1" />
             </div>
             <p className="mt-6 text-white text-xs font-black uppercase tracking-[0.4em] shadow-lg">Session Paused</p>
          </div>

          {/* CUSTOM CONTROLS - Bottom Overlay */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 z-40 p-8 pt-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-500",
            isPlaying ? "opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0" : "opacity-100 translate-y-0"
          )}>
             {/* Progress Bar */}
             <div className="relative group/progress h-10 flex items-center mb-4">
                <input 
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-x-0 w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer focus:outline-none accent-brand-primary group-hover/progress:h-2.5 transition-all"
                />
                <div 
                  className="h-1.5 bg-brand-primary rounded-full pointer-events-none transition-all group-hover/progress:h-2.5 shadow-[0_0_15px_rgba(var(--brand-primary),0.5)]"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
             </div>

             <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <button 
                     onClick={togglePlay}
                     className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                   >
                     {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                   </button>

                   <div className="text-white font-black text-xs tracking-widest tabular-nums">
                      {formatTime(currentTime)} <span className="text-white/40 mx-2">/</span> {formatTime(duration)}
                   </div>

                   <button 
                     onClick={() => playerRef.current?.seekTo(currentTime - 10, true)}
                     className="text-white hover:text-brand-primary transition-colors p-2"
                   >
                     <RotateCcw className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-3 group/vol">
                      <button onClick={toggleMute} className="text-white hover:text-brand-primary transition-colors">
                        {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setVolume(v);
                          playerRef.current?.setVolume(v);
                        }}
                        className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-500 appearance-none bg-white/20 h-1 rounded-full accent-white"
                      />
                   </div>

                   <button 
                     onClick={handleFullscreen}
                     className="text-white hover:text-brand-primary transition-colors p-2"
                   >
                     <Maximize className="w-6 h-6" />
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Video Info Card - VIBRANT */}
        <div className="liquid-glass p-8 rounded-[3rem] border-2 border-brand-primary/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-surface-container-low/80 to-brand-primary/5">
          <div className="absolute -bottom-12 -right-12 p-8 opacity-10">
             <Flame className="w-40 h-40 text-brand-primary rotate-12" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                 <span className="bg-brand-primary text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-brand-primary/20">Now Playing</span>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/30">
                    <Video className="w-3.5 h-3.5 text-brand-primary" />
                    <p className="text-[11px] text-foreground font-black uppercase tracking-tighter">Lesson { (modules.findIndex(m => m.id === activeModuleId) + 1) } of {modules.length}</p>
                 </div>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight leading-[1.1]">
                {activeModule?.title || 'Initializing Player...'}
              </h1>
              <p className="text-sm font-bold text-brand-primary/80 italic flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Pure "Clean Frame" Mode: All distractions removed.
              </p>
            </div>

            {activeModule && completedIds.has(activeModule.id) && (
              <div className="bg-emerald-500 text-white px-8 py-5 rounded-[2.5rem] flex items-center gap-4 border-2 border-emerald-400/50 shadow-xl shadow-emerald-500/20 transform hover:scale-105 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm uppercase tracking-widest leading-none">Mastered</span>
                  <span className="text-[10px] font-bold opacity-80 mt-1 uppercase">Lesson Complete</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYLIST SIDE (4 cols) ── */}
      <div className="lg:col-span-4 space-y-6">
        <div className="liquid-glass rounded-[3rem] overflow-hidden flex flex-col h-full max-h-[calc(100vh-160px)] shadow-2xl border-2 border-brand-primary/10 bg-surface-container-lowest/50 backdrop-blur-3xl">
          <div className="p-8 border-b-2 border-outline-variant/10 flex items-center justify-between bg-brand-primary/5">
            <div className="space-y-1">
              <h2 className="font-black text-foreground uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_12px_rgba(var(--brand-primary),0.5)]" />
                Practice Path
              </h2>
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest ml-6">Sequential Mastery</p>
            </div>
            <Award className="w-7 h-7 text-brand-primary/40" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {modules.map((m, index) => {
              const isCompleted = completedIds.has(m.id);
              const isActive = activeModuleId === m.id;
              const isUnlocked = index === 0 || completedIds.has(modules[index - 1].id);

              return (
                <button
                  key={m.id}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setActiveModuleId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-500 text-left relative overflow-hidden group border-2",
                    isActive 
                      ? "bg-brand-primary border-brand-primary shadow-2xl shadow-brand-primary/30" 
                      : !isUnlocked 
                        ? "opacity-40 grayscale-[0.8] cursor-not-allowed bg-surface-container/20 border-transparent" 
                        : "bg-surface-container-low/40 border-outline-variant/10 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:scale-[1.03] active:scale-[0.97]"
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg transform transition-all duration-500 group-hover:rotate-6",
                    isActive ? "bg-white/20 ring-2 ring-white/30" : isCompleted ? "bg-emerald-500 text-white" : "bg-brand-primary/10 text-brand-primary"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : !isUnlocked ? (
                      <Lock className="w-5 h-5 text-foreground/40" />
                    ) : (
                      <Play className={cn("w-5 h-5", isActive ? "fill-white" : "fill-brand-primary")} />
                    )}
                  </div>

                  {/* Title & Stats */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-black truncate leading-tight transition-colors mb-1",
                      isActive ? "text-white" : "text-foreground"
                    )}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                          isActive ? "bg-white/10 text-white/80" : "bg-surface-container-highest text-foreground/40"
                       )}>Part {index + 1}</span>
                       {isUnlocked && !isCompleted && !isActive && (
                          <span className="text-[9px] font-black text-brand-primary uppercase tracking-tighter">Ready to Play</span>
                       )}
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -right-2 top-0 bottom-0 flex items-center group-hover:translate-x-1 duration-500 transition-transform">
                       <ArrowRight className="w-16 h-16 text-white/10" />
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <Lock className="w-4 h-4 text-foreground/20" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-8 bg-brand-primary/10 border-t-2 border-brand-primary/10">
             <div className="flex justify-between items-end mb-3">
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest block">Course Mastery</span>
                   <span className="text-xl font-black text-brand-primary">{Math.round((completedIds.size / modules.length) * 100)}%</span>
                </div>
                <div className="text-[10px] font-bold text-foreground/40 uppercase bg-surface-container-highest px-3 py-1 rounded-full">{completedIds.size} / {modules.length} DONE</div>
             </div>
             <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden p-0.5 ring-1 ring-brand-primary/10">
                <div 
                  className="h-full bg-gradient-to-r from-brand-primary to-rose-400 rounded-full shadow-[0_0_12px_rgba(var(--brand-primary),0.3)] transition-all duration-1000 ease-out" 
                  style={{ width: `${(completedIds.size / modules.length) * 100}%` }} 
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
