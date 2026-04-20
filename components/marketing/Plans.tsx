'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { User, Users, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trackConversionEvent } from '@/lib/conversionTracking';
import { PersonalPlanModal } from './PersonalPlanModal';
import { GroupPlanModal } from './GroupPlanModal';
import { VideoCourseModal } from './VideoCourseModal';

const PLANS_PREVIEW = [
  {
    id: 'one_on_one',
    title: 'Personal Classes',
    subtitle: '1-on-1 Transformation',
    desc: 'A facial ritual designed exclusively for your unique structure and goals.',
    icon: User,
    features: ['Customized Daily Routine', 'Direct Expert Guidance', 'Progress Mapping'],
    accent: '#bc162d'
  },
  {
    id: 'group_session',
    title: 'Live Group',
    subtitle: '21-Day Ritual',
    desc: 'Practise daily with a community seeking the same radiant vitality.',
    icon: Users,
    features: ['Daily Live Classes', 'Shared Energy', 'Accountability Batch'],
    accent: '#446187',
    popular: true
  },
  {
    id: 'lms',
    title: 'Video Courses',
    subtitle: 'Self-Paced Mastery',
    desc: 'Learn the ancient art of face yoga at your own rhythm, forever.',
    icon: BookOpen,
    features: ['Lifetime Access', 'Step-by-Step Modules', 'Anytime, Anywhere'],
    accent: '#5a6343'
  }
];

export function Plans() {
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
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
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section
      id="plans-overview"
      className="px-6 md:px-12 py-24 md:py-40 relative overflow-hidden"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Decorative Blur Orbs (Optimized) */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E07A5F]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none will-change-transform" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#446187]/5 rounded-full blur-[70px] translate-y-1/2 -translate-x-1/2 pointer-events-none will-change-transform" />

      <div className="max-w-7xl mx-auto relative z-10" ref={containerRef}>
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={itemVariants}
          className="text-center mb-16 md:mb-24 space-y-4"
        >
          <span className="block text-[11px] font-black uppercase tracking-[0.4em] text-[#9b452e]/60">
            Pathways to Radiance
          </span>
          <h2
            className="text-4xl md:text-6xl font-aktiv leading-[1.1] text-[#2c2525]"
          >
            Guided by Wisdom, <br /> Tailored for You
          </h2>
          <p className="max-w-xl mx-auto text-sm md:text-base text-[#5d605c] font-jakarta font-medium leading-relaxed">
            Whether you seek personal mastery or collective energy, <br className="hidden md:block" /> 
            our rituals are designed to unveil your natural beauty.
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
              whileHover={{ scale: 1.02 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (plan.id === 'one_on_one') router.push('/plans/personal-classes');
                if (plan.id === 'group_session') router.push('/plans/live-group');
                if (plan.id === 'lms') router.push('/plans/video-courses');
              }}
              className={`group p-8 md:p-10 rounded-[3rem] transition-colors duration-500 relative cursor-pointer ${
                plan.popular ? 'bg-white shadow-[0_32px_64px_rgba(44,37,37,0.04)]' : 'bg-[#fcf8f7]/60 border border-[#2c2525]/5'
              }`}
            >


              <div className="space-y-8">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-[8deg]"
                  style={{ backgroundColor: `${plan.accent}08`, color: plan.accent }}
                >
                  <plan.icon strokeWidth={1.5} className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <h3 
                    className="text-2xl md:text-3xl font-aktiv text-[#2c2525]"
                  >
                    {plan.title}
                  </h3>
                  <p className="text-[10px] font-jakarta font-black uppercase tracking-[0.2em] text-[#9b452e]/60">
                    {plan.subtitle}
                  </p>
                </div>

                <p className="text-sm text-[#5d605c] leading-relaxed min-h-[3rem]">
                  {plan.desc}
                </p>

                <div className="pt-4 space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3 text-[11px] font-bold text-[#2c2525]/70 uppercase tracking-wider">
                      <div className="w-1 h-1 rounded-full bg-[#2c2525]/20" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={itemVariants}
          className="mt-20 md:mt-32 text-center space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <h4 
              className="text-xl md:text-2xl font-aktiv text-[#2c2525]"
            >
              Ready to start your practice?
            </h4>
            <Link
              href="/auth/signup"
              onClick={() => trackConversionEvent({ event_type: 'buy_click' })}
              className="group relative inline-flex items-center gap-4 px-10 py-5 bg-[#2c2525] text-[#FAF9F6] rounded-full overflow-hidden transition-all duration-500 hover:scale-[1.05]"
            >
              <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em]">
                Know More & Join
              </span>
              <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-[#9b452e] translate-y-full transition-transform duration-500 group-hover:translate-y-0" />
            </Link>
          </div>
          
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#9b452e]/40">
            Free 3-Day Trial Available for All New Students
          </p>
        </motion.div>
      </div>

      <PersonalPlanModal 
        isOpen={showPersonalModal} 
        onClose={() => setShowPersonalModal(false)} 
      />
      <GroupPlanModal 
        isOpen={showGroupModal} 
        onClose={() => setShowGroupModal(false)} 
      />
      <VideoCourseModal 
        isOpen={showVideoModal} 
        onClose={() => setShowVideoModal(false)} 
      />
    </section>
  );
}
