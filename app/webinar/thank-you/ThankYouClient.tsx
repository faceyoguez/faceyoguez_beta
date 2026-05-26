'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';
import * as pixel from '@/lib/pixel';

interface ThankYouClientProps {
  whatsappLink: string;
}

export function ThankYouClient({ whatsappLink }: ThankYouClientProps) {
  const [countdown, setCountdown] = useState(5);
  const targetLink = whatsappLink || '#';

  useEffect(() => {
    // ── Load Newsreader font for premium serif titles ─────────────────
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // ── Pixel: WebinarLead — user completed the full registration funnel ───
    pixel.custom('WebinarLead', {
      content_name: 'Free Webinar',
      source: 'webinar_thank_you',
      funnel_stage: 'registration_complete',
    });

    // ── Countdown Timer & Redirect ─────────────────────────────────────
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = targetLink;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetLink]);

  // ── Pixel: WhatsApp Join Clicked (manual button) ────────────────────
  const handleWhatsAppJoin = () => {
    pixel.custom('WhatsAppJoinClicked', {
      source: 'webinar_thank_you',
      content_name: 'Free Webinar WhatsApp Group',
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1a1a1a] font-jakarta overflow-x-hidden relative selection:bg-[#FF8A75]/20 selection:text-[#FF8A75] flex flex-col justify-between">
      <LuxuryBackground />

      {/* Simplified Navbar */}
      <nav className="w-full max-w-5xl mx-auto px-6 py-4 sm:py-5 flex items-center justify-between relative z-50">
        <div className="font-sooner text-lg sm:text-xl font-bold text-[#2a2019] tracking-tight">
          faceyoguez
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-4 sm:py-8 relative z-10">
        {/* Decorative blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#e76f51]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f4a261]/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="w-full max-w-[450px] bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 sm:p-8 shadow-[0_15px_30px_rgba(163,61,35,0.03)] text-center relative overflow-hidden"
        >
          {/* Sparkles Icon Container */}
          <div className="flex justify-center mb-4.5">
            <div className="relative">
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#e76f51] to-[#f4a261] flex items-center justify-center text-white shadow-lg shadow-[#e76f51]/20">
                <Sparkles className="w-6.5 h-6.5 sm:w-8 sm:h-8" />
              </div>
              <div className="absolute inset-0 rounded-full border border-[#e76f51]/20 animate-ping pointer-events-none" />
            </div>
          </div>

          {/* Heading & Message */}
          <div className="space-y-1.5 sm:space-y-2 mb-4.5">
            <h1
              className="text-xl sm:text-2xl text-[#2a2019] tracking-tight font-medium"
              style={{ fontFamily: "'Newsreader', serif" }}
            >
              You're Registered!
            </h1>
            <p className="text-xs sm:text-[13px] text-[#2a2019]/70 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
              Your spot for the free Live Face Wellness webinar is officially locked in. Get ready to learn techniques that will transform your skin.
            </p>
          </div>

          <div className="pt-0.5 pb-3">
            <div className="h-0.5 w-12 bg-gradient-to-r from-[#e76f51] to-[#f4a261] mx-auto rounded-full opacity-30" />
          </div>

          {/* Redirection Alert & Countdown */}
          <div className="bg-[#FFFAF7] border border-[#FF8A75]/10 rounded-2xl p-4.5 sm:p-5 mb-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[9.5px] font-bold uppercase tracking-widest text-[#FF8A75]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8A75] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF8A75]"></span>
              </span>
              Redirecting to WhatsApp Community
            </div>
            
            <div className="text-4xl sm:text-5xl font-black text-[#e76f51] tracking-tight font-sans">
              {countdown}s
            </div>

            <p className="text-[9.5px] sm:text-[10px] text-[#2a2019]/50 font-semibold leading-normal">
              We share Zoom access links, reminders, and class resources in the WhatsApp group. If the countdown ends and you are not redirected, tap below:
            </p>

            {/* Manual Action Button */}
            <a
              href={targetLink}
              onClick={handleWhatsAppJoin}
              className="group inline-flex items-center justify-center gap-1.5 px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-[0.15em] text-white bg-[#e76f51] hover:bg-[#d4603f] rounded-full transition-all shadow-md active:scale-95 w-full"
            >
              Join WhatsApp Group Manually
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-1 text-[9.5px] text-[#2a2019]/40 font-bold uppercase tracking-widest">
            <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" /> See you in the live session
          </div>

          {/* Bottom gradient strip */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e76f51] via-[#f4a261] to-[#e76f51]" />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3.5 text-center text-[9px] text-[#2a2019]/40 border-t border-[#FF8A75]/5 relative z-50">
        &copy; {new Date().getFullYear()} faceyoguez. All rights reserved.
      </footer>
    </div>
  );
}
