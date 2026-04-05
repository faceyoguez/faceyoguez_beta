'use client';

import { useState, useEffect, useRef } from 'react';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const SCRAMBLED_LINES = [
  'AWAKEN YOUR SKIN',
  'THROUGH THE GENTLE',
  'ART OF FACE YOGA',
  'AND MINDFUL TOUCH',
];

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

export function Philosophy() {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        padding: 'clamp(5rem, 10vw, 10rem) 0 clamp(5rem, 8vw, 8rem)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #F2BFA4 0%, #FDF5EE 12%, #FDF5EE 100%)',
      }}
    >
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1300, margin: '0 auto',
        padding: '0 clamp(2rem, 6vw, 7rem)',
      }}>
        {/* Large staggered text */}
        <div style={{ marginBottom: 'clamp(3rem, 5vw, 5rem)', overflow: 'hidden' }}>
          {SCRAMBLED_LINES.map((line, i) => (
            <div key={i} style={{ overflow: 'hidden' }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(2rem, 5.2vw, 4.8rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                color: '#2a2019',
                margin: 0,
                whiteSpace: 'nowrap',
                clipPath: inView ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
                transition: `clip-path 1.1s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12 + 0.1}s`,
              }}>
                {line}
              </p>
            </div>
          ))}
        </div>

        {/* Body copy — right aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: 380,
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 0.5s',
          }}>
            <p style={{
              fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: 'rgba(42, 32, 25, 0.55)',
              letterSpacing: '0.01em',
            }}>
              The path to natural beauty is an art that draws on a deep knowledge of facial yoga, massage therapies, and other methods that really work. Beauty is not just about what we see in the mirror, but about how we feel when we look at ourselves.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
