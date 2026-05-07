'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence, Variants } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const faqs = [
  {
    q: "I'm in my 40s/50s. Is it too late for Face Yoga to work for me?",
    a: "Absolutely not. Some of our most dramatic transformations come from women in their 40s and 50s. Facial muscles respond to training at any age. In fact, the earlier you start the better — but starting today is always better than not starting.",
  },
  {
    q: "How soon will I see results?",
    a: "Most clients notice their skin feeling firmer and more toned within 2 weeks of consistent practice. Visible lift and definition typically appear by week 4–6. Results depend on consistency — we recommend 10–15 minutes daily.",
  },
  {
    q: "What if I've never done any yoga or exercise before?",
    a: "Perfect — that means your facial muscles are completely untrained, which means they'll respond very quickly. Our method is designed for complete beginners. No flexibility, fitness, or prior experience needed.",
  },
  {
    q: "Is the free trial really free? What's the catch?",
    a: "Yes, truly free. No credit card required. You'll attend a real class — not a sales pitch. We do it because we know once you feel the difference, you won't want to stop.",
  },
  {
    q: "How is this different from YouTube face yoga videos?",
    a: "YouTube gives you random exercises with no progression, no personalisation, and no feedback. Faceyoguez gives you a structured programme built around your face, with live coaching and real accountability. It's the difference between watching a gym workout video and actually having a personal trainer.",
  },
  {
    q: "Can I do this if I have sensitive skin or skin conditions?",
    a: "Yes. Our method is entirely non-invasive — no products, no tools, no pressure on the skin beyond gentle muscle movement. Always consult your dermatologist if you have an active skin condition.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      className={`border-b border-slate-200/60 last:border-0`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-6 text-left group"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <span className="text-[11px] font-black text-[#e76f51]/50 mt-1 shrink-0 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-base md:text-lg font-aktiv font-semibold text-[#2a2019] leading-snug group-hover:text-[#e76f51] transition-colors duration-200">
            {q}
          </span>
        </div>
        <div className="shrink-0 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-[#e76f51]/40 transition-colors duration-200 mt-0.5">
          {open
            ? <Minus className="w-4 h-4 text-[#e76f51]" />
            : <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#e76f51] transition-colors" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pl-[2.25rem] pb-6 text-sm md:text-base font-jakarta text-slate-500 leading-relaxed max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="relative py-24 md:py-36 overflow-hidden bg-transparent">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          className="text-center mb-16 space-y-5"
        >
          <div className="inline-flex flex-col items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">Frequently Asked Questions</span>
            <div className="w-12 h-[1px] bg-[#e76f51]/20" />
          </div>
          <h2 className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-tight tracking-tight">
            Still Have Questions?<br />
            <span className="italic font-light opacity-50">We've Got You.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_60px_rgba(42,32,25,0.05)] px-6 md:px-10"
        >
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
