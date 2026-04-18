'use client';

import { motion } from 'framer-motion';

/**
 * Highly optimized luxury background.
 * Uses hardware acceleration and simplified blurs to prevent scroll lag.
 */
export function LuxuryBackground() {
  return (
    <div
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none overflow-hidden bg-[#FDF5EE]"
    >
      {/* Rosegold Orb 1 - Optimized size and blur */}
      <motion.div
        animate={{
          x: ["-10%", "20%", "60%", "30%", "-10%"],
          y: ["-10%", "40%", "20%", "70%", "5%"],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
          repeatType: "mirror"
        }}
        className="absolute w-[800px] h-[800px] rounded-full blur-[100px] opacity-[0.35] bg-[#B76E79] mix-blend-multiply will-change-transform"
        style={{ willChange: 'transform' }}
      />

      {/* Peach Orb 2 - Optimized size and blur */}
      <motion.div
        animate={{
          x: ["90%", "10%", "-10%", "70%", "50%"],
          y: ["-10%", "90%", "40%", "5%", "80%"],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
          repeatType: "mirror",
          delay: 2
        }}
        className="absolute w-[900px] h-[900px] rounded-full blur-[120px] opacity-[0.4] bg-[#FFDAB9] mix-blend-multiply will-change-transform"
        style={{ willChange: 'transform' }}
      />

      {/* White/Light Rose Orb 3 - Optimized size and blur */}
      <motion.div
        animate={{
          x: ["-10%", "80%", "30%", "-10%", "60%"],
          y: ["80%", "10%", "90%", "30%", "-5%"],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
          repeatType: "mirror",
          delay: 4
        }}
        className="absolute w-[1000px] h-[1000px] rounded-full blur-[140px] opacity-[0.3] bg-[#FFFFFF] mix-blend-overlay will-change-transform"
        style={{ willChange: 'transform' }}
      />

      {/* Surface Gloss Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#B76E79]/10 mix-blend-soft-light" />
      
      {/* Noise Texture - Static and lightweight */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />
    </div>
  );
}
