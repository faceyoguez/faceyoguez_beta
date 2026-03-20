'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Play, Pause, Volume2, Maximize, RotateCcw, VolumeX } from 'lucide-react';

interface Props {
    youtubeId: string;
    lessonId: string;
    onComplete?: () => void;
}

export default function YouTubePlayer({ youtubeId, lessonId, onComplete }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    
    const playerRef = useRef<any>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reportedCompleteRef = useRef(false);

    useEffect(() => {
        reportedCompleteRef.current = false;
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const initPlayer = () => {
             playerRef.current = new window.YT.Player(`youtube-player-${lessonId}`, {
                height: '100%',
                width: '100%',
                videoId: youtubeId,
                playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    controls: 0, // HIDE NATIVE CONTROLS
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                },
                events: {
                    onReady: () => setIsLoading(false),
                    onStateChange: handlePlayerStateChange,
                },
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (playerRef.current) playerRef.current.destroy();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [youtubeId, lessonId]);

    const handlePlayerStateChange = (event: any) => {
        if (event.data === 1) { // PLAYING
            setIsPlaying(true);
            startTracking();
        } else {
            setIsPlaying(false);
            stopTracking();
        }

        if (event.data === 0) { // ENDED
            reportProgress(100);
        }
    };

    const startTracking = () => {
        if (progressIntervalRef.current) return;
        progressIntervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getDuration) {
                const duration = playerRef.current.getDuration();
                const currentTime = playerRef.current.getCurrentTime();
                if (duration > 0) {
                    const pct = (currentTime / duration) * 100;
                    setProgress(pct);
                    if (pct >= 90 && !reportedCompleteRef.current) {
                        reportProgress(90);
                    }
                }
            }
        }, 1000);
    };

    const stopTracking = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    const reportProgress = async (percent: number) => {
        if (reportedCompleteRef.current && percent >= 90) return;
        try {
            const res = await fetch('/api/lms/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, progressPercent: Math.round(percent) }),
            });
            if (percent >= 90) reportedCompleteRef.current = true;
        } catch (err) {}
    };

    const togglePlay = () => {
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const toggleMute = () => {
        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    const handleProgressJump = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        const duration = playerRef.current.getDuration();
        playerRef.current.seekTo(duration * pct, true);
    };

    const resetVideo = () => {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
    };

    return (
        <div 
            className="group relative aspect-video rounded-[3rem] overflow-hidden bg-black border border-gray-100 shadow-2xl transition-all"
            onMouseMove={() => {
                setShowControls(true);
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
            }}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Native Iframe Hidden behind custom UI logic */}
            <div className="absolute inset-0 scale-[1.1] pointer-events-none">
                 <div id={`youtube-player-${lessonId}`} className="w-full h-full" />
            </div>

            {/* Tap to Toggle */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                    <Loader2 className="w-8 h-8 text-[#ff80ab] animate-spin" />
                </div>
            )}

            {/* Custom Control Overlay */}
            <div className={`
                absolute inset-0 z-30 flex flex-col justify-end p-8 bg-gradient-to-t from-black/60 via-transparent to-transparent
                transition-opacity duration-500 pointer-events-none
                ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}
            `}>
                <div className="space-y-6 pointer-events-auto">
                    {/* Progress Bar */}
                    <div 
                        className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer group/bar relative"
                        onClick={handleProgressJump}
                    >
                        <div 
                            className="h-full bg-[#ff80ab] rounded-full relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover/bar:scale-100 transition-transform shadow-lg" />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between text-white/90">
                        <div className="flex items-center gap-6">
                            <button onClick={togglePlay} className="hover:text-[#ff80ab] transition-colors">
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                            <button onClick={resetVideo} className="hover:text-[#ff80ab] transition-colors">
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button onClick={toggleMute} className="hover:text-[#ff80ab] transition-colors">
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                FaceYoga HD
                            </span>
                            <button className="hover:text-[#ff80ab] transition-colors">
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Play Button (Large) */}
            {!isPlaying && !isLoading && (
                <button 
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center z-20 group/play"
                >
                    <div className="w-24 h-24 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-[#ff80ab] translate-x-1 fill-current" />
                    </div>
                </button>
            )}
        </div>
    );
}
