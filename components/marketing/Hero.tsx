'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

const HERO_IMAGE = '/assets/hero.jpg';

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
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.2 
      }
    }
  };
 
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }
    }
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full min-h-[100dvh] flex flex-col overflow-x-hidden"
    >
      {/* Shifting Radial Gradient Background */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, #fffbf5 0%, #faf7f2 50%, #fffcf2 100%)',
            'radial-gradient(circle at 100% 100%, #fffcf2 0%, #f5efe6 50%, #fdfcf0 100%)',
            'radial-gradient(circle at 0% 100%, #fdfcf0 0%, #faf7f2 50%, #fffcf2 100%)',
            'radial-gradient(circle at 0% 0%, #fffbf5 0%, #faf7f2 50%, #fffcf2 100%)',
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 -z-10 opacity-60"
      />
      {/* Premium Floating Nav */}
      <motion.nav
        variants={itemVariants}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] z-[100]"
      >
        <div className="flex items-center justify-between px-6 py-4 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(255,138,117,0.08)]">
          <div className="font-serif text-xl sm:text-2xl font-bold text-[#2a2019] italic leading-none flex items-center">
            faceyoguez
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/auth/login" className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#2a2019]/60 hover:text-[#e76f51] transition-colors leading-none flex items-center">
              Login
            </Link>
            <Link href="/auth/signup" className="px-5 py-3 bg-[#1a1a1a] text-white rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#e76f51] transition-all shadow-md active:scale-95 leading-none flex items-center">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'pt-32 pb-12 px-6' : 'lg:flex-row items-center px-[6vw] pt-20'}`}>

        {/* Headline Column */}
        <div className={`relative z-10 ${isMobile ? 'text-center mb-12' : 'flex-1 lg:text-left text-left'}`}>
          <motion.div variants={itemVariants} className="inline-block px-3 py-1 mb-6 rounded-full bg-[#FF8A75]/10 border border-[#FF8A75]/20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e76f51]">Digital Sanctuary</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className={`font-serif leading-[1.05] text-[#2a2019] ${isMobile ? 'text-[2.8rem] mb-6' : 'text-header lg:text-[5.5rem] mb-8'}`}
          >
            Restore your glow, <br />
            <span className="italic font-light opacity-80">breathe by breath.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className={`font-sans tracking-tight text-[#2a2019]/60 max-w-[500px] leading-relaxed ${isMobile ? 'mx-auto text-sm' : 'text-lg text-left'}`}
          >
            Authentic face yoga helps you reclaim your natural radiance by releasing tension,
            sculpting contours, and inducing deep relaxation.
          </motion.p>
        </div>

        {/* Visual Column */}
        <motion.div
          variants={itemVariants}
          className={`relative flex justify-center items-center ${isMobile ? 'w-full aspect-[4/5]' : 'flex-[0.9] h-[75vh]'}`}
        >
          {/* Main Image Container with Blob Shape */}
          <div className="relative w-full h-full max-w-[500px]">
            {/* Organic Blob Border */}
            <div
              className="absolute inset-0 z-0 animate-morph border-[1.5px] border-[#2a2019]/20"
              style={{
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
              }}
            />

            {/* Image Masked */}
            <div
              className="absolute inset-2 z-10 overflow-hidden bg-slate-100 shadow-2xl animate-morph"
              style={{
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
              }}
            >
              <img
                src={HERO_IMAGE}
                alt="Radiant face yoga"
                className="w-full h-full object-cover object-center scale-110"
              />

              {/* Glass Overlay on Image */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2019]/20 to-transparent pointer-events-none" />
            </div>

            {/* Floating Micro-UI Pills */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 z-20 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                <span className="text-[10px] font-bold text-[#2a2019] tracking-wider uppercase">Luminous Ritual</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-10 -left-6 z-20 px-5 py-3 bg-white/40 backdrop-blur-xl rounded-full shadow-2xl border border-white/20"
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#e76f51] uppercase tracking-[0.2em] mb-0.5">Community</span>
                <span className="text-xs font-bold text-[#2a2019]">3,412 Radiant students</span>
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
