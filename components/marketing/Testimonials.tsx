'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, Variants } from 'framer-motion';
import Link from 'next/link';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const testimonials = [
  {
    text: "I was sceptical — I'd tried everything. But after 3 weeks with Harsimrat, my friends started asking if I'd done something to my face. I had — just not what they thought.",
    name: 'Meera R.',
    location: 'Mumbai',
    age: '38',
    program: '21-Day Journey',
    images: {
      beforeFront: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&q=80',
      afterFront: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=400&fit=crop&q=80',
      beforeSide: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop&q=80',
      afterSide: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop&q=80'
    }
  },
  {
    text: "The 1-on-1 session was a game-changer. She looked at MY face and gave me exercises for MY problem areas. No generic routine.",
    name: 'Sunita K.',
    location: 'Delhi',
    age: '46',
    program: 'Personal Coaching',
    images: {
      beforeFront: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&q=80',
      afterFront: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=400&fit=crop&q=80',
      beforeSide: 'https://images.unsplash.com/photo-1554727242-741c14fa561c?w=400&h=400&fit=crop&q=80',
      afterSide: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400&h=400&fit=crop&q=80'
    }
  },
  {
    text: "I was worried it would feel like work. It doesn't. It's 10 minutes and honestly the most relaxing part of my morning.",
    name: 'Ananya T.',
    location: 'Hyderabad',
    age: '29',
    program: 'Group Batch',
    images: {
      beforeFront: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&q=80',
      afterFront: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=400&fit=crop&q=80',
      beforeSide: 'https://images.unsplash.com/photo-1554727242-741c14fa561c?w=400&h=400&fit=crop&q=80',
      afterSide: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400&h=400&fit=crop&q=80'
    }
  },
  {
    text: "I'd spent ₹30,000 on serums and facials in the past year. I wish I'd found Faceyoguez first.",
    name: 'Ritu M.',
    location: 'Pune',
    age: '52',
    program: '21-Day Journey',
    images: {
      beforeFront: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&q=80',
      afterFront: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=400&fit=crop&q=80',
      beforeSide: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop&q=80',
      afterSide: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop&q=80'
    }
  }
];

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeTestimonial = testimonials[currentIndex];
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section
      ref={sectionRef}
      className="px-6 md:px-12 py-24 md:py-36 overflow-hidden relative"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-12 mb-20"
        >
          <div className="space-y-6">
            <div className="inline-flex flex-col items-start gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51]">What Our Clients Say</span>
              <div className="w-12 h-[1px] bg-[#e76f51]/20" />
            </div>
            <h2 className="text-3xl md:text-5xl font-aktiv text-[#2a2019] font-bold leading-[1.1] tracking-tight">
              Real Stories. <br className="hidden md:block" />{' '}
              <span className="italic font-light opacity-60">Real Results.</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="w-12 h-12 flex items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[rgb(44,37,37)] hover:text-[rgb(252,244,235)]"
              style={{ borderColor: 'rgba(44, 37, 37, 0.2)' }}
              aria-label="Previous testimonial"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[11px] text-[#2a2019]/40 font-jakarta font-medium">{currentIndex + 1} / {testimonials.length}</span>
            <button
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[rgb(44,37,37)] hover:text-[rgb(252,244,235)]"
              style={{ borderColor: 'rgba(44, 37, 37, 0.2)' }}
              aria-label="Next testimonial"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Images */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="grid grid-cols-2 gap-4 md:gap-5 relative"
            >
              <div className="space-y-4 md:space-y-5 pt-10">
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant">
                  <img src={activeTestimonial.images.beforeFront} alt="Before Front" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2 py-1 backdrop-blur-md bg-white/20 rounded-full text-[9px] font-medium tracking-wide uppercase text-white border border-white/20">Before</div>
                </div>
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant">
                  <img src={activeTestimonial.images.afterFront} alt="After Front" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2 py-1 backdrop-blur-md bg-[#e76f51]/80 rounded-full text-[9px] font-medium tracking-wide uppercase text-white border border-white/20">After</div>
                </div>
              </div>
              <div className="space-y-4 md:space-y-5">
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant">
                  <img src={activeTestimonial.images.beforeSide} alt="Before Side" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2 py-1 backdrop-blur-md bg-white/20 rounded-full text-[9px] font-medium tracking-wide uppercase text-white border border-white/20">Side — Before</div>
                </div>
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant">
                  <img src={activeTestimonial.images.afterSide} alt="After Side" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2 py-1 backdrop-blur-md bg-[#e76f51]/80 rounded-full text-[9px] font-medium tracking-wide uppercase text-white border border-white/20">Side — After</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: Text */}
          <div className="relative z-10 flex flex-col justify-center min-h-[300px]">
            <svg className="w-14 h-14 md:w-16 md:h-16 mb-6 opacity-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <blockquote
                  className="leading-[1.45] mb-10 text-2xl md:text-3xl font-aktiv font-normal text-[#2a2019]"
                >
                  "{activeTestimonial.text}"
                </blockquote>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-px bg-[#e76f51]" />
                  <div>
                    <p className="text-[13px] tracking-[0.1em] uppercase font-bold text-[#2a2019] font-jakarta">
                      {activeTestimonial.name}, {activeTestimonial.age}
                    </p>
                    <p className="text-[11px] tracking-[0.05em] text-[#2a2019]/50 font-jakarta">
                      {activeTestimonial.location} · {activeTestimonial.program}
                    </p>
                  </div>
                </div>

                {/* Result Note */}
                <p className="text-[11px] text-slate-400 font-jakarta leading-relaxed max-w-sm">
                  Results vary by individual. Most clients notice improved skin texture by Week 2, visible lift and tone by Week 4–6.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
