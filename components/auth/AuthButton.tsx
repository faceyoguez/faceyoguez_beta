'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps extends HTMLMotionProps<"button"> {
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'social';
  icon?: React.ReactNode;
}

const AuthButton = ({ children, loading, variant = 'primary', icon, className, ...props }: AuthButtonProps) => {
  const baseStyles = "w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#FF8A75] text-white shadow-xl shadow-[#FF8A75]/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-[#FF8A75]/30",
    outline: "bg-surface border border-outline-variant text-foreground hover:bg-surface-container-low hover:-translate-y-0.5 shadow-sm hover:shadow-md",
    social: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5"
  };

  return (
    <motion.button
      {...props}
      whileHover={!loading && !props.disabled ? { y: -2, scale: 1.01 } : {}}
      whileTap={!loading && !props.disabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default AuthButton;
