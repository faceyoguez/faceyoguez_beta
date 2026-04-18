'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  courseLevel: number;
  isTrial?: boolean;
}

export function CourseViewer({
  courseId,
  courseTitle,
  modules,
  completedModuleIds: initialCompleted,
  studentId,
  courseLevel,
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-200px)] pb-10 animate-in fade-in duration-1000 font-sans relative z-10">
      
      {/* ── VIDEO PLAYER SIDE (8 cols) ── */}
      <div className="lg:col-span-8 space-y-8">
        <div 
          id="lms-player-container"
          className="relative aspect-video rounded-[3rem] overflow-hidden bg-slate-950 shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-white/20 group zen-glass shadow-[#FF8A75]/5"
        >
          {/* The Actual Video */}
          <div id="lms-player" className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.01]"></div>
          
          {/* Custom Overlay */}
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay}></div>

          {/* Masking Overlays */}
          <div className="absolute top-0 left-0 w-full h-32 z-20 bg-gradient-to-b from-slate-950/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-48 z-20 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Status Badge */}
          <div className="absolute top-6 left-8 z-30 pointer-events-none">
             <div className="bg-white/10 backdrop-blur-xl text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/10 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                Focus Mode
             </div>
          </div>

          {/* Frosted Pause Overlay */}
          <div className={cn(
            "absolute inset-0 z-20 backdrop-blur-md bg-slate-950/20 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none",
            isPlaying ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}>
             <div className="w-24 h-24 rounded-[2.5rem] bg-white/20 flex items-center justify-center border border-white/30 shadow-2xl">
                <Play className="w-10 h-10 text-white fill-current translate-x-1" />
             </div>
             <p className="mt-8 text-white/60 text-[10px] font-black uppercase tracking-[0.5em]">Sanctuary Paused</p>
          </div>

          {/* Custom Controls */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 z-40 p-8 pt-16 transition-all duration-500",
            isPlaying ? "opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0" : "opacity-100 translate-y-0"
          )}>
             {/* Progress Bar */}
             <div className="relative group/progress h-8 flex items-center mb-6">
                <input 
                   type="range"
                   min="0"
                   max={duration}
                   value={currentTime}
                   onChange={handleSeek}
                   className="absolute inset-x-0 w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none accent-[#FF8A75] group-hover/progress:h-2.5 transition-all"
                />
                <div 
                   className="h-1.5 bg-[#FF8A75] rounded-full pointer-events-none transition-all group-hover/progress:h-2.5 shadow-[0_0_20px_rgba(255,138,117,0.5)]"
                   style={{ width: `${(currentTime / duration) * 100}%` }}
                />
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                   <button 
                     onClick={togglePlay}
                     className="w-14 h-14 bg-[#FF8A75] text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF8A75]/20 hover:bg-[#FF8A75]/90"
                   >
                     {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                   </button>

                   <div className="text-white font-bold text-[12px] tabular-nums tracking-widest bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                      {formatTime(currentTime)} <span className="opacity-30 mx-2">/</span> {formatTime(duration)}
                   </div>

                   <button 
                     onClick={() => playerRef.current?.seekTo(currentTime - 10, true)}
                     className="text-white/60 hover:text-white transition-colors p-2"
                   >
                     <RotateCcw className="w-6 h-6" />
                   </button>
                </div>

                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-4 group/vol">
                      <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
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
                        className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-500 appearance-none bg-white/20 h-1 rounded-full accent-[#FF8A75]"
                      />
                   </div>

                   <button 
                     onClick={handleFullscreen}
                     className="text-white/60 hover:text-white transition-colors p-2"
                   >
                     <Maximize className="w-6 h-6" />
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Video Info Card */}
        <div className="zen-glass p-8 lg:p-12 rounded-[3.5rem] border border-white/80 shadow-[0_40px_80px_rgba(255,138,117,0.05)] relative overflow-hidden bg-white/60 backdrop-blur-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                 <span className="bg-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] border border-[#FF8A75]/10">Curriculum Pillar</span>
                 <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900/5 border border-slate-900/5">
                    <Video className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Step { (modules.findIndex(m => m.id === activeModuleId) + 1) } of {modules.length}</p>
                 </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
                {activeModule?.title || 'Loading content...'}
              </h1>
              <p className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.4em] flex items-center gap-3">
                <Layout className="w-5 h-5" />
                Expert Guided Ritual
              </p>
            </div>

            {activeModule && completedIds.has(activeModule.id) && (
              <div className="bg-[#FF8A75]/10 text-[#FF8A75] px-8 py-6 rounded-[2.5rem] flex items-center gap-6 border border-[#FF8A75]/20 transition-all duration-500 shadow-xl shadow-[#FF8A75]/5">
                <div className="w-14 h-14 rounded-2xl bg-[#FF8A75] text-white flex items-center justify-center shadow-lg shadow-[#FF8A75]/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="font-black text-[10px] uppercase tracking-[0.3em] block leading-none">Lesson Mastery</span>
                  <span className="text-[12px] font-bold text-[#FF8A75]/80 mt-2 block uppercase tracking-tight">Ritual Complete</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYLIST SIDE (4 cols) ── */}
      <div className="lg:col-span-4 h-full">
        <div className="zen-glass rounded-[3rem] overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)] shadow-[0_40px_80px_rgba(255,138,117,0.05)] border border-white/80 bg-white/60 backdrop-blur-3xl sticky top-12">
          
          <div className="p-8 lg:p-10 border-b border-slate-900/5 flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px] flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75]" />
                Path Progress
              </h2>
              <p className="text-3xl font-serif font-bold text-slate-900 leading-none">Rituals</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-[#FF8A75]/5 border border-[#FF8A75]/10">
                <Award className="w-7 h-7 text-[#FF8A75]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {modules.map((m, index) => {
              const isCompleted = completedIds.has(m.id);
              const isActive = activeModuleId === m.id;
              
              // NEW LOGIC: 
              // 1. Level 1, Module 1 is always unlocked.
              // 2. Otherwise, check trial or sequential completion.
              const isFirstModule = index === 0;
              const isUnlocked = (courseLevel === 1 && isFirstModule) 
                ? true 
                : (isTrial ? isFirstModule : (isFirstModule || completedIds.has(modules[index - 1].id)));

              return (
                <button
                  key={m.id}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setActiveModuleId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-700 text-left relative overflow-hidden border",
                    isActive 
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-900/20 scale-[1.02]" 
                      : !isUnlocked 
                        ? "opacity-40 grayscale cursor-not-allowed bg-transparent border-transparent" 
                        : "bg-white/60 border-white hover:border-[#FF8A75]/30 shadow-sm hover:bg-white hover:shadow-xl hover:shadow-[#FF8A75]/5 hover:scale-[1.02]"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-sm",
                    isActive ? "bg-[#FF8A75] text-white" : isCompleted ? "bg-[#FF8A75]/10 text-[#FF8A75]" : "bg-slate-900/5 text-slate-400 group-hover:bg-[#FF8A75]/10 group-hover:text-[#FF8A75]"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : !isUnlocked ? (
                      <Lock className="w-5 h-5 opacity-40" />
                    ) : (
                      <Play className={cn("w-5 h-5", isActive ? "fill-white" : "fill-current translate-x-0.5")} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <p className={cn(
                      "text-[13px] font-bold truncate leading-tight transition-colors mb-1 tracking-tight",
                      isActive ? "text-white" : "text-slate-900"
                    )}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em]",
                          isActive ? "text-[#FF8A75]/80" : "text-slate-400"
                       )}>Phase {index + 1}</span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                       <ChevronRight className="w-20 h-20 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-10 bg-white/60 border-t border-slate-900/5 mt-auto shrink-0 relative overflow-hidden">
             {/* Subtle Aura in progress card */}
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#FF8A75]/10 rounded-full blur-[40px] pointer-events-none" />

             <div className="flex justify-between items-end mb-5 relative z-10">
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block leading-none">Total Radiance</span>
                   <span className="text-4xl font-serif font-bold text-[#FF8A75] leading-none">{Math.round((completedIds.size / modules.length) * 100)}%</span>
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase bg-white/80 px-4 py-2 rounded-xl border border-white shadow-sm tracking-[0.2em] leading-none">
                    {completedIds.size} / {modules.length} Rituals
                </div>
             </div>
             <div className="h-2 w-full bg-slate-950/5 rounded-full overflow-hidden shadow-inner border border-white/50">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#FF8A75] to-[#FF8A75]/70 rounded-full relative" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedIds.size / modules.length) * 100}%` }}
                  transition={{ duration: 2, ease: 'circOut' }}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/40 blur-[4px]" />
                </motion.div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,138,117,0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,138,117,0.2);
        }
      `}</style>
    </div>
  );
}
