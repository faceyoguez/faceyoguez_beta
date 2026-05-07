'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { User, Users, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trackConversionEvent } from '@/lib/conversionTracking';

const PLANS_PREVIEW = [
  {
    id: 'one_on_one',
    title: '1-on-1 Personal Coaching',
    subtitle: 'Deep Transformation',
    desc: 'The fastest way to see results. A programme built entirely around your face, your skin type, and your goals.',
    icon: User,
    features: ['Custom Face Analysis', 'Daily Direct Guidance', 'Progress Check-ins'],
    accent: '#e76f51',
    cta: 'Apply for 1-on-1'
  },
  {
    id: 'group_session',
    title: '21-Day Group Batch',
    subtitle: 'Community Energy',
    desc: 'Our most popular programme. Join a batch of like-minded women and build a habit that lasts a lifetime.',
    icon: Users,
    features: ['Live Daily Practice', 'Shared Progress', 'Community Support'],
    accent: '#2c2525',
    popular: true,
    cta: 'Join Next Batch'
  },
  {
    id: 'lms',
    title: 'Self-Paced Video Course',
    subtitle: 'Lifetime Access',
    desc: 'Master the techniques at your own pace. Perfect for busy schedules and those who want to learn on their own time.',
    icon: BookOpen,
    features: ['Step-by-Step Modules', 'Lifetime Access', 'Bonus Morning Rituals'],
    accent: '#5a6343',
    cta: 'Get Instant Access'
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
      className="px-6 md:px-12 py-24 md:py-36 relative overflow-hidden bg-transparent"
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
                if (plan.id === 'one_on_one') router.push('/plans/personal-classes');
                if (plan.id === 'group_session') router.push('/plans/live-group');
                if (plan.id === 'lms') router.push('/plans/video-courses');
              }}
              className={`group p-8 md:p-10 rounded-[2.5rem] transition-all duration-500 relative cursor-pointer flex flex-col border ${
                plan.popular 
                  ? 'bg-white border-[#e76f51]/20 shadow-[0_32px_80px_rgba(231,111,81,0.08)]' 
                  : 'bg-white/50 border-slate-100 hover:border-[#e76f51]/20 hover:bg-white hover:shadow-[0_20px_50px_rgba(42,32,25,0.05)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-6 right-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e76f51] text-[9px] font-black uppercase tracking-widest text-white">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="space-y-8 flex-1">
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-[8deg] ${
                    plan.popular ? 'bg-[#e76f51]/10 text-[#e76f51]' : 'bg-slate-100 text-slate-400 group-hover:bg-[#e76f51]/10 group-hover:text-[#e76f51]'
                  }`}
                >
                  <plan.icon strokeWidth={1.5} className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e76f51]/60">
                    {plan.subtitle}
                  </p>
                  <h3 className="text-xl md:text-2xl font-aktiv font-bold text-[#2a2019]">
                    {plan.title}
                  </h3>
                </div>

                <p className="text-sm md:text-base text-slate-500 font-jakarta leading-relaxed">
                  {plan.desc}
                </p>

                <div className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3 text-[11px] font-bold text-[#2a2019]/70 uppercase tracking-wider">
                      <div className={`w-1 h-1 rounded-full ${plan.popular ? 'bg-[#e76f51]' : 'bg-slate-300'}`} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                 <div className={`flex items-center justify-between px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                   plan.popular ? 'bg-[#2a2019] text-white' : 'bg-slate-100 text-[#2a2019] group-hover:bg-[#e76f51] group-hover:text-white'
                 }`}>
                   <span>{plan.cta}</span>
                   <ArrowRight className="w-4 h-4" />
                 </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trial Note */}
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={itemVariants}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Not sure where to start?
            </span>
            <Link href="/auth/signup" className="text-[10px] font-black text-[#e76f51] uppercase tracking-widest hover:underline">
              Book a Free Consult →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
