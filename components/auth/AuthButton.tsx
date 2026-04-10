'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthButtonProps extends HTMLMotionProps<"button"> {
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'social';
  icon?: React.ReactNode;
}

const AuthButton = ({ children, loading, variant = 'primary', icon, className, ...props }: AuthButtonProps) => {
  const baseStyles = "w-full group relative flex items-center justify-center gap-3 py-3.5 sm:py-4 rounded-2xl sm:rounded-[1.25rem] text-sm sm:text-base font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/30",
    outline: "bg-white/40 backdrop-blur-md border border-outline-variant text-foreground hover:bg-white/60 hover:-translate-y-0.5 shadow-sm hover:shadow-md",
    social: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5"
  };

  return (
    <motion.button
      {...props}
      whileHover={!loading && !props.disabled ? { y: -2, scale: 1.01 } : {}}
      whileTap={!loading && !props.disabled ? { scale: 0.98 } : {}}
      className={cn(baseStyles, variants[variant], className)}
      disabled={loading || props.disabled}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0 transition-transform group-hover:scale-110">{icon}</span>}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </motion.button>
  );
};

export default AuthButton;
