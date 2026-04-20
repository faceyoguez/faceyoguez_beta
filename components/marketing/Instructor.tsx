'use client';

import { useState, useEffect, useRef } from 'react';

const INSTRUCTOR_IMAGE = '/assets/instructor_img.jpg';

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function Instructor() {
  const [ref, inView] = useInView();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const rv = (d = 0): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(40px)',
    transition: `all 1s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  });

  return (
    <section
      ref={ref}
      style={{ position: 'relative', background: 'transparent', padding: isMobile ? '4rem 0' : '6rem 0 8rem', overflow: 'hidden' }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '0 1.5rem' : '0 clamp(2rem,5vw,5rem)',
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
        gap: isMobile ? '3rem' : 'clamp(3rem,6vw,8rem)', alignItems: 'start',
      }}>
        {/* Left — text */}
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h2 style={{
            fontFamily: "var(--font-aktiv), serif",
            fontSize: isMobile ? '2.5rem' : 'clamp(2.8rem,5vw,4.8rem)',
            fontWeight: 400, lineHeight: 1.05, color: '#2a2019',
            marginBottom: isMobile ? '1.5rem' : '2.5rem',
          }}>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span style={{
                display: 'block',
                clipPath: inView ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
                transition: 'clip-path 1s cubic-bezier(0.22,1,0.36,1) 0.1s',
              }}>The Power</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span style={{
                display: 'block',
                clipPath: inView ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
                transition: 'clip-path 1s cubic-bezier(0.22,1,0.36,1) 0.22s',
              }}>of Touch</span>
            </span>
          </h2>

          <div style={{ maxWidth: isMobile ? '100%' : 520, margin: isMobile ? '1.5rem auto' : '0', ...rv(0.25) }}>
            <p style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: isMobile ? '0.9rem' : '0.98rem', lineHeight: 1.85,
              color: 'rgba(42,32,25,0.65)', marginBottom: '1.8rem',
            }}>
              Every face is unique and deserves special attention. We work with passion, enthusiasm and a sincere desire to help each and everyone who wants to feel and see a real change on their face.
            </p>
            <p style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: isMobile ? '0.9rem' : '0.98rem', lineHeight: 1.85,
              color: 'rgba(42,32,25,0.65)',
            }}>
              The change is visible even after one massage, regardless of face type and age — it is necessary to combine the right techniques, estimate the needs of the face and know what needs to be strengthened or released and relaxed.
            </p>
          </div>
        </div>

        {/* Right — portrait + bio */}
        <div style={{ ...rv(0.15), display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'start', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{
            width: isMobile ? '180px' : 'clamp(160px,14vw,200px)', aspectRatio: '1',
            borderRadius: 6, overflow: 'hidden', marginBottom: '2rem',
            boxShadow: '0 6px 30px rgba(0,0,0,0.06)',
          }}>
            <img
              src={INSTRUCTOR_IMAGE} alt="Harsimrat"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%', display: 'block' }}
            />
          </div>

          <div style={{ width: '100%', height: 1, background: 'rgba(42,32,25,0.08)', marginBottom: '1.8rem' }} />

          <blockquote style={{
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: isMobile ? '0.85rem' : '0.92rem', lineHeight: 1.8,
            color: 'rgba(42,32,25,0.55)',
            margin: '0 0 2rem', padding: 0, border: 'none',
            fontStyle: 'italic',
            ...rv(0.3),
          }}>
            "I have been discovering facial yoga and natural rejuvenation techniques all over the world. I have received certifications from the best experts so that I can bring the most effective that the world of natural rejuvenation has to offer."
          </blockquote>

          <div style={{ ...rv(0.4) }}>
            <h3 style={{
              fontFamily: "var(--font-aktiv), serif",
              fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#8B6914', marginBottom: '0.5rem',
            }}>
              HARSIMRAT
            </h3>
            <p style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: '0.8rem', color: 'rgba(42,32,25,0.45)', lineHeight: 1.6,
            }}>
              instructor of facial yoga and natural<br />facial rejuvenation techniques
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
