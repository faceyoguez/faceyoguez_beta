'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * Highly optimized luxury background.
 * Uses hardware acceleration and simplified blurs to prevent scroll lag.
 */
export function LuxuryBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 w-full h-full -z-20 bg-[#FDF5EE]" />;
  }

  return (
    <div
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none overflow-hidden bg-[#FDF5EE]"
    >
      {/* Premium Bouncy Orbs */}
      <motion.div
        animate={{
          x: ["-25%", "40%", "15%", "60%", "-15%"],
          y: ["-15%", "60%", "25%", "90%", "0%"],
          scale: [1, 1.4, 0.8, 1.2, 1],
          borderRadius: ["40% 60% 70% 30%", "60% 40% 30% 70%", "40% 60% 70% 30%"]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform" }}
        className="absolute w-[800px] h-[800px] rounded-full blur-[100px] opacity-[0.35] bg-gradient-to-br from-[#B76E79] to-[#FF8A75] mix-blend-multiply"
      />

      <motion.div
        animate={{
          x: ["120%", "50%", "90%", "30%", "100%"],
          y: ["20%", "70%", "20%", "100%", "40%"],
          scale: [1.2, 0.9, 1.4, 1, 1.2],
          borderRadius: ["30% 70% 40% 60%", "70% 30% 60% 40%", "30% 70% 40% 60%"]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        style={{ willChange: "transform" }}
        className="absolute w-[900px] h-[900px] rounded-full blur-[120px] opacity-[0.4] bg-gradient-to-tr from-[#FFDAB9] to-[#FFE4E1] mix-blend-multiply"
      />

      <motion.div
        animate={{
          x: ["-15%", "80%", "40%", "-15%", "60%"],
          y: ["90%", "30%", "100%", "50%", "80%"],
          scale: [1, 1.5, 1.2, 1.4, 1],
          borderRadius: ["50% 50% 30% 70%", "30% 70% 70% 30%", "50% 50% 30% 70%"]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{ willChange: "transform" }}
        className="absolute w-[1000px] h-[1000px] rounded-full blur-[140px] opacity-[0.3] bg-gradient-to-bl from-[#FFFFFF] to-[#F5E6E8] mix-blend-overlay"
      />

      {/* Surface Gloss & Noise */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#B76E79]/5 mix-blend-overlay" />
      
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />

      {/* Global Bouncy Mesh Gradient Overlay */}
      <motion.div 
        animate={{
          background: [
            "radial-gradient(at 0% 0%, rgba(183, 110, 121, 0.05) 0px, transparent 50%)",
            "radial-gradient(at 100% 100%, rgba(255, 138, 117, 0.05) 0px, transparent 50%)",
            "radial-gradient(at 0% 100%, rgba(183, 110, 121, 0.05) 0px, transparent 50%)",
            "radial-gradient(at 0% 0%, rgba(183, 110, 121, 0.05) 0px, transparent 50%)",
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0"
      />
    </div>
  );
}

