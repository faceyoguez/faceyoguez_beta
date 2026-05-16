'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';
import Link from 'next/link';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

type CellValue = true | false | 'rarely';

const rows: { feature: string; faceyoguez: CellValue; youtube: CellValue; others: CellValue }[] = [
  { feature: 'Personalised to your face', faceyoguez: true, youtube: false, others: false },
  { feature: 'Live, interactive classes', faceyoguez: true, youtube: false, others: 'rarely' },
  { feature: 'Trained 2,000+ real clients', faceyoguez: true, youtube: false, others: false },
  { feature: 'Progressive programme', faceyoguez: true, youtube: false, others: 'rarely' },
  { feature: 'Direct access to your coach', faceyoguez: true, youtube: false, others: false },
  { feature: 'India-specific, relatable content', faceyoguez: true, youtube: false, others: 'rarely' },
  { feature: 'Free trial before you commit', faceyoguez: true, youtube: false, others: false },
];

function Cell({ value }: { value: CellValue }) {
  if (value === true)
    return <div className="w-7 h-7 rounded-full bg-[#e76f51]/10 flex items-center justify-center mx-auto"><Check className="w-4 h-4 text-[#e76f51]" strokeWidth={2.5} /></div>;
  if (value === false)
    return <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center mx-auto"><X className="w-4 h-4 text-slate-300" strokeWidth={2.5} /></div>;
  return <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center mx-auto"><Minus className="w-4 h-4 text-amber-400" strokeWidth={2.5} /></div>;
}

export function WhyUs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="relative py-24 md:py-36 overflow-hidden bg-transparent">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"} variants={fadeUp} className="text-center mb-16 space-y-5">
          <div className="inline-flex flex-col items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">Why Faceyoguez?</span>
            <div className="w-12 h-[1px] bg-[#e76f51]/20" />
          </div>
          <h2 className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-tight tracking-tight">
            Not All Face Yoga is the Same.<br className="hidden md:block" />
            <span className="italic font-light opacity-60"> Here's Why Women Choose Us.</span>
          </h2>
        </motion.div>

        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"} variants={fadeUp} className="rounded-[2rem] overflow-hidden border border-[#2a2019]/10 shadow-[0_20px_60px_rgba(42,32,25,0.06)] bg-white/70 backdrop-blur-xl">
          {/* Header row */}
          <div className="grid grid-cols-[40%_20%_20%_20%] md:grid-cols-4 border-b border-[#2a2019]/10">
            <div className="p-3 md:p-6 flex items-end">
              <p className="text-[10px] md:hidden font-aktiv font-bold text-[#2a2019]/40 uppercase tracking-widest">Features</p>
            </div>
            <div className="p-2 md:p-6 flex flex-col items-center justify-center text-center border-l border-[#2a2019]/10 bg-[#e76f51]">
              <p className="text-[6px] sm:text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-widest text-white/80 mb-0.5 md:mb-1">Best Choice</p>
              <p className="text-[9px] sm:text-[10px] md:text-sm font-aktiv font-bold text-white">Faceyoguez</p>
            </div>
            <div className="p-2 md:p-6 flex flex-col items-center justify-center text-center border-l border-[#2a2019]/10">
              <p className="hidden md:block text-[9px] font-black uppercase tracking-widest text-[#2a2019]/40 mb-1">vs</p>
              <p className="text-[9px] sm:text-[10px] md:text-sm font-aktiv font-bold text-[#2a2019]/60 leading-tight">YouTube</p>
            </div>
            <div className="p-2 md:p-6 flex flex-col items-center justify-center text-center border-l border-[#2a2019]/10">
              <p className="hidden md:block text-[9px] font-black uppercase tracking-widest text-[#2a2019]/40 mb-1">vs</p>
              <p className="text-[9px] sm:text-[10px] md:text-sm font-aktiv font-bold text-[#2a2019]/60 leading-tight">Other<br className="md:hidden" /> Courses</p>
            </div>
          </div>

          {rows.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-[40%_20%_20%_20%] md:grid-cols-4 ${i < rows.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="p-3 md:p-5 flex items-center">
                <p className="text-[10px] md:text-sm font-jakarta text-slate-600 leading-snug pr-2">{row.feature}</p>
              </div>
              <div className="p-2 md:p-5 flex items-center justify-center border-l border-slate-100 bg-[#e76f51]/5">
                <Cell value={row.faceyoguez} />
              </div>
              <div className="p-2 md:p-5 flex items-center justify-center border-l border-slate-100">
                <Cell value={row.youtube} />
              </div>
              <div className="p-2 md:p-5 flex items-center justify-center border-l border-slate-100">
                <Cell value={row.others} />
              </div>
            </div>
          ))}

          <div className="flex flex-col md:grid md:grid-cols-4 border-t border-slate-100 bg-slate-50/50">
            <div className="hidden md:block p-5" />
            <div className="p-5 md:p-5 flex justify-center items-center md:border-l border-slate-100 col-span-3">
              <Link href="/auth/signup" className="w-full max-w-[240px] md:w-auto text-center px-6 py-3.5 md:px-5 md:py-2.5 bg-[#e76f51] text-white rounded-full text-[11px] font-black uppercase tracking-[0.25em] hover:bg-[#d4603f] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap">
                Join now →
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate={isInView ? "visible" : "hidden"} variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-6 text-[10px] font-jakarta text-slate-400">
          <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#e76f51]" /> Yes</span>
          <span className="flex items-center gap-1.5"><X className="w-3 h-3 text-slate-300" /> No</span>
          <span className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-amber-400" /> Sometimes</span>
        </motion.div>
      </div>
    </section>
  );
}
