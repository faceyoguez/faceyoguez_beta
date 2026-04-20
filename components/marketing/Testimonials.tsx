'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    text: 'After just 3 sessions, the circles under my eyes completely disappeared. My friends keep asking what treatment I had done.',
    name: 'Priya',
    surname: 'Sharma',
    program: '21-Day Journey',
    images: {
      beforeFront: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&q=80',
      afterFront: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=400&fit=crop&q=80',
      beforeSide: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop&q=80',
      afterSide: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop&q=80'
    }
  },
  {
    text: 'The results speak for themselves. Visible cheekbone definition within two weeks. This isn\'t just exercise, it\'s an art form.',
    name: 'Ananya',
    surname: 'Reddy',
    program: 'Personal Coaching',
    images: {
      beforeFront: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&q=80',
      afterFront: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=400&fit=crop&q=80',
      beforeSide: 'https://images.unsplash.com/photo-1554727242-741c14fa561c?w=400&h=400&fit=crop&q=80',
      afterSide: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400&h=400&fit=crop&q=80'
    }
  }
];

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headerRef.current, { y: 40, opacity: 0 });
      gsap.to(headerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

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
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-20">
          <div>
            <span
              className="block mb-4 text-[11px] tracking-[0.35em] uppercase"
              style={{ fontFamily: 'var(--font-jakarta), sans-serif', color: 'rgb(153, 143, 132)' }}
            >
              Transformations
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-aktiv), serif',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 400,
                color: 'rgb(44, 37, 37)',
                lineHeight: 1.1
              }}
            >
              What our students say
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="w-12 h-12 flex items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[rgb(44,37,37)] hover:text-[rgb(252,244,235)] group"
              style={{ borderColor: 'rgba(44, 37, 37, 0.2)' }}
              aria-label="Previous testimonial"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[rgb(44,37,37)] hover:text-[rgb(252,244,235)] group"
              style={{ borderColor: 'rgba(44, 37, 37, 0.2)' }}
              aria-label="Next testimonial"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Images */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 relative">
             <div className="space-y-4 md:space-y-6 pt-12">
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant group">
                   <img src={activeTestimonial.images.beforeFront} alt="Before Front" className="w-full h-full object-cover" />
                   <div className="absolute top-4 left-4 px-3 py-1 backdrop-blur-md bg-white/20 rounded-full text-[10px] font-medium tracking-wide uppercase text-white border border-white/20">Before (Front)</div>
                </div>
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant group">
                   <img src={activeTestimonial.images.afterFront} alt="After Front" className="w-full h-full object-cover" />
                   <div className="absolute top-4 left-4 px-3 py-1 backdrop-blur-md bg-primary/80 rounded-full text-[10px] font-medium tracking-wide uppercase text-white border border-white/20">After (Front)</div>
                </div>
             </div>
             <div className="space-y-4 md:space-y-6">
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant group">
                   <img src={activeTestimonial.images.beforeSide} alt="Before Side" className="w-full h-full object-cover" />
                   <div className="absolute top-4 left-4 px-3 py-1 backdrop-blur-md bg-white/20 rounded-full text-[10px] font-medium tracking-wide uppercase text-white border border-white/20">Before (Side)</div>
                </div>
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] bg-surface-variant group">
                   <img src={activeTestimonial.images.afterSide} alt="After Side" className="w-full h-full object-cover" />
                   <div className="absolute top-4 left-4 px-3 py-1 backdrop-blur-md bg-primary/80 rounded-full text-[10px] font-medium tracking-wide uppercase text-white border border-white/20">After (Side)</div>
                </div>
             </div>
          </div>

          {/* Right: Text */}
          <div className="relative z-10 flex flex-col justify-center min-h-[300px]">
             <svg className="w-16 h-16 md:w-20 md:h-20 mb-8 opacity-10" viewBox="0 0 24 24" fill="currentColor">
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
                  className="leading-[1.4] mb-12"
                  style={{
                    fontFamily: 'var(--font-aktiv), serif',
                    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                    fontWeight: 400,
                    color: 'rgb(44, 37, 37)',
                  }}
                >
                  "{activeTestimonial.text}"
                </blockquote>

                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-px"
                    style={{ backgroundColor: 'rgb(249, 109, 65)' }}
                  />
                  <div>
                    <p
                      className="text-[13px] tracking-[0.15em] uppercase font-bold mb-1"
                      style={{ fontFamily: 'var(--font-jakarta), sans-serif', color: 'rgb(44, 37, 37)' }}
                    >
                      {activeTestimonial.name} {activeTestimonial.surname}
                    </p>
                    <p 
                      className="text-[11px] tracking-[0.1em] uppercase"
                      style={{ fontFamily: 'var(--font-jakarta), sans-serif', color: 'rgb(153, 143, 132)' }}
                    >
                      {activeTestimonial.program}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
