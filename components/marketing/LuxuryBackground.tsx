'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

export function LuxuryBackground() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smoothing the scroll progress for background transitions
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Animated transforms based on scroll
  const orb1X = useTransform(smoothProgress, [0, 1], ["0%", "50%"]);
  const orb1Y = useTransform(smoothProgress, [0, 1], ["0%", "80%"]);
  const orb2X = useTransform(smoothProgress, [0, 1], ["100%", "20%"]);
  const orb2Y = useTransform(smoothProgress, [0, 1], ["0%", "60%"]);
  const orb3X = useTransform(smoothProgress, [0, 1], ["50%", "80%"]);
  const orb3Y = useTransform(smoothProgress, [0, 1], ["100%", "20%"]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden bg-[#FDF5EE]"
    >
      {/* Rosegold Orb 1 - Complex Random Pattern */}
      <motion.div
        animate={{
          x: ["-20%", "40%", "120%", "60%", "-30%"],
          y: ["-20%", "80%", "40%", "140%", "10%"],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[1200px] h-[1200px] rounded-full blur-[180px] opacity-[0.45] bg-[#B76E79] mix-blend-multiply"
      />

      {/* Peach Orb 2 - Complex Random Pattern */}
      <motion.div
        animate={{
          x: ["130%", "20%", "-20%", "100%", "70%"],
          y: ["-20%", "130%", "60%", "10%", "110%"],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
        className="absolute w-[1400px] h-[1400px] rounded-full blur-[200px] opacity-[0.5] bg-[#FFDAB9] mix-blend-multiply"
      />

      {/* White/Light Rose Orb 3 - Complex Random Pattern */}
      <motion.div
        animate={{
          x: ["-20%", "110%", "40%", "-20%", "80%"],
          y: ["110%", "20%", "120%", "50%", "-10%"],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6
        }}
        className="absolute w-[1600px] h-[1600px] rounded-full blur-[220px] opacity-[0.4] bg-[#FFFFFF] mix-blend-overlay"
      />

      {/* Surface Gloss Gradient Overlay - Darkened */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-[#B76E79]/15 mix-blend-soft-light" />
      
      {/* Noise Texture for Luxury Material Feel */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />
    </div>
  );
}
