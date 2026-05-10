'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flower2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isSignup?: boolean;
}

const AuthLayout = ({ children, title, subtitle, isSignup = false }: AuthLayoutProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background font-jakarta overflow-hidden selection:bg-primary/20 selection:text-primary relative p-6">
      {/* Dynamic Background Elements (Always present) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="aura-glow-original opacity-30" />
        <div className="aura-glow-alt opacity-20" />
        
        {/* Abstract Background Orbs to maintain premium feel */}
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, 0],
            translateY: [0, 20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[20%] w-[60%] h-[60%] opacity-20 blur-[120px] pointer-events-none bg-primary/20"
        />
      </div>

      <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center">
        {/* Symmetrical Centered Logo */}
        <Link href="/" className="flex flex-col items-center gap-3 group mb-8">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/60 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-xl shadow-primary/10 border border-white/50 backdrop-blur-md">
            <Flower2 className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <span className="text-2xl font-sooner tracking-tight text-foreground transition-all group-hover:opacity-80">Faceyoguez</span>
        </Link>

        {/* Premium Symmetrical Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "w-full bg-white/60 p-8 sm:p-10 rounded-[3rem] backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_rgba(231,111,81,0.08)]",
            isSignup ? "space-y-6" : "space-y-8"
          )}
        >
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-primary/5 text-primary border border-primary/10 mx-auto mb-2">
              <Sparkles className="w-3 h-3" />
              Face Yoga Sanctuary
            </div>
            <h1 className={cn(
              "font-aktiv font-bold tracking-tight text-foreground leading-tight mx-auto",
              isSignup ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            )} style={{ letterSpacing: '-0.03em' }}>
              {title}
            </h1>
            <p className="text-warm-gray font-medium leading-relaxed text-sm sm:text-base mx-auto max-w-[300px]">
              {subtitle}
            </p>
          </div>

          <div className="w-12 h-1 bg-primary/20 rounded-full mx-auto my-6" />

          <div className={cn(isSignup ? "space-y-4" : "space-y-6")}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
