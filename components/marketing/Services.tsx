'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: 'Face Yoga Sessions',
    description:
      'Discover the power of natural rejuvenation techniques that combine careful facial work, relaxation, and revitalization with visible results.',
    image: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=680&q=80',
    href: '/programs',
  },
  {
    title: 'Workshops',
    description:
      'For everyone who wants to learn the right self-massage techniques, tissue release, and taping — without the need for professional certification.',
    image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=680&q=80',
    href: '/programs',
  },
  {
    title: 'Online Courses',
    description:
      'Learn rejuvenation techniques from the comfort of home and give your face care that supports health and vitality.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=680&q=80',
    href: '/programs',
  },
  {
    title: 'Personal Training',
    description:
      'One-on-one sessions with Harsimrat, designed for those who want to deepen their practice and receive personalized guidance for their unique needs.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=680&q=80',
    href: '/programs',
  },
];

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLAnchorElement[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

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

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.set(card, { y: 60, opacity: 0 });
        gsap.to(card, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="px-6 md:px-12 py-24 md:py-32"
      style={{ backgroundColor: 'rgb(252, 244, 235)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16 md:mb-20">
          <span
            className="block mb-4 text-[11px] tracking-[0.35em] uppercase"
            style={{ fontFamily: 'Inter, sans-serif', color: 'rgb(153, 143, 132)' }}
          >
            What We Offer
          </span>
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", "Georgia", serif',
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 400,
              color: 'rgb(44, 37, 37)',
            }}
          >
            Our Programs
          </h2>
        </div>

        {/* Service cards - 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((s, i) => (
            <Link
              key={s.title}
              href={s.href}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="group relative overflow-hidden flex flex-col"
              style={{ borderRadius: '20px' }}
            >
              {/* Image */}
              <div className="aspect-[3/2] overflow-hidden relative" style={{ borderRadius: '20px' }}>
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay gradient */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-40"
                  style={{
                    background: 'linear-gradient(to top, rgba(44, 37, 37, 0.6) 0%, transparent 60%)',
                    opacity: 0.5,
                  }}
                />
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: '"Cormorant Garamond", "Georgia", serif',
                      fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                      fontWeight: 500,
                      color: 'rgb(252, 244, 235)',
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="leading-relaxed max-w-sm"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: 'rgba(252, 244, 235, 0.8)',
                      fontWeight: 400,
                    }}
                  >
                    {s.description}
                  </p>
                </div>
                {/* Arrow */}
                <div
                  className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: 'rgb(252, 244, 235)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="rgb(44, 37, 37)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
