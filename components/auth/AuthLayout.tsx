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
    <div className="flex min-h-[100dvh] bg-background font-jakarta overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Elements (Always present) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="aura-glow-original opacity-20 lg:opacity-30" />
        <div className="aura-glow-alt opacity-10 lg:opacity-20" />
      </div>

      {/* --- Left Pan (Decorative Split) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 xl:p-20 bg-primary-container/20 border-r border-outline-variant/30">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_var(--primary-container)_0%,_transparent_70%)]"
        />
        
        {/* Abstract Background Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, 0],
            translateY: [0, 20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-30 blur-[120px] pointer-events-none bg-primary/20"
          style={{
            background: 'radial-gradient(circle at 20% 20%, var(--primary) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--primary) 0%, transparent 60%)'
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-lg space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-xl bg-white/40 text-primary border border-primary/10 shadow-sm shadow-primary/5">
              <Sparkles className="w-3 h-3" />
              Face Yoga Sanctuary
            </div>
            
            <div className="space-y-6">
              <h2 className="text-5xl xl:text-7xl font-aktiv font-bold leading-[1.02] text-foreground tracking-[-0.03em]">
                {isSignup ? "Start your" : "Elevate your"} <br />
                <span className="text-primary italic">
                  {isSignup ? "transformation." : "natural glow."}
                </span>
              </h2>
              
              <p className="text-lg xl:text-xl font-medium leading-relaxed text-warm-gray/90 max-w-[420px]">
                {isSignup 
                  ? "Join our community and discover the professional secrets to facial longevity."
                  : "Discover the professional approach to facial wellness and timeless beauty."
                }
              </p>
            </div>
          </motion.div>

          <div className="flex gap-4 pt-4">
             <div className="h-1.5 w-16 rounded-full bg-primary/40" />
             <div className="h-1.5 w-6 rounded-full bg-primary/10" />
             <div className="h-1.5 w-6 rounded-full bg-primary/10" />
          </div>

          {/* Testimonial/Badge Sub-text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-12 border-t border-primary/5 flex items-center gap-4 text-warm-gray/60"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-primary-container flex items-center justify-center text-[10px] font-bold">
                  {i === 1 ? 'A' : i === 2 ? 'M' : 'S'}
                </div>
              ))}
            </div>
            <p className="text-xs font-medium tracking-tight">Joined by 2,000+ practitioners</p>
          </motion.div>
        </div>
      </div>

      {/* --- Right side (Form) --- */}
      <div className="flex flex-1 flex-col z-10 relative overflow-hidden h-[100dvh]">
        {/* Background gradient for mobile */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-primary-container/20 to-background pointer-events-none" />

        <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "w-full max-w-[440px] bg-white/20 lg:bg-transparent p-8 sm:p-10 lg:p-0 rounded-[3rem] backdrop-blur-3xl lg:backdrop-blur-none border border-white/40 lg:border-none shadow-2xl shadow-primary/5 lg:shadow-none",
              isSignup ? "space-y-6 lg:space-y-8" : "space-y-10 lg:space-y-12"
            )}
          >
            {/* Logo Handle */}
            <div className="flex items-center justify-between lg:justify-start gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-lg shadow-primary/5">
                  <Flower2 className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
                </div>
                <span className="text-xl sm:text-2xl font-sooner tracking-tight text-foreground transition-all group-hover:opacity-80">Faceyoguez</span>
              </Link>
            </div>

            <div className={cn("space-y-2", isSignup ? "lg:space-y-3" : "space-y-3")}>
              <h1 className={cn(
                "font-aktiv font-bold tracking-tight text-foreground leading-tight",
                isSignup ? "text-2xl sm:text-3xl xl:text-4xl" : "text-3xl sm:text-4xl xl:text-5xl"
              )} style={{ letterSpacing: '-0.03em' }}>
                {title}
              </h1>
              <p className={cn(
                "text-warm-gray font-medium leading-relaxed",
                isSignup ? "text-sm sm:text-base max-w-[300px]" : "text-base sm:text-lg max-w-[340px]"
              )}>
                {subtitle}
              </p>
            </div>

            <div className={cn(isSignup ? "space-y-4" : "space-y-6")}>
              {children}
            </div>
            
            {/* Mobile Footer Spacing */}
            <div className="lg:hidden h-2" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
