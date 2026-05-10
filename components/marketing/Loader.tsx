'use client';

import { useState, useEffect, useRef } from 'react';

const PRELOADER_IMAGES = [
  '/assets/starter_img_1.jpg',
  '/assets/starter_img_2.jpg',
  '/assets/starter_img_3.jpg',

];

const DURATION_MS = 2300; // Decreased to make total loader sequence ~3 seconds
const IMG_INTERVAL_MS = 400; // Adjusted for shorter duration

interface LoaderProps {
  onComplete: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'exit' | 'done'>('loading');
  const [imgIdx, setImgIdx] = useState(0);
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const t0Ref = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Preload images in the background so they're ready before shown
  useEffect(() => {
    PRELOADER_IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Image cycling
  useEffect(() => {
    const iv = setInterval(() => setImgIdx(i => (i + 1) % PRELOADER_IMAGES.length), IMG_INTERVAL_MS);
    return () => clearInterval(iv);
  }, []);

  // Progress animation — throttled to ~30fps to reduce CPU usage
  useEffect(() => {
    const tick = (ts: number) => {
      if (!t0Ref.current) t0Ref.current = ts;

      // Throttle: only update state at ~30fps (33ms intervals)
      if (ts - lastUpdateRef.current > 33) {
        lastUpdateRef.current = ts;
        const t = Math.min((ts - t0Ref.current) / DURATION_MS, 1);
        setProgress(Math.round(t * 100));

        if (t >= 1) {
          setPhase('exit');
          setTimeout(() => {
            setPhase('done');
            onCompleteRef.current();
          }, 900);
          return; // stop RAF
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#FDF5EE',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.75s cubic-bezier(0.4,0,0,1), transform 0.75s cubic-bezier(0.4,0,0,1)',
        willChange: 'opacity, transform',
      }}
      role="status"
      aria-label="Loading Faceyoguez"
    >
      {/* Brand name */}
      <p style={{
        fontFamily: 'var(--font-sooner)',
        fontSize: '1.8rem', letterSpacing: '0.05em',
        textTransform: 'lowercase', color: '#2a2019', opacity: 0.8,
        marginBottom: '2rem',
      }}>
        faceyoguez
      </p>

      {/* Image crossfader — GPU-composited via CSS transitions */}
      <div style={{
        position: 'relative', width: 155, height: 215,
        borderRadius: 8, overflow: 'hidden', marginBottom: '2rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        backgroundColor: '#F0E8E0',
      }}>
        {PRELOADER_IMAGES.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            aria-hidden="true"
            width={155}
            height={215}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: i === imgIdx ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
              willChange: 'opacity',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ width: 155, height: 1, background: 'rgba(42,32,25,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #c9825e, #b06a48)',
          transition: 'width 0.4s ease-out',
        }} />
      </div>

      {/* Progress percentage */}
      <p style={{
        fontFamily: 'var(--font-jakarta)',
        fontSize: '0.72rem', letterSpacing: '0.18em',
        color: 'rgba(42,32,25,0.3)', marginTop: '0.75rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {progress}%
      </p>
    </div>
  );
}
