'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { User, Users, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trackConversionEvent } from '@/lib/conversionTracking';
import { pixel } from '@/lib/pixel';

const PLANS_PREVIEW: any[] = [
  {
    id: 'one_on_one',
    title: '1-on-1 Personal Coaching',
    titleSmall: 'Personalised plan',
    subtitle: '',
    desc: 'The fastest way to see results. A programme built entirely around your face, your skin type, and your goals.',
    highlight: 'EXCLUSIVE PLAN FOR VERY FEW',
    worksBestWith: 'Sagging, premature ageing, Double chin, Dullness, Wrinkles & Fine lines + many more',
    icon: User,
    features: [
      'Products recommendation as per your skintype',
      'identify root cause of problem & provide solution',
      'personalised plan as per your concern',
      '3 type of Progress tracker for best Results',
      'Limited openings every month'
    ],
    accent: '#e76f51',
    cta: 'Apply for 1-on-1'
  },
  {
    id: 'lms',
    title: 'Transformation plan',
    titleSmall: 'recorded plan with lifetime access',
    subtitle: '',
    desc: 'Master the techniques at your own pace. Perfect for busy schedules and those who want to learn on their own time.',
    icon: BookOpen,
    features: [
      'Step-by-Step Modules',
      'Lifetime Access',
      'Do it anytime, anywhere as per your convenience',
      'Best for beginners',
      'Photos progress tracker'
    ],
    worksBestWith: 'Improve in glow, dullness, Dark circles, eyebrow lifting & sculpted face + many more',
    accent: '#e76f51',
    cta: 'TRY YOUR FIRST FREE SESSION'
  },
  {
    id: 'group_session',
    title: 'Transformation plan',
    titleSmall: 'Daily Live sessions + Recordings also available',
    subtitle: '',
    desc: 'Our most popular programme. Join a batch of like-minded women and build a habit that lasts a lifetime.',
    icon: Users,
    features: [
      'Live Daily Practice',
      'Shared Progress',
      'Community Support',
      'Expert Guidance',
      'Progress Tracking',
      '1 or 3 months option'
    ],
    worksBestWith: 'Dark circles, Double chin, Smile lines, Fine lines, Sagging, Dullness + many more',
    accent: '#e76f51',
    popular: true,
    cta: 'book your slot today ( only for limited people )'
  }
];

export function Plans() {
  const router = useRouter();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section
      id="plans-overview"
      className="px-6 md:px-12 py-12 md:py-8 relative overflow-hidden bg-transparent"
    >
      {/* Subtle Glows */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#e76f51]/4 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-[#e76f51]/3 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10" ref={containerRef}>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={itemVariants}
          className="text-center mb-20 space-y-6"
        >
          <div className="inline-flex flex-col items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">Offerings</span>
            <div className="w-12 h-[1px] bg-[#e76f51]/20" />
          </div>

          <h2 className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-tight tracking-tight">
            Choose Your Path to <br className="hidden md:block" />
            <span className="italic font-light opacity-60"> Radiant Skin</span>
          </h2>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600/80 font-jakarta leading-relaxed">
            Whether you seek a complete 1-on-1 transformation or the energy of a community, we have a programme built for you.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {PLANS_PREVIEW.map((plan) => (
            <motion.div
              key={plan.id}
              variants={itemVariants}
              onClick={() => {
                pixel.planCardClicked({ planId: plan.id, planTitle: plan.title });
                if (plan.id === 'group_session') {
                  window.location.href = 'https://www.faceyoguez.com/plans/live-group';
                  return;
                }
                if (plan.id === 'one_on_one') {
                  window.location.href = 'https://www.faceyoguez.com/plans/personal-classes';
                  return;
                }
                if (plan.id === 'lms') {
                  window.location.href = 'https://www.faceyoguez.com/plans/personal-classes';
                  return;
                }
                
                window.location.href = '/auth/signup';
              }}
              className={`group p-6 md:p-8 rounded-[2rem] transition-all duration-500 relative cursor-pointer flex flex-col border ${plan.popular
                  ? 'bg-white border-[#e76f51]/20 shadow-[0_32px_80px_rgba(231,111,81,0.08)]'
                  : 'bg-white/70 border-[#e76f51]/5 hover:border-[#e76f51]/20 hover:bg-white hover:shadow-[0_20px_50px_rgba(231,111,81,0.05)]'
                }`}
            >


              <div className="space-y-6 flex-1">
                <div className="space-y-3">
                  {plan.subtitle && (
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e76f51]/60">
                      {plan.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-[8deg] ${plan.popular ? 'bg-[#e76f51]/10 text-[#e76f51]' : 'bg-[#e76f51]/5 text-[#e76f51]/40 group-hover:bg-[#e76f51]/10 group-hover:text-[#e76f51]'
                        }`}
                    >
                      <plan.icon strokeWidth={1.5} className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-aktiv font-bold text-[#2a2019] leading-tight flex flex-col gap-1 mt-1">
                      <span>{plan.title}</span>
                      {plan.titleSmall && (
                        <span className="text-xs md:text-sm font-jakarta font-normal text-slate-500/80 leading-snug">
                          {plan.titleSmall}
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {plan.highlight && (
                  <div className="inline-block px-3 py-1 bg-[#e76f51]/10 border border-[#e76f51]/20 rounded-full text-[9px] font-black uppercase tracking-widest text-[#e76f51]">
                    {plan.highlight}
                  </div>
                )}

                <p className="text-sm md:text-base text-slate-500 font-jakarta leading-relaxed">
                  {plan.desc}
                </p>

                <div className="space-y-4">
                  {plan.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-center gap-3 text-[11px] font-bold text-[#2a2019]/70 uppercase tracking-wider">
                      <div className={`w-1 h-1 rounded-full bg-[#e76f51]/30 group-hover:bg-[#e76f51] transition-colors`} />
                      {feature}
                    </div>
                  ))}
                </div>

                {plan.worksBestWith && (
                  <div className="pt-2">
                    <p className="text-[11px] text-slate-500 font-jakarta leading-relaxed">
                      <span className="font-bold text-[#e76f51]">Works best with:</span> {plan.worksBestWith}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <div className={`flex items-center justify-between px-5 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${plan.popular ? 'bg-[#2a2019] text-white' : 'bg-slate-100 text-[#2a2019] group-hover:bg-[#e76f51] group-hover:text-white'
                  }`}>
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={itemVariants}
          className="mt-16 flex justify-center px-2"
        >
          <div 
            onClick={() => {
              pixel.initiateCheckout({ value: 999, planId: 'consultation', planLabel: 'Book a Consultation' });
              window.location.href = `/auth/signup`;
            }}
            className="relative group w-full sm:w-auto cursor-pointer"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#e76f51] via-[#f4a261] to-[#e76f51] rounded-3xl sm:rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-6 py-4 sm:py-3.5 rounded-3xl sm:rounded-full bg-white/95 backdrop-blur-md border border-[#e76f51]/20 shadow-xl transition-all duration-300 w-full sm:w-auto text-center">
              <span className="text-[10px] sm:text-[10px] font-bold text-[#2a2019]/70 uppercase tracking-widest leading-tight">
                Not sure where to start?
              </span>
              <div className="hidden sm:block w-px h-4 bg-[#e76f51]/20" />
              <span 
                className="flex items-center justify-center gap-2 text-[11px] sm:text-[11px] font-black text-[#e76f51] uppercase tracking-[0.2em] hover:text-[#d4603f] transition-colors"
              >
                Book a consultation — ₹999
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
