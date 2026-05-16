'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, Variants } from 'framer-motion';
import { Heart, Instagram, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const INSTRUCTOR_IMAGE = '/assets/hero_v2.jpg';
// const INSTRUCTOR_IMAGE = '/assets/instructor_img.jpg';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Instructor() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-40 overflow-hidden bg-transparent"
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[#FF8A75]/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Visual Portrait */}
          <div className="lg:col-span-4 relative group">
            <motion.div
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              className="relative"
            >
              {/* Premium Frame */}
              <div className="relative rounded-[2rem] md:rounded-[4rem] overflow-hidden aspect-[4/5] shadow-[0_40px_80px_rgba(42,32,25,0.12)]">
                <img
                  src={INSTRUCTOR_IMAGE}
                  alt="Harsimrat"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#FF8A75]/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#bc162d]/5 rounded-full blur-3xl" />
            </motion.div>
          </div>

          {/* Right Column: Narrative Copy */}
          <div className="lg:col-span-8">
            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="space-y-10"
            >
              {/* Tagline */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="inline-flex flex-col items-start gap-3">
                   <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">Your Coach</span>
                   <div className="w-12 h-[1px] bg-[#e76f51]/20" />
                </div>
                <h2 className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-[1.05] tracking-tight">
                  Hi, I'm Harsimrat — <br className="hidden md:block" /> 
                  and I'm <span className="italic font-light opacity-60">Obsessed</span> with Your Face.
                </h2>
                <p className="text-base md:text-lg font-sooner italic text-[#2a2019]/40">(In a good way.)</p>
              </motion.div>

              {/* Main Body Narrative */}
              <motion.div variants={fadeUp} className="space-y-6 text-sm md:text-base text-slate-600/80 font-jakarta leading-relaxed">
                <p>
                  I'm not a doctor. I'm not a skincare influencer pushing the latest serum. 
                  I'm a <span className="text-[#2a2019] font-semibold">Face Wellness Coach</span> who genuinely believes that the best version of your face is already inside you — it just needs to be activated.
                </p>
                <p>
                  I've trained <span className="text-[#e76f51] font-bold">thousands of women</span> across India, built a massive community of <span className="text-[#e76f51] font-bold">dedicated practitioners</span> on Instagram, 
                  and spent years refining a method that is <span className="text-[#2a2019] font-semibold">gentle, effective, and built for real life</span> — not a 90-minute spa session you can't afford every week.
                </p>
                <p>
                  My clients range from 25-year-olds dealing with early signs of ageing to 55-year-olds who thought it was "too late." It's never too late.
                </p>
                <p className="text-[#2a2019] font-bold text-base md:text-lg leading-snug">
                  "The results I've seen — and the transformations I've been a part of — are why I wake up every morning and do this."
                </p>
              </motion.div>

              {/* Call to Action */}
              <motion.div variants={fadeUp} className="pt-6 flex flex-col sm:flex-row items-center gap-8">
                <Link href="/auth/signup" className="w-full sm:w-auto px-10 py-5 bg-[#1a1a1a] text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#e76f51] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center">
                  Join a Class
                </Link>
                <div className="flex items-center gap-4 text-[#2a2019]/40">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">See for yourself.</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
