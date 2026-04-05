'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&h=840&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&h=840&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=840&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=840&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=840&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=840&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=840&fit=crop&crop=face&q=80',
];

// Double the images for a seamless loop
const DOUBLED_IMAGES = [...GALLERY_IMAGES, ...GALLERY_IMAGES];

interface LoopingCardProps {
  src: string;
  index: number;
  total: number;
  baseX: any;
}

function LoopingCard({ src, index, total, baseX }: LoopingCardProps) {
  const cardWidth = 320;
  const gap = 40;
  const totalWidth = (cardWidth + gap) * total;
  
  // Wrap range to ensure it covers screens up to 2560px+ with buffer
  const wrapRange = Math.max(totalWidth, 3000);
  
  // Calculate relative position in the marquee
  const x = useTransform(baseX, (val: number) => {
    let rawX = (val + index * (cardWidth + gap)) % wrapRange;
    // If it goes past the end of the wrap boundary, snap back to start
    if (rawX > wrapRange - cardWidth) rawX -= wrapRange;
    return rawX;
  });

  // Balanced growth: peaks in the center of a typical screen
  const scale = useTransform(x, [-400, 800, 2000], [0.75, 1.15, 0.75]);
  const opacity = useTransform(x, [-450, -100, 1800, 2200], [0, 1, 1, 0]);
  // Tilted at 25 degrees for a sleek editorial feel
  const rotateY = 25;

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        x,
        y: '-50%',
        width: cardWidth,
        aspectRatio: '3 / 4.2',
        borderRadius: 12,
        overflow: 'hidden',
        scale,
        opacity,
        rotateY,
        transformStyle: 'preserve-3d',
        boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 4px 14px rgba(0,0,0,0.06)',
      }}
    >
      <img
        src={src} alt="Face yoga"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </motion.div>
  );
}

export function Gallery() {
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const speed = 0.6; // Speed for LTR move

  useAnimationFrame(() => {
    baseX.set(baseX.get() + speed);
  });

  return (
    <section
      style={{
        position: 'relative', overflow: 'hidden', height: '80vh', minHeight: 600,
        background: 'linear-gradient(180deg, #FDF5EE 0%, #FAE0D0 25%, #F0A88A 55%, #ECA482 75%, #FDF5EE 100%)',
      }}
    >
      {/* Noise */}
      <div style={{
        position: 'absolute', inset: '-60%', width: '220%', height: '220%',
        backgroundImage: NOISE_SVG,
        animation: 'noise-animation 0.6s steps(4) infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      <div 
        ref={containerRef}
        style={{
          position: 'relative', zIndex: 2, height: '100%',
          perspective: '1500px', transformStyle: 'preserve-3d',
          maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {DOUBLED_IMAGES.map((src, i) => (
          <LoopingCard 
            key={i} 
            src={src} 
            index={i} 
            total={DOUBLED_IMAGES.length} 
            baseX={baseX} 
          />
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: '2rem', right: '4rem', zIndex: 3,
        width: 80, height: 1,
        background: 'rgba(200,100,60,0.2)',
        transform: 'rotate(-35deg)', transformOrigin: 'right center',
      }} />
    </section>
  );
}

