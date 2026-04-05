'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function GoogleReview() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(contentRef.current, { y: 40, opacity: 0 });
      gsap.to(contentRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="px-6 md:px-12 py-20 md:py-28"
      style={{ backgroundColor: 'rgb(44, 37, 37)' }}
    >
      <div ref={contentRef} className="max-w-3xl mx-auto text-center space-y-6">
        {/* Google rating */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ color: 'rgb(249, 109, 65)', fontSize: '18px' }}>★</span>
            ))}
          </div>
          <span
            className="text-[12px] tracking-[0.15em]"
            style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(252, 244, 235, 0.6)' }}
          >
            5.0 on Google
          </span>
        </div>

        <h3
          className="leading-[1.2]"
          style={{
            fontFamily: '"Cormorant Garamond", "Georgia", serif',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
            fontWeight: 400,
            color: 'rgb(252, 244, 235)',
          }}
        >
          Leave us a review too!
        </h3>
        <p
          className="leading-relaxed"
          style={{
            fontFamily: '"Cormorant Garamond", "Georgia", serif',
            fontSize: '1.05rem',
            color: 'rgba(252, 244, 235, 0.7)',
          }}
        >
          Did you enjoy your experience? Share your journey and leave us a review.
          Your story could inspire someone to begin their own transformation.
        </p>

        <a
          href="#"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[13px] tracking-[0.1em] uppercase transition-all duration-300 hover:scale-[1.02] mt-4"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            backgroundColor: 'rgb(252, 244, 235)',
            color: 'rgb(44, 37, 37)',
          }}
        >
          Write a Review on Google
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
