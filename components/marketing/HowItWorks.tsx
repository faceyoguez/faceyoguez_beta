'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const steps = [
  {
    number: '01',
    title: 'Book Your Free Trial',
    body: 'Pick a time that works for you. No payment, no pressure. Just show up. Takes 60 seconds to book.',
    note: 'No credit card needed',
  },
  {
    number: '02',
    title: 'Meet Harsimrat',
    body: 'Your first class is about understanding your face, your lifestyle, and your goals. We don\'t give everyone the same routine.',
    note: 'Personalised from day one',
  },
  {
    number: '03',
    title: 'Build Your 10-Minute Daily Practice',
    body: 'Simple, specific exercises you can do at home — morning routine, no equipment needed.',
    note: 'No gym. No tools. Just your hands.',
  },
  {
    number: '04',
    title: 'See the Change — Week by Week',
    body: 'Week 2: Skin feels firmer. Week 4: Jawline more defined. Week 6: People start asking what you\'re doing differently.',
    note: 'Most clients see results within 21 days',
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="relative py-24 md:py-36 overflow-hidden bg-transparent">
      {/* Soft glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[#e76f51]/4 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center mb-20 space-y-6"
        >
          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">The Process</span>
            <div className="w-12 h-[1px] bg-[#e76f51]/20" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-tight tracking-tight">
            From First Class to First Result —<br className="hidden md:block" />
            <span className="italic font-light opacity-60"> Here's What to Expect</span>
          </motion.h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="relative"
        >
          {/* Vertical connecting line — desktop only */}
          <div className="hidden md:block absolute left-[2.65rem] top-10 bottom-10 w-px bg-gradient-to-b from-[#e76f51]/30 via-[#e76f51]/10 to-transparent pointer-events-none" />

          <div className="space-y-10 md:space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                className="flex gap-6 md:gap-10 items-start group"
              >
                {/* Step number circle */}
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border-2 border-[#e76f51]/20 flex items-center justify-center shadow-sm group-hover:border-[#e76f51]/60 transition-colors duration-300 relative z-10">
                  <span className="text-[13px] font-black text-[#e76f51] tracking-wide">{step.number}</span>
                </div>

                {/* Content */}
                <div className="flex-1 pb-2 pt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-aktiv font-bold text-[#2a2019]">{step.title}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-[#e76f51]/8 text-[9px] font-black uppercase tracking-widest text-[#e76f51]">{step.note}</span>
                  </div>
                  <p className="text-sm md:text-base font-jakarta text-slate-500 leading-relaxed max-w-xl">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          className="mt-20 text-center"
        >
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#e76f51] text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#d4603f] transition-all shadow-[0_12px_32px_rgba(231,111,81,0.3)] hover:scale-105 active:scale-95"
          >
            Begin Step 1 Right Now → Book Your Free Trial
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
