'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ImageShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image scales from rounded to full width
      gsap.fromTo(
        imageRef.current,
        { borderRadius: '30px', scale: 0.85 },
        {
          borderRadius: '0px',
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'top 10%',
            scrub: true,
          },
        },
      );

      // Overlay text appears
      gsap.set(overlayTextRef.current, { y: 30, opacity: 0 });
      gsap.to(overlayTextRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 30%',
        },
      });

      // Parallax on image
      const img = imageRef.current?.querySelector('img');
      if (!img) return;
      gsap.to(img, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: 'rgb(252, 244, 235)' }}
    >
      {/* Full-width image with scale animation */}
      <div
        ref={imageRef}
        className="relative w-full overflow-hidden will-change-transform"
        style={{ height: '85vh' }}
      >
        <img
          src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1800&q=80"
          alt="Face yoga practice"
          className="w-full h-[120%] object-cover will-change-transform"
          style={{ marginTop: '-10%' }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(44, 37, 37, 0.5), transparent 50%)' }}
        />
      </div>

      {/* Overlay text */}
      <div
        ref={overlayTextRef}
        className="absolute bottom-12 left-6 md:bottom-16 md:left-12 z-10 max-w-lg"
      >
        <h3
          className="leading-[1.1] mb-3"
          style={{
            fontFamily: '"Cormorant Garamond", "Georgia", serif',
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 400,
            color: 'rgb(252, 244, 235)',
          }}
        >
          The power of touch
        </h3>
        <p
          className="leading-relaxed"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: 'rgba(252, 244, 235, 0.8)',
          }}
        >
          Each technique is designed to work with your body's natural ability to heal and rejuvenate.
        </p>
      </div>
    </section>
  );
}
