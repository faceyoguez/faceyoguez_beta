'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flower2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Programs', href: '/programs' },
    { name: 'Experts', href: '/experts' },
    { name: 'Community', href: '/community' },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75] transition-transform group-hover:scale-110">
            <Flower2 className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Faceyoguez</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-600 hover:text-[#FF8A75] transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF8A75] transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            href="/auth/login" 
            className="text-sm font-bold text-slate-700 hover:text-[#FF8A75] transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/auth/signup" 
            className="px-6 py-2.5 rounded-full bg-[#FF8A75] text-white text-sm font-bold shadow-lg shadow-[#FF8A75]/20 hover:scale-105 transition-all active:scale-95"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-6 md:hidden shadow-xl"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className="text-lg font-bold text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-px bg-slate-100" />
            <div className="flex flex-col gap-4">
              <Link href="/auth/login" className="text-center font-bold text-slate-700 py-2">
                Log in
              </Link>
              <Link href="/auth/signup" className="px-6 py-4 rounded-2xl bg-[#FF8A75] text-white text-center font-bold">
                Start Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
