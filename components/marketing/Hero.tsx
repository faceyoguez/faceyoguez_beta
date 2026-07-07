'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { pixel } from '@/lib/pixel';

const HERO_IMAGE = '/assets/instructor_img.jpg';

// Module-level constants — framer-motion needs stable object references
// to correctly diff initial vs animate states across re-renders.
// Defining these inside the component body causes them to be recreated
// on every render, which breaks the initial → animate transition.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

interface HeroProps {
  visible: boolean;
}

export function Hero({ visible }: HeroProps) {
  // ALL hooks must be called before any conditional return (React rules of hooks)
  const router = useRouter();

  // onTouchStart fires ~300ms before onClick on mobile — gives instant response
  const handleLoginTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setTimeout(() => pixel.heroCtaClicked({ buttonLabel: 'Login' }), 0);
    router.push('/auth/login');
  };

  const handleSignupTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setTimeout(() => pixel.heroCtaClicked({ buttonLabel: 'Get Started' }), 0);
    router.push('/auth/signup');
  };

  const handleBookTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setTimeout(() => pixel.heroCtaClicked({ buttonLabel: 'Book Your Class' }), 0);
    router.push('/auth/signup');
  };

  if (!visible) return null;

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full min-h-[100dvh] flex flex-col overflow-x-hidden"
    >
      {/* Premium Floating Nav */}
      <motion.nav
        variants={itemVariants}
        className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[94%] sm:w-[85%] z-[100] will-change-transform"
      >
        <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4 rounded-full bg-white/60 sm:bg-white/40 backdrop-blur-lg sm:backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(255,138,117,0.04)] will-change-[backdrop-filter]">
          <div className="font-sooner text-xl sm:text-3xl font-bold text-[#2a2019] leading-none flex items-center tracking-tight">
            faceyoguez
          </div>

          <div className="flex items-center gap-2 sm:gap-8" style={{ touchAction: 'manipulation' }}>
            {/* Login — onTouchStart fires ~300ms earlier than onClick on mobile */}
            <button
              onTouchStart={handleLoginTouch}
              onClick={() => {
                setTimeout(() => pixel.heroCtaClicked({ buttonLabel: 'Login' }), 0);
                router.push('/auth/login');
              }}
              className="flex text-xs sm:text-sm font-black uppercase tracking-widest text-[#2a2019]/60 hover:text-[#e76f51] active:scale-95 transition-all duration-150 leading-none items-center py-2 px-3 rounded-lg"
              style={{ touchAction: 'manipulation', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Login
            </button>
            <button
              onTouchStart={handleSignupTouch}
              onClick={() => {
                setTimeout(() => pixel.heroCtaClicked({ buttonLabel: 'Get Started' }), 0);
                router.push('/auth/signup');
              }}
              className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 bg-[#1a1a1a] text-white rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#e76f51] transition-all duration-150 shadow-md active:scale-95 leading-none"
              style={{ touchAction: 'manipulation', border: 'none', cursor: 'pointer' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col-reverse pt-28 pb-12 px-6 lg:flex-row lg:items-center lg:px-[6vw] lg:pt-10">

        {/* Headline Column */}
        <div className="relative z-10 text-center mb-10 flex-1 lg:text-left">

          {/* H1 */}
          <motion.h1
            variants={itemVariants}
            className="font-aktiv leading-[1.08] text-[#2a2019] font-bold text-[1.85rem] lg:text-[clamp(2rem,3.2vw,3.4rem)] mb-5"
          >
            Your Face Can Lift,<br />
            Glow &amp; Tone —<br />
            <span className="italic font-light opacity-70">Without Creams, Needles,<br className="hidden md:block" /> or Surgery.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="font-jakarta text-[#2a2019]/60 max-w-[490px] leading-relaxed mx-auto lg:mx-0 text-sm lg:text-base mb-3"
          >
            Join the community of Indian women who've discovered the power of Face Wellness — a 10-minute daily practice that visibly tightens, brightens, and lifts your face. Naturally.
          </motion.p>

          {/* Supporting Line */}
          <motion.p
            variants={itemVariants}
            className="font-jakarta font-semibold text-[#2a2019]/80 max-w-[490px] leading-relaxed mx-auto lg:mx-0 text-xs lg:text-sm mb-8"
          >
            Expert-led. Results in 21 days — or we'll work with you until you see them.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-4 items-center lg:items-start">
            <button
              onTouchStart={handleBookTouch}
              onClick={() => {
                pixel.heroCtaClicked({ buttonLabel: 'Book Your Class' });
                router.push('/auth/signup');
              }}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e76f51] text-white rounded-full text-[11px] font-black uppercase tracking-[0.25em] hover:bg-[#d4603f] transition-all shadow-[0_12px_32px_rgba(231,111,81,0.35)] hover:scale-105 active:scale-95"
              style={{ touchAction: 'manipulation', border: 'none', cursor: 'pointer' }}
            >
              🌸 Book Your Class →
            </button>
          </motion.div>
        </div>

        {/* Visual Column */}
        <motion.div
          variants={itemVariants}
          className="relative flex justify-center items-center w-full aspect-[4/5] mb-12 lg:flex-[0.9] lg:h-[72vh] lg:aspect-auto lg:mb-0"
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
              <Image
                src={HERO_IMAGE}
                alt="Face Wellness with Harsimrat"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover object-center scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2019]/20 to-transparent pointer-events-none" />
            </div>

            {/* Floating Pills — hidden on mobile to avoid infinite animation CPU cost */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:block absolute -top-4 -right-4 z-20 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                <span className="text-[10px] font-bold text-[#2a2019] tracking-wider uppercase">21-Day Results</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="hidden sm:block absolute bottom-10 -left-6 z-20 px-5 py-3 bg-white/40 backdrop-blur-xl rounded-full shadow-2xl border border-white/20"
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
