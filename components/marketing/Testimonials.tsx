'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, Variants, useAnimationFrame } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  author: string;
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  // Video state
  const [videos, setVideos] = useState<Video[]>([
    { id: "EcrTIqrX9Jw", title: "", thumbnail: "https://i.ytimg.com/vi/EcrTIqrX9Jw/hqdefault.jpg", url: "https://www.youtube.com/watch?v=EcrTIqrX9Jw", author: "Faceyoguez" },
    { id: "rIxQmx1vXAA", title: "", thumbnail: "https://i.ytimg.com/vi/rIxQmx1vXAA/hqdefault.jpg", url: "https://www.youtube.com/watch?v=rIxQmx1vXAA", author: "Faceyoguez" },
    { id: "0g5e_1od2MA", title: "", thumbnail: "https://i.ytimg.com/vi/0g5e_1od2MA/hqdefault.jpg", url: "https://www.youtube.com/watch?v=0g5e_1od2MA", author: "Faceyoguez" },
    { id: "I9WAXv6DHQ0", title: "", thumbnail: "https://i.ytimg.com/vi/I9WAXv6DHQ0/hqdefault.jpg", url: "https://www.youtube.com/watch?v=I9WAXv6DHQ0", author: "Faceyoguez" },
    { id: "KbLP8sMB_xg", title: "", thumbnail: "https://i.ytimg.com/vi/KbLP8sMB_xg/hqdefault.jpg", url: "https://www.youtube.com/watch?v=KbLP8sMB_xg", author: "Faceyoguez" },
    { id: "v6LkzJw5x3A", title: "", thumbnail: "https://i.ytimg.com/vi/v6LkzJw5x3A/hqdefault.jpg", url: "https://www.youtube.com/watch?v=v6LkzJw5x3A", author: "Faceyoguez" },
    { id: "QrRiyprZnkc", title: "", thumbnail: "https://i.ytimg.com/vi/QrRiyprZnkc/hqdefault.jpg", url: "https://www.youtube.com/watch?v=QrRiyprZnkc", author: "Faceyoguez" },
    { id: "My51X33IdVk", title: "", thumbnail: "https://i.ytimg.com/vi/My51X33IdVk/hqdefault.jpg", url: "https://www.youtube.com/watch?v=My51X33IdVk", author: "Faceyoguez" },
    { id: "zZ9azBQ-eWs", title: "", thumbnail: "https://i.ytimg.com/vi/zZ9azBQ-eWs/hqdefault.jpg", url: "https://www.youtube.com/watch?v=zZ9azBQ-eWs", author: "Faceyoguez" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [xPos, setXPos] = useState(0);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // We no longer need to fetch on mount, the videos are static!
  }, []);

  useAnimationFrame((time, delta) => {
    if (isMuted && scrollRef.current && videos.length > 0) {
      setXPos((prev) => {
        const newX = prev + (delta * 0.03); // Move left to right
        const singleSetWidth = scrollRef.current ? scrollRef.current.scrollWidth / 6 : 1000;

        if (newX >= 0) {
          return -singleSetWidth; // Loop back seamlessly
        }
        return newX;
      });
    }
  });

  const toggleSound = (index: number) => {
    if (isMuted) {
      setIsMuted(false);
      setActiveVideoIndex(index);
    } else {
      setIsMuted(true);
      setActiveVideoIndex(null);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py- md:py- overflow-hidden relative bg-transparent"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-10 md:mb-16 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          className="flex flex-col items-center text-center md:flex-row md:text-left md:items-end md:justify-between gap-8 md:gap-12"
        >
          <div className="space-y-4 md:space-y-6 md:pl-8 flex flex-col items-center md:items-start w-full">
            <div className="inline-flex flex-col items-center md:items-start gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">Real Stories</span>
              <div className="w-12 h-[1px] bg-[#e76f51]/20" />
            </div>
            <h2 className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-[1.1] tracking-tight">
              Real Stories. <br className="hidden md:block" />{' '}
              <span className="italic font-light opacity-60">Verified Results.</span>
            </h2>
          </div>


        </motion.div>
      </div>

      {/* YouTube Video Marquee Section */}
      <div className="relative w-full" ref={containerRef}>
        {/* Smooth fade gradients at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#fcf8f7] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#fcf8f7] to-transparent z-10 pointer-events-none" />

        <div className={`overflow-visible py-8 flex items-center relative z-50 ${isMobile ? 'h-[450px]' : 'h-[600px]'}`}>
          {isLoading ? (
            <div className="w-full flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#e76f51] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : errorMsg ? (
            <div className="w-full flex justify-center py-20 text-red-500 font-jakarta">
              Error loading videos: {errorMsg}
            </div>
          ) : videos.length === 0 ? (
            <div className="w-full flex justify-center py-20 text-[#2a2019]/50 font-jakarta">
              No videos found in the playlist.
            </div>
          ) : (
            <motion.div
              ref={scrollRef}
              className="flex gap-4 px-4 items-center"
              style={{
                x: xPos,
                transition: isMuted ? 'none' : 'transform 0.5s ease-out'
              }}
            >
              {[...videos, ...videos, ...videos, ...videos, ...videos, ...videos].map((video, idx) => {
                const isActive = !isMuted && activeVideoIndex === idx;

                return (
                  <div
                    key={`${video.id}-${idx}`}
                    onClick={() => toggleSound(idx)}
                    className={`relative flex-shrink-0 transition-all duration-500 cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl bg-black
                      ${isActive ? 'shadow-2xl scale-105 z-20' : 'hover:scale-[1.02]'}
                    `}
                    style={{
                      width: isActive
                        ? (isMobile ? '225px' : '320px')
                        : (isMobile ? '160px' : '240px'),
                      height: isActive
                        ? (isMobile ? '400px' : '560px')
                        : (isMobile ? '284px' : '420px'),
                    }}
                  >
                    {isActive ? (
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&controls=1&loop=1&playlist=${video.id}&rel=0&playsinline=1&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        onLoad={(e) => {
                          const iframe = e.currentTarget;
                          setTimeout(() => {
                            iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
                            iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
                          }, 100);
                        }}
                      />
                    ) : (
                      <img
                        src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                      {video.title && (
                        <div className="absolute bottom-6 left-6 right-6">
                          <p className="text-white font-medium text-sm md:text-base line-clamp-2 drop-shadow-md">
                            {video.title.replace(/Faceyoga.*/i, '').trim()}
                          </p>
                        </div>
                      )}
                      {(!isActive || isMuted) && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white border border-white/40 shadow-xl group-hover:scale-110 transition-transform">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

