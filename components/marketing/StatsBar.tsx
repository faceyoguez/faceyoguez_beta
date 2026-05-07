'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stats = [
  { value: '2,000+', label: 'Clients Trained', accent: '#e76f51' },
  { value: '1.99 Lakh+', label: 'Instagram Followers', accent: '#c0392b' },
  { value: '274+', label: 'Classes Conducted', accent: '#e76f51' },
  { value: '21 Days', label: 'Avg. to First Visible Result', accent: '#c0392b' },
];

export function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative py-14 md:py-20 overflow-hidden bg-[#1a1a1a]">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        {/* Label */}
        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-10 md:mb-14"
        >
          Trusted by Indian Women Across the Country
        </motion.p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div
                className="text-4xl md:text-5xl font-aktiv font-bold mb-2 transition-colors duration-300"
                style={{ color: stat.accent }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] font-jakarta text-white/50 uppercase tracking-widest leading-snug">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 h-px bg-white/10 origin-left"
        />

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          className="mt-6 text-center text-[11px] text-white/25 font-jakarta italic"
        >
          🇮🇳 India's Trusted Face Wellness Coach
        </motion.p>
      </div>
    </section>
  );
}
