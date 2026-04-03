'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flower2 } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isSignup?: boolean;
}

const AuthLayout = ({ children, title, subtitle, isSignup = false }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background font-sans overflow-hidden">
      {/* --- Left Pan (Decorative Split) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16 bg-primary-container/30 border-r border-outline-variant/50">
        {/* Abstract Background Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-40 blur-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(255,138,117,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,138,117,0.1) 0%, transparent 60%)'
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-md space-y-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md bg-primary/5 text-primary border border-primary/20">
              Face Yoga Sanctuary
            </div>
            
            <h2 className="text-6xl font-bold leading-[1.05] text-foreground" style={{ letterSpacing: '-0.04em' }}>
              Elevate your <br />
              <span className="text-primary italic">natural glow.</span>
            </h2>
            
            <p className="text-xl font-medium leading-relaxed text-warm-gray/80 max-w-[340px]">
              Discover the professional approach to facial wellness and timeless beauty.
            </p>
          </motion.div>

          <div className="flex gap-4">
             <div className="h-1 w-12 rounded-full bg-primary/30" />
             <div className="h-1 w-4 rounded-full bg-primary/10" />
             <div className="h-1 w-4 rounded-full bg-primary/10" />
          </div>
        </div>
      </div>

      {/* --- Right side (Form) --- */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-16 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] space-y-10"
        >
          {/* Logo Handle */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Flower2 className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground transition-all group-hover:opacity-80">Faceyoguez</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h1>
            <p className="text-warm-gray font-medium">
              {subtitle}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
