'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const GALLERY_IMAGES = [
  '/assets/carousel_img_1.PNG',
  '/assets/carousel_img_2.PNG',
  '/assets/carousel_img_3.PNG',
  '/assets/carousel_img_4.PNG',
  '/assets/carousel_img_5.PNG',
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
  const [isMobile, setIsMobile] = useState(false);
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const speed = 1.2;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useAnimationFrame(() => {
    baseX.set(baseX.get() + speed);
  });

  const cardWidth = isMobile ? 240 : 320;
  const gap = isMobile ? 20 : 40;
  const totalWidth = (cardWidth + gap) * DOUBLED_IMAGES.length;
  const wrapRange = Math.max(totalWidth, 3000);

  return (
    <section
      style={{
        position: 'relative', overflow: 'hidden', height: isMobile ? '65vh' : '80vh', minHeight: isMobile ? 450 : 600,
        background: 'transparent',
      }}
    >
      <div 
        ref={containerRef}
        style={{
          position: 'relative', zIndex: 2, height: '100%',
          perspective: isMobile ? '1000px' : '1500px', transformStyle: 'preserve-3d',
          maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {DOUBLED_IMAGES.map((src, i) => {
          // Inline calculation for mobile-aware motion values
          const x = useTransform(baseX, (val: number) => {
            let rawX = (val + i * (cardWidth + gap)) % wrapRange;
            if (rawX > wrapRange - cardWidth) rawX -= wrapRange;
            return rawX;
          });

          const scale = useTransform(x, [-300, isMobile ? 60 : 800, 1800], [0.8, 1.1, 0.8]);
          const opacity = useTransform(x, [-400, 0, 1600, 2000], [0, 1, 1, 0]);

          return (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                x,
                y: '-50%',
                width: cardWidth,
                aspectRatio: '3 / 4.2',
                borderRadius: isMobile ? 8 : 12,
                overflow: 'hidden',
                scale,
                opacity,
                rotateY: isMobile ? 15 : 25,
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
        })}
      </div>
    </section>
  );
}

