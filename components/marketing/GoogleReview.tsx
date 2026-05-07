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
      className="px-6 md:px-12 py-20 md:py-32 bg-[#1a1a1a]/90 backdrop-blur-xl"
    >
      <div ref={contentRef} className="max-w-4xl mx-auto text-center space-y-8">
        {/* Google rating */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-[#e76f51] text-xl">★</span>
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 font-jakarta">
            5.0 Rating based on verified reviews
          </span>
        </div>

        <h3 className="text-3xl md:text-5xl font-aktiv font-bold text-white leading-tight">
          Love Your Progress? <br />
          <span className="italic font-light text-white/50">Inspire Others Too.</span>
        </h3>
        
        <p className="text-sm md:text-base text-white/60 font-jakarta leading-relaxed max-w-2xl mx-auto">
          Every review helps a woman in India discover that natural rejuvenation is possible. 
          If Harsimrat has helped you find your glow, we'd love to hear your story.
        </p>

        <div className="pt-4">
          <a
            href="https://g.page/r/CU9o-x-x-x-x/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#e76f51] text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.05] shadow-[0_12px_24px_rgba(231,111,81,0.2)]"
          >
            Review us on Google
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
