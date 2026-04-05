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
      {/* Rosegold Orb 1 - Bouncing Corner to Corner */}
      <motion.div
        animate={{
          x: ["-10%", "110%", "-10%"],
          y: ["-10%", "110%", "50%"],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ x: orb1X, y: orb1Y }}
        className="absolute w-[800px] h-[800px] rounded-full blur-[160px] opacity-20 bg-[#B76E79]"
      />

      {/* Peach Orb 2 - Bouncing Corner to Corner */}
      <motion.div
        animate={{
          x: ["110%", "-10%", "110%"],
          y: ["-10%", "110%", "10%"],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
          delay: 2
        }}
        style={{ x: orb2X, y: orb2Y }}
        className="absolute w-[900px] h-[900px] rounded-full blur-[180px] opacity-25 bg-[#FFDAB9]"
      />

      {/* White/Light Rose Orb 3 - Bouncing Corner to Corner */}
      <motion.div
        animate={{
          x: ["50%", "110%", "-10%", "50%"],
          y: ["110%", "-10%", "110%", "110%"],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
          delay: 5
        }}
        style={{ x: orb3X, y: orb3Y }}
        className="absolute w-[1000px] h-[1000px] rounded-full blur-[200px] opacity-30 bg-[#FFFFFF]"
      />

      {/* Surface Gloss Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-[#B76E79]/5 mix-blend-soft-light" />
      
      {/* Noise Texture for Luxury Material Feel */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />
    </div>
  );
}
