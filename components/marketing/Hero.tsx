'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Removed NOISE_SVG for performance

const HERO_IMAGE = '/assets/hero.jpg';

interface HeroProps {
  visible: boolean;
}

export function Hero({ visible }: HeroProps) {
  const [rev, setRev] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setRev(true), 80);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  const r = (i: number): React.CSSProperties => ({
    opacity: rev ? 1 : 0,
    transform: rev ? 'translateY(0)' : 'translateY(55px)',
    transition: `opacity 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.1 + 0.05}s, transform 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.1 + 0.05}s`,
  });

  const c = (i: number): React.CSSProperties => ({
    clipPath: rev ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
    transition: `clip-path 1s cubic-bezier(0.22,1,0.36,1) ${i * 0.12 + 0.1}s`,
  });

  const pill: React.CSSProperties = {
    padding: '0.5rem 1.5rem', borderRadius: 999,
    border: '1px solid rgba(42,32,25,0.14)', background: 'transparent',
    cursor: 'pointer', fontFamily: "'Cormorant Garamond', serif",
    fontSize: '0.88rem', letterSpacing: '0.04em', color: '#2a2019',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
    fontWeight: 300,
  };

  const hh: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 300,
    fontSize: 'clamp(2.2rem, 4.4vw, 4.8rem)',
    lineHeight: 1.1,
    color: '#2a2019',
    margin: 0,
    letterSpacing: '0.01em',
  };

  return (
    <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '1.6rem 2.8rem',
        ...r(0),
      }}>
        <div style={{ flex: 1 }}>
          <button className="nav-pill" style={pill}>Menu</button>
        </div>
        
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.65rem', fontWeight: 300,
          letterSpacing: '0.03em', color: '#2a2019',
          fontStyle: 'italic',
          flex: '0 0 auto',
          textAlign: 'center',
        }}>
          faceyoguez
        </span>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/auth/signup" className="nav-pill" style={{ ...pill, gap: '0.45rem' }}>
            Reservations
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 9.5L9.5 1.5M9.5 1.5H3.5M9.5 1.5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* 3-column headline grid */}
      <div style={{
        position: 'relative', zIndex: 5, flex: 1,
        display: 'grid', gridTemplateColumns: 'minmax(200px, 1.3fr) auto minmax(200px, 1.3fr)',
        alignItems: 'center',
        padding: '0 clamp(1.5rem,5vw,7rem)',
        maxWidth: 1800, width: '100%', margin: '0 auto',
        minHeight: 'calc(100vh - 160px)',
      }}>
        {/* Left */}
        <div style={{ alignSelf: 'center', transform: 'translateY(-2rem)' }}>
          <h1 style={hh}>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span style={{ display: 'block', ...c(1) }}>THE BEST</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden', paddingLeft: '1.8em' }}>
              <span style={{ display: 'block', ...c(2) }}>MORE BEAUTIFUL</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span style={{ display: 'block', ...c(3) }}>VERSION</span>
            </span>
          </h1>
        </div>

        {/* Center portrait */}
        <div style={{ 
          position: 'relative', ...r(2), 
          display: 'flex', flexDirection: 'column', alignItems: 'center' 
        }}>
          <div style={{
            width: 'clamp(220px, 18vw, 340px)', aspectRatio: '3/4.2',
            borderRadius: 6, overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04), 0 20px 60px -10px rgba(180,100,60,0.12), 0 40px 90px -20px rgba(0,0,0,0.08)',
          }}>
            <img
              src={HERO_IMAGE} alt="Face yoga portrait"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
            />
          </div>
        </div>

        {/* Right */}
        <div style={{ alignSelf: 'center', textAlign: 'left', transform: 'translateY(1rem)', paddingLeft: '1.5rem' }}>
          <h2 style={hh}>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span style={{ display: 'block', ...c(4) }}>ALONE</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden', paddingLeft: '1.4em' }}>
              <span style={{ display: 'block', ...c(5) }}>YOURSELF</span>
            </span>
          </h2>
        </div>
      </div>

      {/* Tagline */}
      <div style={{
        position: 'relative', zIndex: 5,
        textAlign: 'center', maxWidth: 520,
        margin: '-2rem auto 0', padding: '0 2rem 3.5rem',
        ...r(7),
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.05rem', lineHeight: 1.75,
          color: 'rgba(42,32,25,0.55)',
          fontWeight: 300,
        }}>
          Authentic facial therapies designed for natural rejuvenation. Awaken your natural beauty through the ancient art of face yoga.
        </p>
      </div>

      {/* Scroll arrow */}
      <div style={{ position: 'absolute', bottom: '2rem', right: '2.8rem', zIndex: 10, ...r(8) }}>
        <div className="nav-pill" style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid rgba(42,32,25,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.45 }}>
            <path d="M3 5.5L7 9.5L11 5.5" stroke="#2a2019" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
