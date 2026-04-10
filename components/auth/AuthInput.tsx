'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const AuthInput = ({ label, error, isPassword, className, ...props }: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isTypePassword = props.type === 'password' || isPassword;

  return (
    <div className="space-y-2 w-full group">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray/80 transition-colors group-focus-within:text-primary pl-1">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          type={isTypePassword ? (showPassword ? 'text' : 'password') : props.type}
          className={cn(
            "w-full bg-white/40 sm:bg-white/50 backdrop-blur-md border border-outline-variant rounded-2xl px-5 py-3.5 sm:py-4 text-sm sm:text-base text-foreground placeholder:text-warm-gray/30 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400/5",
            className
          )}
        />
        {isTypePassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-warm-gray/60 hover:text-primary hover:bg-primary/5 transition-all"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPassword ? 'eye-off' : 'eye'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[11px] font-bold text-red-500 pl-2 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthInput;
