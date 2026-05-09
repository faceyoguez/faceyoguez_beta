'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';

// ✅ All 9 images have been moved to /public/assets as .jpg
const GALLERY_IMAGES = [
  '/assets/carousel_img_1.jpg',
  '/assets/carousel_img_2.jpg',
  '/assets/carousel_img_3.jpg',
  '/assets/carousel_img_4.jpg',
  '/assets/carousel_img_5.jpg',
  '/assets/carousel_img_6.jpg',
  '/assets/carousel_img_7.jpg',
  '/assets/carousel_img_8.jpg',
  '/assets/carousel_img_9.jpg',
];

// Double the images for a seamless loop
const DOUBLED_IMAGES = [...GALLERY_IMAGES, ...GALLERY_IMAGES];

interface LoopingCardProps {
  src: string;
  index: number;
  total: number;
  baseX: any;
  cardWidth: number;
  gap: number;
  wrapRange: number;
  isMobile: boolean;
}

function LoopingCard({ src, index, baseX, cardWidth, gap, wrapRange, isMobile }: LoopingCardProps) {
  const x = useTransform(baseX, (val: number) => {
    let rawX = (val + index * (cardWidth + gap)) % wrapRange;
    if (rawX > wrapRange - cardWidth) rawX -= wrapRange;
    return rawX;
  });

  // Perspective tilt based on position - reduced for mobile to prevent jitter
  const rotateY = useTransform(x, [-500, wrapRange / 2, wrapRange + 500], [isMobile ? 25 : 45, 0, isMobile ? -25 : -45]);
  const scale = useTransform(x, [-300, isMobile ? 60 : 800, 1800], [0.8, 1.1, 0.8]);
  const opacity = useTransform(x, [-400, 0, 1600, 2000], [0, 1, 1, 0]);

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
        borderRadius: isMobile ? 12 : 20,
        overflow: 'hidden',
        scale,
        opacity,
        rotateY,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <Image
        src={src}
        alt="Face wellness transformation result"
        fill
        sizes="(max-width: 768px) 220px, 340px"
        className="object-cover"
        priority={index < 3}
        draggable={false}
      />
    </motion.div>
  );
}

export function Gallery() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const baseX = useMotionValue(0);
  const speed = 50; // Speed in pixels per second
  const lastTime = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((time) => {
    if (!isVisible) {
      lastTime.current = time;
      return;
    }
    
    if (!lastTime.current) lastTime.current = time;
    const delta = (time - lastTime.current) / 1000;
    lastTime.current = time;

    // Frame-rate independent movement
    baseX.set(baseX.get() + speed * delta);
  });

  const cardWidth = isMobile ? 220 : 340;
  const gap = isMobile ? 16 : 32;
  const totalWidth = (cardWidth + gap) * DOUBLED_IMAGES.length;
  const wrapRange = totalWidth;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32 bg-transparent"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-12 mb-16 md:mb-24 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex flex-col items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#e76f51] mb-2">Real Results</span>
            <div className="w-12 h-[1px] bg-[#e76f51]/20" />
          </div>

          <h2 className="text-4xl md:text-6xl font-aktiv text-[#2a2019] font-bold leading-[1.1] tracking-tight">
            What 21 Days of <br className="hidden md:block" /> Face Wellness Looks Like
          </h2>

          <p className="text-base md:text-xl text-[#2a2019]/60 font-jakarta leading-relaxed max-w-2xl mx-auto">
            These aren't filters. These aren't edited. These are women — just like you — who committed to the practice and let their faces do the rest.
          </p>
        </motion.div>
      </div>

      <div
        className="relative"
        style={{
          height: isMobile ? '450px' : '600px',
          perspective: isMobile ? '1200px' : '2000px',
          transformStyle: 'preserve-3d',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          willChange: 'transform',
        }}
      >
        {DOUBLED_IMAGES.map((src, i) => (
          <LoopingCard
            key={i}
            src={src}
            index={i}
            total={DOUBLED_IMAGES.length}
            baseX={baseX}
            cardWidth={cardWidth}
            gap={gap}
            wrapRange={wrapRange}
            isMobile={isMobile}
          />
        ))}
      </div>
    </section>
  );
}
