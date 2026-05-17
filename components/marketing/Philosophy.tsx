'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Sparkles, Zap, Heart, Droplets, Moon, Search, CheckCircle } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const features = [
  { label: 'Personalised', desc: 'Your face isn\'t the same as anyone else\'s' },
  { label: 'Progressive', desc: 'Building week by week, not the same 5 exercises on loop' },
  { label: 'Proven', desc: 'Backed by thousands of clients who\'ve seen real, visible change' },
  { label: 'Gentle', desc: 'No strain, no pain, no redness. Safe for all skin types and ages.' },
];

export function Philosophy() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section
      ref={containerRef}
      className="relative py-24 md:py-36 bg-transparent overflow-hidden"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">

        {/* CHAPTER 1: THE FRUSTRATION */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="space-y-16 mb-32"
        >
          <motion.div variants={fadeUp} className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10">
              <Search className="w-3.5 h-3.5 text-slate-900/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900/60">Sound Familiar?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-aktiv leading-[1.1] text-[#2a2019] font-bold tracking-tight">
              You've Tried Everything.{' '}
              <span className="text-[#e76f51] italic font-light">Your Skin Still Isn't Listening.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Droplets, text: "You drink water." },
              { icon: Sparkles, text: "You layer on serums." },
              { icon: Moon, text: "You sleep 8 hours." }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-6 rounded-[1.75rem] bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <item.icon strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="space-y-5">
            <p className="text-lg md:text-xl text-center text-[#2a2019]/60 font-jakarta leading-relaxed max-w-2xl mx-auto">
              But every morning, the mirror shows the same thing —
              <span className="text-[#2a2019] font-semibold"> fine lines, a sagging jawline, dull skin, and puffiness</span> that won't quit.
            </p>
            <p className="text-base text-center text-[#2a2019]/40 font-jakarta leading-relaxed max-w-2xl mx-auto">
              You've spent thousands on skincare products that promise miracles and deliver nothing. You've thought about fillers — and immediately felt guilty for even considering it.
            </p>
          </motion.div>
        </motion.div>

        {/* CHAPTER 2: THE REVELATION */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="space-y-12 mb-32"
        >
          <motion.div variants={fadeUp} className="relative p-8 md:p-14 rounded-[2.5rem] bg-white border border-[#e76f51]/10 shadow-[0_32px_80px_rgba(231,111,81,0.08)] overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e76f51]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 space-y-10">
              <div className="space-y-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#e76f51]">Here's what nobody tells you</p>
                <h3 className="text-2xl md:text-3xl font-aktiv text-slate-900 leading-tight font-bold">
                  The problem isn't your skin. <br className="hidden md:block" />
                  <span className="text-slate-500 font-light italic">It's that you've never trained the muscles underneath it.</span>
                </h3>
              </div>

              <div className="py-8 border-y border-slate-100 text-center">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl md:text-7xl font-aktiv text-[#e76f51] font-bold"
                >
                  57 muscles
                </motion.div>
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Hidden beneath the surface of your face</p>
              </div>

              <p className="text-base md:text-lg text-center text-[#2a2019]/70 font-jakarta leading-relaxed">
                Your face has more muscles than any other part of your body — and just like your arms or abs,
                they can be <span className="text-[#2a2019] font-bold">trained, toned, and lifted.</span>{' '}
                Without a single needle. Without spending ₹50,000 on a clinic visit.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* CHAPTER 3: THE SOLUTION */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="space-y-14"
        >
          <motion.div variants={fadeUp} className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e76f51]/8 border border-[#e76f51]/15">
              <Zap className="w-3.5 h-3.5 text-[#e76f51]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e76f51]">What is Face Wellness?</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-aktiv text-[#2a2019] font-bold leading-tight">
              It's Not "Just Yoga." <br />
              <span className="italic font-light text-[#2a2019]/60">It's the Science of Facial Muscle Training.</span>
            </h2>
            <p className="text-base text-slate-600 font-jakarta leading-relaxed max-w-2xl mx-auto">
              Face Wellness is a structured, technique-based practice that targets the 57 muscles of your face and neck — the ones responsible for sagging cheeks, drooping eyelids, a double chin, and loss of definition.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-start gap-4 p-6 rounded-[1.5rem] bg-white/70 backdrop-blur-md border border-slate-100 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#e76f51]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-[#e76f51]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2a2019] mb-1">{f.label}</p>
                  <p className="text-xs text-slate-500 font-jakarta leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="text-center">
            <p className="text-lg md:text-2xl font-aktiv font-bold text-[#e76f51]">10–15 minutes a day. That's all it takes.</p>
            <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-full border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <Heart className="w-4 h-4 text-[#e76f51]/40" />
              Join the ritual — it starts free
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
