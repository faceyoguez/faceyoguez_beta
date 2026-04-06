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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <section style={{ 
      position: 'relative', 
      height: '100dvh', // Use dynamic viewport height
      maxHeight: '100dvh', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingBottom: isMobile ? '1rem' : '2rem',
      backgroundColor: 'transparent',
    }}>
      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '1.2rem 2rem 0.5rem' : '1.5rem 2.8rem 0.5rem',
        ...r(0),
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 300,
          letterSpacing: '0.03em', color: '#2a2019',
          fontStyle: 'italic',
        }}>
          faceyoguez
        </span>
      </nav>

      {/* Headline & Portrait Cluster */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : 'row',
        gridTemplateColumns: isMobile ? 'none' : 'minmax(200px, 1.2fr) auto minmax(200px, 1.2fr)',
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: isMobile ? '2rem' : '0',
        padding: isMobile ? '0 1.5rem' : '0 clamp(1.5rem, 5vw, 8rem)',
        maxWidth: 1800, width: '100%', margin: '0 auto',
        flex: 1,
      }}>
        {/* Left Headline (Stacked top on mobile) */}
        {!isMobile ? (
          <div style={{ alignSelf: 'center', transform: 'translateY(-2rem)', textAlign: 'right', paddingRight: '2.5rem' }}>
            <h1 style={{ ...hh, fontSize: 'clamp(2.2rem, 4.2vw, 5rem)' }}>
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <span style={{ display: 'block', ...c(1) }}>THE BEST</span>
              </span>
              <span style={{ display: 'block', overflow: 'hidden', paddingRight: '1.2em' }}>
                <span style={{ display: 'block', ...c(2) }}>MORE BEAUTIFUL</span>
              </span>
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <span style={{ display: 'block', ...c(3) }}>VERSION</span>
              </span>
            </h1>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h1 style={{ ...hh, fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', lineHeight: 1.25 }}>
              <span style={{ display: 'block', ...c(1) }}>THE BEST BEAUTIFUL</span>
              <span style={{ display: 'block', ...c(3) }}>VERSION</span>
            </h1>
          </div>
        )}

        {/* Center portrait */}
        <div style={{ 
          position: 'relative', ...r(2), 
          display: 'flex', flexDirection: 'column', alignItems: 'center' 
        }}>
          <div style={{
            width: isMobile ? '160px' : 'clamp(260px, 22vw, 360px)', 
            aspectRatio: '3/4.2',
            borderRadius: 6, overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04), 0 20px 60px -10px rgba(180,100,60,0.12), 0 40px 90px -20px rgba(0,0,0,0.08)',
          }}>
            <img
              src={HERO_IMAGE} alt="Face yoga portrait"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
            />
          </div>
        </div>

        {/* Right Headline (Stacked below on mobile) */}
        {!isMobile ? (
          <div style={{ alignSelf: 'center', textAlign: 'left', transform: 'translateY(2.5rem)', paddingLeft: '2.5rem' }}>
            <h2 style={{ ...hh, fontSize: 'clamp(2.2rem, 4.2vw, 5rem)' }}>
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <span style={{ display: 'block', ...c(4) }}>ALONE</span>
              </span>
              <span style={{ display: 'block', overflow: 'hidden', paddingLeft: '1.2em' }}>
                <span style={{ display: 'block', ...c(5) }}>YOURSELF</span>
              </span>
            </h2>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h2 style={{ ...hh, fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', lineHeight: 1.25 }}>
              <span style={{ display: 'block', ...c(4) }}>ALONE YOURSELF</span>
            </h2>
          </div>
        )}
      </div>

      {/* Tagline & Button Container */}
      <div style={{
        position: 'relative', zIndex: 5,
        textAlign: 'center', maxWidth: 480,
        margin: '0 auto', padding: isMobile ? '0 1.5rem 2rem' : '0 2rem 1.5rem',
        ...r(7),
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isMobile ? '0.85rem' : '0.95rem', lineHeight: 1.6,
          color: 'rgba(42,32,25,0.55)',
          fontWeight: 300,
          marginBottom: isMobile ? '1.2rem' : '1.5rem',
        }}>
          Authentic facial therapies designed for natural rejuvenation. <br className="hidden md:block" /> Awaken your natural beauty through the ancient art of face yoga.
        </p>

        <Link href="/auth/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: isMobile ? '0.6rem 1.8rem' : '0.65rem 2rem',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.65)',
          color: '#2a2019',
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 20px 0 rgba(183, 110, 121, 0.08)',
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)';
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(183, 110, 121, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.45)';
          e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(183, 110, 121, 0.08)';
        }}>
          LOG IN
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#B76E79' }} />
        </Link>
      </div>

      {/* Scroll arrow (Hidden on smaller mobiles to avoid clutter) */}
      {!isMobile && (
        <div style={{ position: 'absolute', bottom: '1.2rem', right: '2rem', zIndex: 10, ...r(8), opacity: 0.35 }}>
          <div className="nav-pill" style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(42,32,25,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3 5.5L7 9.5L11 5.5" stroke="#2a2019" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </section>
  );
}
