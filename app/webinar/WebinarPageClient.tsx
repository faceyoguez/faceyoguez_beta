'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  CalendarDays,
  Video,
  Users,
  CheckCircle2,
  Star,
  ArrowRight,
  X,
  VolumeX,
  Volume2,
  Play,
} from 'lucide-react';
import { WhyUs } from '@/components/marketing/WhyUs';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';
import { Gallery } from '@/components/marketing/Gallery';
import { Testimonials } from '@/components/marketing/Testimonials';
import { VerifiedProofs } from '@/components/marketing/VerifiedProofs';



interface WebinarPageClientProps {
  whatsappLink: string | null;
}

// ── Shared Animation Variants ──
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

function PortraitVideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // User's preference (default: unmuted)
  const [isAutoplayMuted, setIsAutoplayMuted] = useState(false); // Browser blocked unmuted autoplay, playing muted temporarily

  // Use IntersectionObserver to detect when video is in view
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle play/pause + attempt autoplay based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      // Apply the user's muted preference
      video.muted = isMuted;
      
      video.play()
        .then(() => {
          // Playback succeeded unmuted (or muted if isMuted is true)
          setIsAutoplayMuted(false);
        })
        .catch((err) => {
          console.log("Autoplay unmuted blocked:", err);
          // If browser blocked unmuted autoplay, fall back to muted so it plays automatically,
          // but keep isMuted as false (user preference is still unmuted) and track isAutoplayMuted
          if (!isMuted) {
            video.muted = true;
            setIsAutoplayMuted(true);
            video.play().catch(e => console.log("Muted autoplay fallback failed:", e));
          }
        });
    } else {
      video.pause();
    }
  }, [isVisible, isMuted]);

  // Listen for the first document-wide user interaction (click, tap, keypress)
  // to automatically unmute the video if it is currently playing muted due to browser policy.
  useEffect(() => {
    const handleInteraction = () => {
      const video = videoRef.current;
      if (video && isVisible && !isMuted && isAutoplayMuted) {
        video.muted = false;
        video.play()
          .then(() => {
            setIsAutoplayMuted(false);
          })
          .catch(err => console.log("Failed to play on interaction:", err));
      }
    };

    if (isVisible && !isMuted && isAutoplayMuted) {
      window.addEventListener('click', handleInteraction, { passive: true });
      window.addEventListener('touchstart', handleInteraction, { passive: true });
      window.addEventListener('keydown', handleInteraction, { passive: true });
    }

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [isVisible, isMuted, isAutoplayMuted]);

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isAutoplayMuted) {
      // It was muted by browser autoplay policy. User clicked/tapped to hear it.
      video.muted = false;
      video.play().catch(err => console.log("Failed to play on click:", err));
      setIsMuted(false);
      setIsAutoplayMuted(false);
    } else {
      // Normal toggle
      const newMuted = !isMuted;
      video.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const videoUrl = 'https://lrg7idh9n6monaej.public.blob.vercel-storage.com/faceyoguez%20r1%20v3.mp4';

  return (
    <div
      ref={containerRef}
      onClick={() => toggleMute()}
      className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] mx-auto rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-[#FF8A75]/20 group select-none ring-1 ring-black/5 cursor-pointer"
    >
      {/* Fallback loading state — shown until video loads */}
      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-0 text-white/40">
        <Play className="w-12 h-12 mb-3 animate-pulse text-[#FF8A75]" />
        <span className="text-xs font-jakarta tracking-wide text-white/60">Loading video...</span>
      </div>

      {/* HTML5 Video Player — always in DOM for instant play/preload */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full z-10 object-cover animate-fade-in"
        src={videoUrl}
        loop
        playsInline
        preload="auto"
      />

      {/* Gradient overlay for premium look — sits above video, below controls */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-20 pointer-events-none" />

      {/* Mute/Unmute control — bottom right */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-jakarta font-bold transition-all hover:bg-black/80">
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-[#FF8A75]" />
            <span>Unmute</span>
          </>
        ) : isAutoplayMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-[#FF8A75] animate-pulse" />
            <span className="text-[#FF8A75]">Tap for Sound</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#FF8A75]" />
            <span>Mute</span>
          </>
        )}
      </div>
    </div>
  );
}


export function WebinarPageClient({ whatsappLink }: WebinarPageClientProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const targetLink = whatsappLink || '#';

  const handleJoinClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!whatsappLink) {
      e.preventDefault();
      alert('WhatsApp link is currently unavailable. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1a1a1a] font-jakarta overflow-x-hidden selection:bg-[#FF8A75]/20 selection:text-[#FF8A75]">

      <LuxuryBackground />
      {/* ── Fixed Navbar (Simplified for Landing Page) ── */}
      <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[94%] sm:w-[85%] z-[100] will-change-transform">
        <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4 rounded-full bg-white/60 sm:bg-white/40 backdrop-blur-lg sm:backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(255,138,117,0.04)] will-change-[backdrop-filter]">
          <div className="font-sooner text-xl sm:text-3xl font-bold text-[#2a2019] leading-none flex items-center tracking-tight">
            faceyoguez
          </div>
          <Link
            href="/webinar/register"
            className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 bg-[#1a1a1a] text-white rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#FF8A75] transition-all shadow-md active:scale-95 leading-none"
          >
            Join Free Weekend Batch
          </Link>
        </div>
      </nav>



      <main className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20">

        {/* ── 1. HERO SECTION ── */}
        <section className="relative max-w-5xl mx-auto px-6 pt-6 sm:pt-16 pb-10 sm:pb-20 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6 sm:space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF8A75]/10 border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8A75] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8A75]"></span>
              </span>
              Weekend Live Webinar
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl md:text-[5rem] font-aktiv font-bold text-[#2a2019] leading-[1.05] tracking-tight mx-auto max-w-4xl">
              The Real Reason Your Skin Is Ageing Faster Than It Should
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl font-jakarta text-[#2a2019]/70 max-w-2xl mx-auto leading-relaxed">
              — And What To Do About It <span className="font-bold text-[#FF8A75]">(In 10 Minutes a Day)</span>
            </motion.p>

            <motion.p variants={fadeUp} className="text-sm sm:text-base font-jakarta text-[#2a2019]/60 max-w-3xl mx-auto leading-relaxed px-4">
              Join Harsimrat — India's #1 Face Wellness Coach — for a free live session where you'll discover the exact facial muscle techniques that 2,000+ women have used to visibly lift, tone, and glow.
            </motion.p>

            <motion.div variants={fadeUp} className="inline-block mt-2">
              <span className="relative overflow-hidden inline-flex items-center justify-center px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] text-[#2a2019] bg-white border border-[#2a2019]/15 shadow-[0_4px_16px_rgba(0,0,0,0.04)] animate-dynamic-glow">
                <span className="relative z-10">No creams 🧴. No needles 💉. No surgery 🩺.</span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-zinc-400/15 via-white/40 via-zinc-400/15 to-transparent -translate-x-full animate-shimmer" />
              </span>
            </motion.div>

            {/* Quick Info Bar */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-8">
              {[
                { icon: CalendarDays, text: 'Every Sat & Sun' },
                { icon: Video, text: 'Live on Zoom' },
                { icon: Users, text: 'Limited Seats' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#FF8A75]/10 shadow-sm">
                  <item.icon className="w-4 h-4 text-[#FF8A75]" />
                  <span className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider">{item.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="pt-8 flex flex-col items-center gap-4">
              <Link
                href="/webinar/register"
                className="group relative inline-flex items-center justify-center px-8 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-black uppercase tracking-[0.15em] text-white bg-[#e76f51] hover:bg-[#d4603f] rounded-full overflow-hidden transition-all shadow-[0_20px_40px_-15px_rgba(231,111,81,0.5)] hover:-translate-y-1 w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-3">
                  🌸 Reserve My Free Spot <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </Link>
              <p className="text-[11px] font-medium text-[#2a2019]/50 tracking-wide">
                Takes 30 seconds. Join the exclusive WhatsApp group.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── 2. STATS BAR ── */}
        <section className="bg-[#1a1a1a] py-12 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { value: '2,000+', label: 'Clients Trained' },
              { value: '1.99L+', label: 'Instagram Community' },
              { value: '274+', label: 'Classes Conducted' },
              { value: '21 Days', label: 'Avg. First Visible Result' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center pt-6 md:pt-0 first:pt-0 text-center px-4">
                <div className="text-3xl md:text-4xl font-aktiv font-bold text-[#FF8A75] mb-2">{stat.value}</div>
                <div className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. MEET HARSIMRAT / VIDEO ── */}
        <section className="max-w-5xl mx-auto px-6 pt-12 sm:pt-24 pb-8 sm:pb-12">
          <div className="text-center mb-12">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-4 block">Meet Your Coach</span>
            <h2 className="text-3xl sm:text-5xl font-aktiv font-bold text-[#2a2019] tracking-tight">
              Watch Before You Register
            </h2>
            <p className="mt-4 text-[#2a2019]/60 font-jakarta max-w-2xl mx-auto">
              A personal message from Harsimrat — what this webinar is, who it's for, and what you'll walk away with.
            </p>
          </div>

          <PortraitVideoPlayer />
        </section>

        {/* ── 6. DYNAMIC TESTIMONIALS (VERIFIED PROOFS & VIDEO MARQUEE) ── */}
        <VerifiedProofs />
        <Testimonials />

        {/* ── 4. WHAT THIS SESSION COVERS ── */}
        <section className="bg-transparent pt-8 sm:pt-12 pb-16 sm:pb-24 border-y border-[#FF8A75]/10">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-4 block">The Curriculum</span>
              <h2 className="text-3xl sm:text-5xl font-aktiv font-bold text-[#2a2019] tracking-tight leading-tight">
                In 60 Minutes, You'll Walk Away With Things No Skincare Brand Will Ever Tell You.
              </h2>
            </div>

            <div className="space-y-6">
              {[
                { icon: '🔍', title: 'The Root Cause', desc: 'Why your skincare routine is solving the wrong problem — and the one shift that changes everything.' },
                { icon: '💪', title: 'The 57-Muscle Secret', desc: 'Your face has more muscles than any other body part, and most women have never trained a single one.' },
                { icon: '📉', title: 'Gravity vs Inactivity', desc: "The real cause of sagging skin, double chin, and jawline loss — it's not age. It's inactivity." },
                { icon: '🧬', title: 'Live Demonstration', desc: "A live demonstration of the core Face Wellness technique — you'll feel the difference during the session itself." },
                { icon: '📋', title: 'The 10-Minute Routine', desc: 'The exact 10-minute daily routine for results in 21 days — broken down step by step, live.' },
                { icon: '🎁', title: 'Free Resource', desc: 'A free take-home resource — Face Wellness Starter Guide PDF.' }
              ].map((item, i) => (
                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  key={i}
                  className="flex gap-5 sm:gap-6 p-6 sm:p-8 rounded-[2rem] bg-[#FFFAF7] border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 hover:shadow-xl hover:shadow-[#FF8A75]/5 transition-all"
                >
                  <div className="text-3xl sm:text-4xl flex-shrink-0 mt-1">{item.icon}</div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-aktiv text-[#2a2019] mb-2">{item.title}</h3>
                    <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/70 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 sm:mt-16 p-8 bg-[#1a1a1a] rounded-[2rem] text-center">
              <p className="text-white/90 font-jakarta text-lg sm:text-xl leading-relaxed italic">
                "This isn't a 60-minute sales pitch. It's a real, working session. You'll practice, you'll learn, and you'll leave with something you can use tomorrow morning."
              </p>
              <div className="mt-8">
                <Link
                  href="/webinar/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-[#FF8A75] hover:bg-[#d4603f] rounded-full transition-all shadow-lg"
                >
                  Reserve My Spot For Free
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. SOUND FAMILIAR? (PAIN POINTS ROADMAP) ── */}
        <section className="pt-2 sm:pt-4 pb-12 sm:pb-20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-4 block">The Skincare Roadmap</span>
              <h2 className="text-3xl sm:text-5xl font-aktiv font-bold text-[#2a2019] tracking-tight leading-tight">
                You've Been Doing Everything Right. So Why Isn't Your Skin Responding?
              </h2>
              <p className="mt-4 text-[#2a2019]/60 font-jakarta">
                Let's trace the journey from high-effort skincare to the actual biological solution.
              </p>
            </div>

            {/* Timeline / Roadmap Container */}
            <div className="relative">
              
              {/* Vertical line connector */}
              <div className="absolute left-[20px] md:left-1/2 top-6 bottom-6 md:top-8 md:bottom-8 w-[2px] -translate-x-[50%] bg-gradient-to-b from-[#FF8A75]/10 via-[#FF8A75]/40 to-[#e76f51]/10" />

              <div className="space-y-12 md:space-y-20">
                {/* Step 1 */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col md:flex-row items-start md:justify-between relative group"
                >
                  <div className="w-full md:w-[45%] flex flex-col pl-12 md:pl-0 md:items-end md:text-right">
                    <div className="w-full p-5 sm:p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 hover:bg-white/90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(255,138,117,0.02)] hover:shadow-[0_12px_32px_rgba(255,138,117,0.08)]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75] mb-3 bg-[#FF8A75]/10 px-3 py-1 rounded-full inline-block self-start md:self-end">Step 01</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-aktiv text-[#2a2019] mb-3">The Good Efforts</h3>
                      <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/70 leading-relaxed">
                        You drink water. You use the good serums. You get enough sleep. You've probably even tried gua sha, jade rollers, and that expensive eye cream.
                      </p>
                    </div>
                  </div>
                  
                  {/* Circle Indicator */}
                  <div className="absolute left-[20px] md:left-1/2 top-5 md:top-8 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white border border-[#FF8A75]/30 shadow-[0_4px_12px_rgba(255,138,117,0.1)] flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#FF8A75] group-hover:shadow-[0_4px_20px_rgba(255,138,117,0.25)]">
                    <span className="text-base md:text-2xl">🧴</span>
                  </div>
                  
                  <div className="hidden md:block w-[45%]" />
                </motion.div>

                {/* Step 2 */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col md:flex-row items-start md:justify-between relative group"
                >
                  <div className="hidden md:block w-[45%]" />
                  
                  {/* Circle Indicator */}
                  <div className="absolute left-[20px] md:left-1/2 top-5 md:top-8 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white border border-[#FF8A75]/30 shadow-[0_4px_12px_rgba(255,138,117,0.1)] flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#FF8A75] group-hover:shadow-[0_4px_20px_rgba(255,138,117,0.25)]">
                    <span className="text-base md:text-2xl">🥱</span>
                  </div>
                  
                  <div className="w-full md:w-[45%] flex flex-col pl-12 md:pl-0 md:items-start md:text-left">
                    <div className="w-full p-5 sm:p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 hover:bg-white/90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(255,138,117,0.02)] hover:shadow-[0_12px_32px_rgba(255,138,117,0.08)]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75] mb-3 bg-[#FF8A75]/10 px-3 py-1 rounded-full inline-block self-start">Step 02</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-aktiv text-[#2a2019] mb-3">The Missing Results</h3>
                      <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/70 leading-relaxed">
                        But every morning, the same story: fine lines, puffiness, a jawline that isn't as sharp as it used to be, and skin that just looks… tired.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col md:flex-row items-start md:justify-between relative group"
                >
                  <div className="w-full md:w-[45%] flex flex-col pl-12 md:pl-0 md:items-end md:text-right">
                    <div className="w-full p-5 sm:p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#e76f51]/10 hover:border-[#e76f51]/30 hover:bg-white/90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(231,111,81,0.02)] hover:shadow-[0_12px_32px_rgba(231,111,81,0.08)]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#e76f51] mb-3 bg-[#e76f51]/10 px-3 py-1 rounded-full inline-block self-start md:self-end">Step 03</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-aktiv text-[#e76f51] mb-3">The Skincare Trap</h3>
                      <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/70 leading-relaxed">
                        Here's what nobody in the skincare industry wants you to know: <strong className="font-bold text-[#e76f51]">You can't cream your way to a lifted face.</strong> No serum addresses that. No facial addresses that.
                      </p>
                    </div>
                  </div>
                  
                  {/* Circle Indicator */}
                  <div className="absolute left-[20px] md:left-1/2 top-5 md:top-8 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white border border-[#e76f51]/30 shadow-[0_4px_12px_rgba(231,111,81,0.1)] flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#e76f51] group-hover:shadow-[0_4px_20px_rgba(231,111,81,0.25)]">
                    <span className="text-base md:text-2xl">🚫</span>
                  </div>
                  
                  <div className="hidden md:block w-[45%]" />
                </motion.div>

                {/* Step 4 */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col md:flex-row items-start md:justify-between relative group"
                >
                  <div className="hidden md:block w-[45%]" />
                  
                  {/* Circle Indicator */}
                  <div className="absolute left-[20px] md:left-1/2 top-5 md:top-8 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white border border-[#FF8A75]/30 shadow-[0_4px_12px_rgba(255,138,117,0.1)] flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#FF8A75] group-hover:shadow-[0_4px_20px_rgba(255,138,117,0.25)]">
                    <span className="text-base md:text-2xl">💪</span>
                  </div>
                  
                  <div className="w-full md:w-[45%] flex flex-col pl-12 md:pl-0 md:items-start md:text-left">
                    <div className="w-full p-5 sm:p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#FF8A75]/10 hover:border-[#FF8A75]/30 hover:bg-white/90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(255,138,117,0.02)] hover:shadow-[0_12px_32px_rgba(255,138,117,0.08)]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75] mb-3 bg-[#FF8A75]/10 px-3 py-1 rounded-full inline-block self-start">Step 04</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-aktiv text-[#2a2019] mb-3">The 57-Muscle Anatomy</h3>
                      <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/70 leading-relaxed">
                        Your face has 57 muscles. Those muscles hold your skin up. When they weaken — which happens naturally with age, stress, and screen time — your skin loses its structure and starts to sag.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 5 */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col md:flex-row items-start md:justify-between relative group"
                >
                  <div className="w-full md:w-[45%] flex flex-col pl-12 md:pl-0 md:items-end md:text-right">
                    <div className="w-full p-5 sm:p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#006B57]/10 hover:border-[#006B57]/30 hover:bg-white/90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,107,87,0.02)] hover:shadow-[0_12px_32px_rgba(0,107,87,0.08)]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#006B57] mb-3 bg-[#006B57]/10 px-3 py-1 rounded-full inline-block self-start md:self-end">Step 05</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-aktiv text-[#006B57] mb-3">The 10-Minute Formula</h3>
                      <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/70 leading-relaxed">
                        What you need is 10 minutes a day and the right technique. That's exactly what this webinar will give you. And you certainly don't need surgery for that.
                      </p>
                    </div>
                  </div>
                  
                  {/* Circle Indicator */}
                  <div className="absolute left-[20px] md:left-1/2 top-5 md:top-8 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white border border-[#006B57]/30 shadow-[0_4px_12px_rgba(0,107,87,0.1)] flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#006B57] group-hover:shadow-[0_4px_20px_rgba(0,107,87,0.25)]">
                    <span className="text-base md:text-2xl">⏱️</span>
                  </div>
                  
                  <div className="hidden md:block w-[45%]" />
                </motion.div>
              </div>

            </div>
          </div>
        </section>



        {/* ── 7. IS THIS FOR ME? ── */}
        <section className="pt-12 sm:pt-20 pb-8 sm:pb-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8 md:gap-20">
              <div>
                <h2 className="text-3xl sm:text-4xl font-aktiv font-bold text-[#2a2019] mb-8">This Webinar Is For You If...</h2>
                <ul className="space-y-4">
                  {[
                    "You're tired of skincare products that promise results and deliver nothing",
                    "You've noticed changes in your face — sagging, puffiness, loss of jawline definition",
                    "You've heard of face yoga but never had a structured, expert-led introduction",
                    "You want a non-invasive approach — no procedures, no tools, no expensive products",
                    "You're a complete beginner — no yoga, no fitness experience needed",
                    "You're in your 20s catching early signs, or in your 50s thinking it's too late (it isn't)"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-jakarta text-[#2a2019]/80 text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-aktiv font-bold text-[#2a2019] mb-8">This Is NOT For You If...</h2>
                <ul className="space-y-4">
                  {[
                    "You're looking for a quick fix with zero effort",
                    "You're not willing to invest 10 minutes a day in yourself",
                    "You want a medical or surgical procedure"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
                      <X className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      <span className="font-jakarta text-[#2a2019]/80 text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-8 bg-[#FFFAF7] rounded-3xl border border-[#FF8A75]/20 text-center">
                  <h3 className="font-aktiv font-bold text-xl text-[#2a2019] mb-4">If You're Still Reading...</h3>
                  <Link
                    href="/webinar/register"
                    className="inline-flex w-full items-center justify-center px-6 py-4 text-sm font-black uppercase tracking-widest text-white bg-[#e76f51] hover:bg-[#d4603f] rounded-full transition-all shadow-md"
                  >
                    Reserve Your Free Spot
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── 9. HOW IT WORKS ── */}
        <section className="pt-10 sm:pt-12 pb-10 sm:pb-12 relative">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-4 block">How It Works</span>
              <h2 className="text-3xl sm:text-5xl font-aktiv font-bold text-[#2a2019] tracking-tight mb-4">
                Takes 30 Seconds to Register.<br />Results Last a Lifetime.
              </h2>
            </div>

            <div className="space-y-8 sm:space-y-12">
              {[
                { step: '1', title: "Join the Exclusive WhatsApp Group", desc: "Click the button below to join our free community group where we share the live Zoom links every weekend." },
                { step: '2', title: "Show Up Live This Weekend", desc: "Join from your phone or laptop. No equipment needed — just a mirror and 60 minutes for yourself." },
                { step: '3', title: "Practice What You Learn", desc: "Walk away with a real technique and a daily routine you can start the very next morning." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 sm:gap-8 items-start">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#FF8A75] text-white flex items-center justify-center font-aktiv font-bold text-xl sm:text-2xl shadow-lg shadow-[#FF8A75]/30 shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-2 sm:pt-4">
                    <h3 className="text-xl sm:text-2xl font-bold font-aktiv text-[#2a2019] mb-2">{item.title}</h3>
                    <p className="text-sm sm:text-base font-jakarta text-[#2a2019]/60 leading-relaxed max-w-lg">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. WHY FACEYOGUEZ? (Comparison Component) ── */}
        <WhyUs />

        {/* ── 11. FAQ ── */}
        <section className="bg-transparent pt-6 sm:pt-8 pb-16 sm:pb-24 border-t border-[#FF8A75]/10">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-aktiv font-bold text-[#2a2019] tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {[
                { q: "Is this webinar really free? What's the catch?", a: "Completely free. No credit card, no hidden charges. We run this every weekend because we know that once you experience Face Wellness live — even for 60 minutes — you'll understand why 2,000+ women have made it a daily practice." },
                { q: "I've never done face yoga before. Is that okay?", a: "That's actually ideal. Untrained facial muscles respond very quickly. Harsimrat designs the session for complete beginners — no experience required." },
                { q: "I'm in my 40s/50s. Is it too late?", a: "It's never too late. Some of the most dramatic transformations in Harsimrat's community are women in their late 40s and 50s. Facial muscles respond to training at every age." },
                { q: "Will there be a recording if I miss it?", a: "This session is live-only to keep the practice experience real and interactive. A new session runs every weekend — simply join the group to get the next date's link." },
                { q: "Will I be asked to buy something?", a: "At the end of the session, Harsimrat will share how you can go deeper through her structured courses. There's no pressure. The webinar delivers complete value on its own." }
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-[#FFFAF7] border border-[#FF8A75]/10">
                  <h4 className="font-aktiv font-bold text-lg text-[#2a2019] mb-3">{faq.q}</h4>
                  <p className="font-jakarta text-sm text-[#2a2019]/70 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. FINAL CTA ── */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl sm:text-6xl font-aktiv font-bold text-[#2a2019] tracking-tight mb-6 sm:mb-8">
              One Hour This Weekend Could Change the Way You See Your Face — Forever.
            </h2>
            <p className="text-lg font-jakarta text-[#2a2019]/60 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-12">
              Harsimrat has helped 2,000+ women stop fighting their reflection and start training it. The webinar is free. The practice is real. Don't let another weekend pass.
            </p>
            <Link
              href="/webinar/register"
              className="inline-flex items-center justify-center px-10 py-6 text-base sm:text-lg font-black uppercase tracking-widest text-white bg-[#1a1a1a] hover:bg-[#FF8A75] rounded-full transition-all shadow-2xl hover:shadow-[#FF8A75]/40 hover:-translate-y-2 w-full sm:w-auto"
            >
              🌸 Register For Free Now →
            </Link>
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-[11px] font-black uppercase tracking-widest text-[#2a2019]/40">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF8A75]" /> 2,000+ Clients</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-[#FF8A75]" /> 1.99L+ Community</span>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-transparent py-12 border-t border-[#FF8A75]/10 text-center relative z-10">
        <p className="text-sm font-aktiv font-bold text-[#2a2019] mb-4">Train your face. Love your reflection.</p>
        <div className="flex justify-center gap-6 text-[11px] font-medium uppercase tracking-widest text-[#2a2019]/40">
          <a href="mailto:support@faceyoguez.com" className="hover:text-[#FF8A75]">support@faceyoguez.com</a>
          <a href="https://instagram.com/faceyoguez" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF8A75]">@faceyoguez on Instagram</a>
        </div>
      </footer>
    </div>
  );
}
