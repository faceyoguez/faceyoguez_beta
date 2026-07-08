'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  hasActiveSub?: boolean;
}

export function CourseViewer({
  courseId,
  courseTitle,
  modules,
  completedModuleIds: initialCompleted,
  studentId,
  courseLevel,
  hasActiveSub = false
}: CourseViewerProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(initialCompleted);
  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    const firstIncomplete = modules.find(m => !initialCompleted.has(m.id));
    return firstIncomplete?.id || modules[0]?.id;
  });
  
  const isL1 = courseLevel === 1;
  const theme = {
    primary: isL1 ? '#FF8A75' : '#8B5CF6',
    primaryBg: isL1 ? 'bg-[#FF8A75]' : 'bg-[#8B5CF6]',
    textPrimary: isL1 ? 'text-[#FF8A75]' : 'text-[#8B5CF6]',
    borderPrimary: isL1 ? 'border-[#FF8A75]/10' : 'border-[#8B5CF6]/10',
    borderPrimaryActive: isL1 ? 'border-[#FF8A75]/40' : 'border-[#8B5CF6]/40',
    bgActive: isL1 ? 'bg-[#FFE5DB]' : 'bg-[#EDE9FE]',
    textActive: isL1 ? 'text-[#FF8A75]' : 'text-[#8B5CF6]',
    bgBadge: isL1 ? 'bg-[#FF8A75]/10 text-[#FF8A75]' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
    bgBadgeActive: isL1 ? 'bg-[#FF8A75]/25 text-[#FF8A75]' : 'bg-[#8B5CF6]/25 text-[#8B5CF6]',
    shadowActive: isL1 ? 'shadow-[#FF8A75]/10' : 'shadow-[#8B5CF6]/10',
    accentClass: isL1 ? 'accent-[#FF8A75]' : 'accent-[#8B5CF6]',
    fillActive: isL1 ? 'fill-[#FF8A75]' : 'fill-[#8B5CF6]',
    hoverBorder: isL1 ? 'hover:border-[#FF8A75]/30' : 'hover:border-[#8B5CF6]/30',
    hoverShadow: isL1 ? 'hover:shadow-[#FF8A75]/5' : 'hover:shadow-[#8B5CF6]/5',
    shadowBase: isL1 ? 'shadow-[#FF8A75]/5' : 'shadow-[#8B5CF6]/5',
    progressShadow: isL1 ? 'shadow-[0_0_20px_rgba(255,138,117,0.5)]' : 'shadow-[0_0_20px_rgba(139,92,246,0.5)]',
    shadowLg: isL1 ? 'shadow-[#FF8A75]/20' : 'shadow-[#8B5CF6]/20',
    bgHalfOpacity: isL1 ? 'bg-[#FF8A75]/10' : 'bg-[#8B5CF6]/10',
    borderHalfOpacity: isL1 ? 'border-[#FF8A75]/20' : 'border-[#8B5CF6]/20',
    cardShadow: isL1 ? 'shadow-[0_40px_80px_rgba(255,138,117,0.05)]' : 'shadow-[0_40px_80px_rgba(139,92,246,0.05)]',
    progressGradient: isL1 ? 'from-[#FF8A75] to-[#FF8A75]/70' : 'from-[#8B5CF6] to-[#8B5CF6]/70',
  };

  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  const playerRef = useRef<any>(null);       // raw YT.Player constructor result
  const readyPlayerRef = useRef<any>(null);  // set only after onReady fires – fully usable
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
        const player = event.target || readyPlayerRef.current;
        if (player && typeof player.getDuration === 'function') {
          setDuration(player.getDuration() || 0);
        }
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

      // Reuse existing ready player – just load new video
      if (readyPlayerRef.current && typeof readyPlayerRef.current.loadVideoById === 'function') {
        try {
          readyPlayerRef.current.loadVideoById(activeModule.youtube_video_id);
          setCurrentTime(0);
          return;
        } catch (e) {
          console.error('Player reuse failed, re-initializing:', e);
          readyPlayerRef.current = null;
        }
      }

      if (!document.getElementById('lms-player')) return;

      // Clear old ready ref while new player initialises
      readyPlayerRef.current = null;

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
            // Store the fully-initialised player instance
            readyPlayerRef.current = event.target;
            try {
              event.target.setVolume(volume);
              setDuration(event.target.getDuration());
            } catch (e) {}
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
      const p = readyPlayerRef.current;
      if (p && typeof p.getCurrentTime === 'function') {
        setCurrentTime(p.getCurrentTime());
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
    const player = readyPlayerRef.current;
    if (!player) return;
    try {
      if (isPlaying) {
        if (typeof player.pauseVideo === 'function') player.pauseVideo();
      } else {
        if (typeof player.playVideo === 'function') player.playVideo();
      }
    } catch (e) {
      console.error('Failed to toggle play:', e);
    }
  };

  const activeModule = useMemo(() =>
    modules.find(m => m.id === activeModuleId), [modules, activeModuleId]
  );

  const handleAutoMarkComplete = useCallback(async () => {
    if (!activeModule || completedIds.has(activeModule.id)) return;
    
    toast.success('Module complete! Great job. 🧘\u200d♂️');
    
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
  }, [activeModule, activeModuleId, completedIds, modules, studentId]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    const player = readyPlayerRef.current;
    if (player && typeof player.seekTo === 'function') {
      try { player.seekTo(time, true); } catch (err) { console.error('seekTo failed:', err); }
    }
    // If user scrubs to within the last 3 seconds, treat as completed
    if (duration > 0 && time >= duration - 3) {
      handleAutoMarkComplete();
    }
  };

  const toggleMute = () => {
    const player = readyPlayerRef.current;
    if (!player) return;
    try {
      if (isMuted) {
        if (typeof player.unMute === 'function') { player.unMute(); setIsMuted(false); }
      } else {
        if (typeof player.mute === 'function') { player.mute(); setIsMuted(true); }
      }
    } catch (e) { console.error('Mute toggle failed:', e); }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    const container = document.getElementById('lms-player-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Sync isFullscreen state when user presses Escape or otherwise exits
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // activeModule and handleAutoMarkComplete moved above handleSeek

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-200px)] pb-10 animate-in fade-in duration-1000 font-jakarta relative z-10">
      
      {/* ── VIDEO PLAYER SIDE (8 cols) ── */}
      <div className="lg:col-span-8 space-y-8">
        <div 
          id="lms-player-container"
          className={cn("relative aspect-video rounded-[3rem] overflow-hidden bg-slate-950 shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-white/20 group zen-glass", theme.shadowBase)}
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
             <div className="bg-white/10 backdrop-blur-xl text-white text-[9px] font-aktiv font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/10 flex items-center gap-2.5">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", theme.primaryBg)} />
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
                   className={cn("absolute inset-x-0 w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none group-hover/progress:h-2.5 transition-all", theme.accentClass)}
                />
                <div 
                   className={cn("h-1.5 rounded-full pointer-events-none transition-all group-hover/progress:h-2.5", theme.progressShadow)}
                   style={{ width: `${(currentTime / duration) * 100}%`, backgroundColor: theme.primary }}
                />
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                   <button 
                     onClick={togglePlay}
                     className={cn("w-14 h-14 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl hover:opacity-95", theme.shadowLg)}
                     style={{ backgroundColor: theme.primary }}
                   >
                     {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                   </button>

                   <div className="text-white font-bold text-[12px] tabular-nums tracking-widest bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                      {formatTime(currentTime)} <span className="opacity-30 mx-2">/</span> {formatTime(duration)}
                   </div>

                   <button 
                      onClick={() => {
                        const p = readyPlayerRef.current;
                        if (p && typeof p.seekTo === 'function') {
                          try { p.seekTo(currentTime - 10, true); } catch(e) {}
                        }
                      }}
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
                           const p = readyPlayerRef.current;
                           if (p && typeof p.setVolume === 'function') {
                             try { p.setVolume(v); } catch(err) {}
                           }
                         }}
                        className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-500 appearance-none bg-white/20 h-1 rounded-full accent-[#FF8A75]"
                      />
                   </div>

                   <button 
                     onClick={handleFullscreen}
                     className="text-white/60 hover:text-white transition-colors p-2"
                   >
                     {isFullscreen 
                       ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                       : <Maximize className="w-6 h-6" />
                     }
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Video Info Card */}
        <div className="zen-glass p-8 lg:p-12 rounded-[3.5rem] border border-white/80 shadow-[0_40px_80px_rgba(255,138,117,0.05)] relative overflow-hidden bg-white/60 backdrop-blur-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                 <span className="bg-[#FF8A75]/10 text-[#FF8A75] text-[8px] font-aktiv font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.15em] border border-[#FF8A75]/10">Curriculum Pillar</span>
                 <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/5 border border-slate-900/5">
                    <Video className="w-3 h-3 text-slate-400" />
                    <p className="text-[8px] text-slate-500 font-aktiv font-bold uppercase tracking-[0.15em]">Step { (modules.findIndex(m => m.id === activeModuleId) + 1) } of {modules.length}</p>
                 </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-aktiv font-bold text-slate-900 tracking-tight leading-tight">
                {activeModule?.title || 'Loading content...'}
              </h1>
              <p className="text-[8px] font-aktiv font-bold text-[#FF8A75] uppercase tracking-[0.25em] flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Expert Guided Ritual
              </p>
            </div>

            {activeModule && completedIds.has(activeModule.id) && (
              <div className="bg-[#FF8A75]/10 text-[#FF8A75] px-6 py-4 rounded-[2rem] flex items-center gap-4 border border-[#FF8A75]/20 transition-all duration-500 shadow-xl shadow-[#FF8A75]/5">
                <div className="w-10 h-10 rounded-xl bg-[#FF8A75] text-white flex items-center justify-center shadow-lg shadow-[#FF8A75]/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-aktiv font-bold text-[8px] uppercase tracking-[0.2m] block leading-none">Lesson Mastery</span>
                  <span className="text-[10px] font-aktiv font-bold text-[#FF8A75]/80 mt-1 block uppercase tracking-tight">Ritual Complete</span>
                </div>
              </div>
            )}

            {activeModule && !completedIds.has(activeModule.id) && (
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="text-[8px] font-semibold text-slate-400/80 uppercase tracking-widest text-right whitespace-nowrap">
                  ngl, wanna skip? no judgment fr 👇
                </p>
                <button
                  onClick={handleAutoMarkComplete}
                  className="bg-[#FF8A75] text-white hover:bg-slate-900 px-5 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 shadow-xl shadow-[#FF8A75]/10 hover:shadow-slate-900/10 cursor-pointer border border-[#FF8A75]/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="font-aktiv font-bold text-[10px] uppercase tracking-wider">Mark as Complete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYLIST SIDE (4 cols) ── */}
      <div className="lg:col-span-4 h-full">
        <div className="zen-glass rounded-[3rem] overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)] shadow-[0_40px_80px_rgba(255,138,117,0.05)] border border-white/80 bg-white/60 backdrop-blur-3xl sticky top-12">
          
          <div className="p-6 lg:p-7 border-b border-slate-900/5 flex items-center justify-between">
            <div className="space-y-1.5">
              <h2 className="font-aktiv font-bold text-slate-400 uppercase tracking-[0.3em] text-[8px] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#FF8A75]" />
                Path Progress
              </h2>
              <p className="text-xl font-aktiv font-bold text-slate-900 leading-none">Rituals</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-xl shadow-[#FF8A75]/5 border border-[#FF8A75]/10">
                <Award className="w-5 h-5 text-[#FF8A75]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {modules.map((m, index) => {
              const isCompleted = completedIds.has(m.id);
              const isActive = activeModuleId === m.id;
              
              // LOCK LOGIC:
              // - Level 1, Module 1 (index 0): FREE for everyone, always unlocked.
              // - All other modules in Level 1: Require active subscription AND sequential completion.
              // - Level 2 modules: Require active subscription (page-level redirect handles L2 entirely).
              const isFirstModule = index === 0;
              const isUnlocked = (courseLevel === 1 && isFirstModule)
                ? true
                : (hasActiveSub && (isFirstModule || completedIds.has(modules[index - 1].id)));

              return (
                <button
                  key={m.id}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setActiveModuleId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-700 text-left relative overflow-hidden border",
                    isActive 
                      ? "bg-[#FFE5DB] text-slate-900 border-[#FF8A75]/40 shadow-xl shadow-[#FF8A75]/10 scale-[1.02]" 
                      : !isUnlocked 
                        ? "opacity-40 grayscale cursor-not-allowed bg-transparent border-transparent" 
                        : "bg-white/60 border-white hover:border-[#FF8A75]/30 shadow-sm hover:bg-white hover:shadow-xl hover:shadow-[#FF8A75]/5 hover:scale-[1.02]"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-700 shadow-sm relative",
                    isActive ? "bg-[#FF8A75] text-white" : isCompleted ? "bg-[#FF8A75]/10 text-[#FF8A75]" : "bg-slate-900/5 text-slate-400 group-hover:bg-[#FF8A75]/10 group-hover:text-[#FF8A75]"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : !isUnlocked ? (
                      <Lock className="w-4 h-4 opacity-40" />
                    ) : (
                      <Play className={cn("w-4 h-4", isActive ? "fill-white" : "fill-current translate-x-0.5")} />
                    )}
                    
                    {/* Free Preview badge for Level 1, Module 1 */}
                    {courseLevel === 1 && index === 0 && !isCompleted && !isActive && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF8A75] rounded-full border border-white animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <p className={cn(
                      "text-xs font-aktiv font-bold truncate leading-tight transition-colors mb-1 tracking-tight",
                      isActive ? "text-[#FF8A75]" : "text-slate-900"
                    )}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                          "text-[7px] font-aktiv font-bold uppercase tracking-[0.2em]",
                          isActive ? "text-[#FF8A75]/80" : "text-slate-400"
                       )}>Session {index + 1}</span>
                       {courseLevel === 1 && index === 0 && (
                         <span className={cn(
                           "text-[6px] font-aktiv font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-[#FF8A75]/10 text-[#FF8A75]",
                           isActive && "bg-[#FF8A75]/25 text-[#FF8A75]"
                         )}>Free Preview</span>
                       )}
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                       <ChevronRight className="w-16 h-16 text-[#FF8A75]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6 bg-white/60 border-t border-slate-900/5 mt-auto shrink-0 relative overflow-hidden">
             {/* Subtle Aura in progress card */}
             <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#FF8A75]/10 rounded-full blur-[40px] pointer-events-none" />

             <div className="flex justify-between items-end mb-4 relative z-10">
                <div className="space-y-1">
                   <span className="text-[8px] font-aktiv font-bold text-slate-400 uppercase tracking-[0.3em] block leading-none">Total Radiance</span>
                   <span className="text-2xl font-aktiv font-bold text-[#FF8A75] leading-none">{Math.round((completedIds.size / modules.length) * 100)}%</span>
                </div>
                <div className="text-[8px] font-aktiv font-bold text-slate-500 uppercase bg-white/80 px-2.5 py-1.5 rounded-lg border border-white shadow-sm tracking-[0.2em] leading-none">
                    {completedIds.size} / {modules.length} Rituals
                </div>
             </div>
             <div className="h-1.5 w-full bg-slate-950/5 rounded-full overflow-hidden shadow-inner border border-white/50">
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
