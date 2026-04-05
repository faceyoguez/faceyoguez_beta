'use client';

import { useState, useEffect, useRef } from 'react';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const PRELOADER_IMAGES = [
  '/assets/hero.jpg',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=350&h=500&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=350&h=500&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=350&h=500&fit=crop&crop=face&q=80',
];

interface LoaderProps {
  onComplete: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'exit' | 'done'>('loading');
  const [imgIdx, setImgIdx] = useState(0);
  const rafRef = useRef<number>(0);
  const t0Ref = useRef<number | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setImgIdx(i => (i + 1) % PRELOADER_IMAGES.length), 350);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const DUR = 2600;
    const tick = (ts: number) => {
      if (!t0Ref.current) t0Ref.current = ts;
      const t = Math.min((ts - t0Ref.current) / DUR, 1);
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase('exit');
        setTimeout(() => {
          setPhase('done');
          onComplete();
        }, 900);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#FDF5EE',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.06)' : 'scale(1)',
        transition: 'opacity 0.85s cubic-bezier(0.4,0,0,1), transform 0.85s cubic-bezier(0.4,0,0,1)',
      }}
    >
      <div style={{
        position: 'absolute', inset: '-60%', width: '220%', height: '220%',
        backgroundImage: NOISE_SVG,
        animation: 'noise-animation 0.4s steps(3) infinite',
        pointerEvents: 'none',
      }} />
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.15rem', letterSpacing: '0.3em',
        textTransform: 'lowercase', color: '#2a2019', opacity: 0.5,
        marginBottom: '2.5rem',
      }}>
        faceyoguez
      </p>
      <div style={{
        position: 'relative', width: 155, height: 215,
        borderRadius: 5, overflow: 'hidden', marginBottom: '2.5rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>
        {PRELOADER_IMAGES.map((src, i) => (
          <img
            key={i} src={src} alt="" loading="eager"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: i === imgIdx ? 1 : 0,
              transition: 'opacity 0.12s ease',
            }}
          />
        ))}
      </div>
      <div style={{ width: 155, height: 1, background: 'rgba(42,32,25,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #c9825e, #b06a48)',
          transition: 'width 0.08s linear',
        }} />
      </div>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '0.78rem', letterSpacing: '0.18em',
        color: 'rgba(42,32,25,0.3)', marginTop: '1rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {progress}%
      </p>
    </div>
  );
}
