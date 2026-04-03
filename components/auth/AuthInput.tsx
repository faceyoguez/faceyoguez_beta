'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const AuthInput = ({ label, error, isPassword, className, ...props }: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isTypePassword = props.type === 'password' || isPassword;

  return (
    <div className="space-y-2.5 w-full group">
      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-warm-gray transition-colors group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          type={isTypePassword ? (showPassword ? 'text' : 'password') : props.type}
          className={`
            w-full bg-white/50 backdrop-blur-sm border border-outline-variant rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-warm-gray/40 
            outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}
            ${className}
          `}
        />
        {isTypePassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-warm-gray hover:text-primary hover:bg-primary/5 transition-all"
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
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] font-bold text-red-500 pl-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthInput;
