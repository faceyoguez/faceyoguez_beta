'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flower2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainLinks: { name: string; href: string }[] = [];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 md:px-12',
        scrolled ? 'py-3' : 'py-5',
      )}
      style={{
        backgroundColor: scrolled ? 'rgba(252, 244, 235, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(44, 37, 37, 0.08)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ backgroundColor: 'rgba(249, 109, 65, 0.1)' }}
          >
            <Flower2 className="h-4 w-4" strokeWidth={1.5} style={{ color: 'rgb(249, 109, 65)' }} />
          </div>
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: 'rgb(44, 37, 37)', fontFamily: 'Inter, sans-serif' }}
          >
            Faceyoguez
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {mainLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative group transition-colors duration-200"
              style={{
                fontFamily: '"Cormorant Garamond", "Georgia", serif',
                fontSize: '16px',
                fontWeight: 500,
                color: 'rgb(44, 37, 37)',
              }}
            >
              {link.name}
              <span
                className="absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: 'rgb(249, 109, 65)' }}
              />
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/auth/login"
            className="transition-colors duration-200"
            style={{
              fontFamily: '"Cormorant Garamond", "Georgia", serif',
              fontSize: '15px',
              fontWeight: 500,
              color: 'rgb(44, 37, 37)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(249, 109, 65)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(44, 37, 37)'; }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2.5 rounded-full text-[13px] tracking-[0.05em] transition-all duration-300 hover:scale-[1.03]"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              backgroundColor: 'rgb(44, 37, 37)',
              color: 'rgb(252, 244, 235)',
            }}
          >
            Book a Session
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ color: 'rgb(44, 37, 37)' }}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute top-full left-0 right-0 p-8 flex flex-col gap-5 md:hidden border-b"
            style={{
              backgroundColor: 'rgba(252, 244, 235, 0.97)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(44, 37, 37, 0.08)',
            }}
          >
            {mainLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: '"Cormorant Garamond", "Georgia", serif',
                  fontSize: '20px',
                  fontWeight: 400,
                  color: 'rgb(44, 37, 37)',
                }}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-px" style={{ backgroundColor: 'rgba(44, 37, 37, 0.1)' }} />
            <Link
              href="/auth/login"
              className="text-center"
              style={{
                fontFamily: '"Cormorant Garamond", "Georgia", serif',
                fontSize: '16px',
                color: 'rgb(44, 37, 37)',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-3.5 rounded-full text-center text-[13px] tracking-[0.05em]"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                backgroundColor: 'rgb(44, 37, 37)',
                color: 'rgb(252, 244, 235)',
              }}
            >
              Book a Session
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
