'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

const HERO_IMAGE = '/assets/instructor_img.jpg';


interface HeroProps {
  visible: boolean;
}

export function Hero({ visible }: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!visible) return null;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full min-h-[100dvh] flex flex-col overflow-x-hidden"
    >


      {/* Premium Floating Nav */}
      <motion.nav variants={itemVariants} className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] z-[100]">
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(255,138,117,0.06)]">
          <div className="font-sooner text-xl sm:text-3xl font-bold text-[#2a2019] leading-none flex items-center tracking-tight">
            faceyoguez
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/auth/login" className="hidden sm:flex text-xs sm:text-sm font-black uppercase tracking-widest text-[#2a2019]/60 hover:text-[#e76f51] transition-colors leading-none items-center">
              Login
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center justify-center px-6 py-3 bg-[#1a1a1a] text-white rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#e76f51] transition-all shadow-md active:scale-95 leading-none">
              Book Free Trial
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div className={`flex-1 flex ${isMobile ? 'flex-col-reverse pt-28 pb-12 px-6' : 'lg:flex-row items-center px-[6vw] pt-20 flex-col'}`}>

        {/* Headline Column */}
        <div className={`relative z-10 ${isMobile ? 'text-center mb-10' : 'flex-1 lg:text-left text-left'}`}>

          {/* H1 */}
          <motion.h1
            variants={itemVariants}
            className={`font-aktiv leading-[1.08] text-[#2a2019] font-bold ${isMobile ? 'text-[1.85rem] mb-5' : 'text-[clamp(2rem,3.2vw,3.4rem)] mb-5'}`}
          >
            Your Face Can Lift,<br />
            Glow &amp; Tone —<br />
            <span className="italic font-light opacity-70">Without Creams, Needles,<br className="hidden md:block" /> or Surgery.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className={`font-jakarta text-[#2a2019]/60 max-w-[490px] leading-relaxed ${isMobile ? 'mx-auto text-sm mb-3' : 'text-base mb-3'}`}
          >
            Join the community of Indian women who've discovered the power of Face Wellness — a 10-minute daily practice that visibly tightens, brightens, and lifts your face. Naturally.
          </motion.p>

          {/* Supporting Line */}
          <motion.p
            variants={itemVariants}
            className={`font-jakarta font-semibold text-[#2a2019]/80 max-w-[490px] leading-relaxed ${isMobile ? 'mx-auto text-xs mb-8' : 'text-sm mb-8'}`}
          >
            Expert-led. Results in 21 days — or we'll work with you until you see them.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className={`flex flex-col sm:flex-row gap-4 mb-4 ${isMobile ? 'items-center' : ''}`}>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e76f51] text-white rounded-full text-[11px] font-black uppercase tracking-[0.25em] hover:bg-[#d4603f] transition-all shadow-[0_12px_32px_rgba(231,111,81,0.35)] hover:scale-105 active:scale-95"
            >
              🌸 Book Your FREE Trial Class →
            </Link>
          </motion.div>
        </div>

        {/* Visual Column */}
        <motion.div
          variants={itemVariants}
          className={`relative flex justify-center items-center ${isMobile ? 'w-full aspect-[4/5] mb-12' : 'flex-[0.9] h-[72vh]'}`}
        >
          <div className="relative w-full h-full max-w-[480px]">
            {/* Organic Blob Border */}
            <div
              className="absolute inset-0 z-0 animate-morph border-[1.5px] border-[#2a2019]/20"
              style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
            />

            {/* Image Masked */}
            <div
              className="absolute inset-2 z-10 overflow-hidden bg-slate-100 shadow-2xl animate-morph"
              style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
            >
              <img
                src={HERO_IMAGE}
                alt="Face Wellness with Harsimrat"
                className="w-full h-full object-cover object-center scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2019]/20 to-transparent pointer-events-none" />
            </div>

            {/* Floating Pills */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 z-20 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                <span className="text-[10px] font-bold text-[#2a2019] tracking-wider uppercase">21-Day Results</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-10 -left-6 z-20 px-5 py-3 bg-white/40 backdrop-blur-xl rounded-full shadow-2xl border border-white/20"
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#e76f51] uppercase tracking-[0.2em] mb-0.5">Community</span>
                <span className="text-xs font-bold text-[#2a2019]">Radiant Women Community</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Global CSS for Morphing Animation */}
      <style jsx global>{`
        @keyframes morph {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        .animate-morph {
          animation: morph 8s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
}
