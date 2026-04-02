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
  RotateCcw,
  Sparkles,
  ChevronRight
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
  isTrial?: boolean;
}

export function CourseViewer({
  courseId,
  courseTitle,
  modules,
  completedModuleIds: initialCompleted,
  studentId,
  isTrial = false
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
      if (event.data === 1) { // PLAYING
        setIsPlaying(true);
        setDuration(playerRef.current?.getDuration() || 0);
        startProgressTracking();
      } else {
        setIsPlaying(false);
        stopProgressTracking();
      }
      if (event.data === 0) { // ENDED
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

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById(activeModule.youtube_video_id);
          setCurrentTime(0);
          return;
        } catch (e) {
          console.error('Player reuse failed, re-initializing:', e);
        }
      }

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
            toast.error('Failed to load video.');
          }
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      stopProgressTracking();
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
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
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
    if (iframe?.requestFullscreen) iframe.requestFullscreen();
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
    
    toast.success('Module complete! Great job. 🧘‍♂️');
    
    const result = await markModuleAsComplete(activeModule.id, studentId);
    if (result.success) {
      const nextSet = new Set(completedIds);
      nextSet.add(activeModule.id);
      setCompletedIds(nextSet);

      const currentIndex = modules.findIndex(m => m.id === activeModuleId);
      if (currentIndex < modules.length - 1) {
        setActiveModuleId(modules[currentIndex + 1].id);
      } else {
        toast.success('Congratulations! You finished the course! 🎉');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-160px)] pb-20 animate-in fade-in duration-1000 font-sans">
      
      {/* ── VIDEO PLAYER SIDE (8 cols) ── */}
      <div className="lg:col-span-8 space-y-6">
        <div 
          id="lms-player-container"
          className="relative aspect-video rounded-[3rem] overflow-hidden bg-black shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/20 group"
        >
          {/* The Actual Video */}
          <div id="lms-player" className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.01]"></div>
          
          {/* Custom Overlay */}
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay}></div>

          {/* Masking Overlays */}
          <div className="absolute top-0 left-0 w-full h-32 z-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-48 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

          {/* Status Badge */}
          <div className="absolute top-6 left-8 z-30 pointer-events-none">
             <div className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Focus Mode
             </div>
          </div>

          {/* Frosted Pause Overlay */}
          <div className={cn(
            "absolute inset-0 z-20 backdrop-blur-md bg-black/20 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none",
            isPlaying ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}>
             <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-2xl">
                <Play className="w-8 h-8 text-white fill-current translate-x-1" />
             </div>
             <p className="mt-6 text-white/60 text-[10px] font-bold uppercase tracking-[0.4em]">Paused</p>
          </div>

          {/* Custom Controls */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 z-40 p-8 pt-16 transition-all duration-500",
            isPlaying ? "opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0" : "opacity-100 translate-y-0"
          )}>
             {/* Progress Bar */}
             <div className="relative group/progress h-8 flex items-center mb-4">
                <input 
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-x-0 w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer focus:outline-none accent-white group-hover/progress:h-1.5 transition-all"
                />
                <div 
                  className="h-1 bg-white rounded-full pointer-events-none transition-all group-hover/progress:h-1.5 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <button 
                     onClick={togglePlay}
                     className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                   >
                     {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                   </button>

                   <div className="text-white font-medium text-[11px] tabular-nums tracking-tight">
                      {formatTime(currentTime)} <span className="opacity-30 mx-2">/</span> {formatTime(duration)}
                   </div>

                   <button 
                     onClick={() => playerRef.current?.seekTo(currentTime - 10, true)}
                     className="text-white/60 hover:text-white transition-colors p-2"
                   >
                     <RotateCcw className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-3 group/vol">
                      <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
                     className="text-white/60 hover:text-white transition-colors p-2"
                   >
                     <Maximize className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Video Info Card */}
        <div className="surface-container p-8 lg:p-12 rounded-[3rem] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.03)] relative overflow-hidden bg-white/40 backdrop-blur-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                 <span className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-primary/10">Next Lesson</span>
                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/5">
                    <Video className="w-3.5 h-3.5 text-foreground/40" />
                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-[0.2em]">Lesson { (modules.findIndex(m => m.id === activeModuleId) + 1) } of {modules.length}</p>
                 </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-serif font-black text-foreground tracking-tight leading-tight">
                {activeModule?.title || 'Loading content...'}
              </h1>
              <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2.5">
                <Layout className="w-4 h-4" />
                Curriculum Implementation
              </p>
            </div>

            {activeModule && completedIds.has(activeModule.id) && (
              <div className="bg-brand-emerald/10 text-brand-emerald px-8 py-5 rounded-[2rem] flex items-center gap-5 border border-brand-emerald/20 transition-all duration-500 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-brand-emerald text-white flex items-center justify-center shadow-lg shadow-brand-emerald/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-[0.2em] block leading-none">Completed</span>
                  <span className="text-[10px] font-medium text-brand-emerald/60 mt-2 uppercase tracking-tight">Lesson Mastered</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYLIST SIDE (4 cols) ── */}
      <div className="lg:col-span-4 h-full">
        <div className="surface-container rounded-[2.5rem] overflow-hidden flex flex-col h-full max-h-[calc(100vh-160px)] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-white/60 bg-white/40 backdrop-blur-3xl sticky top-12">
          
          <div className="p-8 lg:p-10 border-b border-white/60 flex items-center justify-between">
            <div className="space-y-1.5">
              <h2 className="font-bold text-foreground/30 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Course Path
              </h2>
              <p className="text-2xl font-serif font-bold text-foreground">Curriculum</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-primary/40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {modules.map((m, index) => {
              const isCompleted = completedIds.has(m.id);
              const isActive = activeModuleId === m.id;
              // Trial users only get the first video. Non-trial users get unlocked sequentially.
              const isUnlocked = isTrial ? index === 0 : (index === 0 || completedIds.has(modules[index - 1].id));

              return (
                <button
                  key={m.id}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setActiveModuleId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-5 p-5 rounded-3xl transition-all duration-500 text-left relative overflow-hidden border",
                    isActive 
                      ? "bg-black text-white border-black shadow-xl scale-[1.02]" 
                      : !isUnlocked 
                        ? "opacity-40 grayscale cursor-not-allowed bg-transparent border-transparent" 
                        : "bg-white/50 border-white hover:border-white shadow-sm hover:bg-white hover:shadow-md hover:scale-[1.01]"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
                    isActive ? "bg-white text-black" : isCompleted ? "bg-brand-emerald/10 text-brand-emerald" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : !isUnlocked ? (
                      <Lock className="w-5 h-5 opacity-40" />
                    ) : (
                      <Play className={cn("w-5 h-5 px-0.5", isActive ? "fill-black" : "fill-current")} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <p className={cn(
                      "text-sm font-bold truncate leading-tight transition-colors mb-1 tracking-tight",
                      isActive ? "text-white" : "text-foreground"
                    )}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em]",
                          isActive ? "text-white/40" : "text-foreground/30"
                       )}>Part {index + 1}</span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                       <ChevronRight className="w-16 h-16 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-8 lg:p-10 bg-white/40 border-t border-white/60 mt-auto shrink-0">
             <div className="flex justify-between items-end mb-4">
                <div className="space-y-0.5">
                   <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] block leading-none">Overall Progress</span>
                   <span className="text-3xl font-serif font-black text-primary italic leading-none">{Math.round((completedIds.size / modules.length) * 100)}%</span>
                </div>
                <div className="text-[9px] font-black text-foreground/80 uppercase bg-white px-3 py-1.5 rounded-full tracking-[0.2em] border border-white shadow-sm">
                    {completedIds.size} / {modules.length} Done
                </div>
             </div>
             <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-sm border border-black/5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${(completedIds.size / modules.length) * 100}%` }} 
                >
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px]" />
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
