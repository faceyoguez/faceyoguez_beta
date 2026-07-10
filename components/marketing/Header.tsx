'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flower2, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // passive: true = browser doesn't wait for JS before scrolling → no jank
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainLinks: { name: string; href: string }[] = [];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-6 md:px-12',
        // Use transform-based properties only (GPU composited, no layout recalc)
        'transition-[padding,background-color,border-color] duration-300',
        scrolled ? 'py-3' : 'py-5',
      )}
      style={{
        backgroundColor: scrolled ? 'rgba(252, 244, 235, 0.92)' : 'transparent',
        // Reduce blur: blur(12px) is far lighter than blur(20px) on mobile
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
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
            className="text-lg font-sooner tracking-tight"
            style={{ color: 'rgb(44, 37, 37)' }}
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
                fontFamily: 'var(--font-aktiv)',
                fontSize: '15px',
                fontWeight: 600,
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

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/auth/login"
            className="transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-aktiv)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'rgb(44, 37, 37)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(249, 109, 65)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(44, 37, 37)'; }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2.5 rounded-full text-[13px] tracking-[0.05em] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              fontFamily: 'var(--font-jakarta)',
              fontWeight: 700,
              backgroundColor: 'rgb(44, 37, 37)',
              color: 'rgb(252, 244, 235)',
            }}
          >
            Book a Session
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg active:bg-black/5 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{ color: 'rgb(44, 37, 37)' }}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/*
        Mobile Menu — CSS-only transition (no Framer Motion).
        Framer Motion's exit animation was blocking navigation by 250ms.
        CSS transitions are composited on the GPU and don't block the main thread.
      */}
      <div
        className={cn(
          'absolute top-full left-0 right-0 p-8 flex flex-col gap-5 md:hidden border-b',
          'transition-[opacity,transform] duration-200 ease-out',
          menuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
        style={{
          backgroundColor: 'rgba(252, 244, 235, 0.97)',
          // Removed heavy backdrop-filter from mobile menu — not needed with opaque bg
          borderColor: 'rgba(44, 37, 37, 0.08)',
        }}
      >
        {mainLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: 'var(--font-aktiv)',
              fontSize: '24px',
              fontWeight: 600,
              color: 'rgb(44, 37, 37)',
            }}
          >
            {link.name}
          </Link>
        ))}
        <div className="h-px" style={{ backgroundColor: 'rgba(44, 37, 37, 0.1)' }} />

        {/* Sign In — navigates instantly, menu closes after */}
        <Link
          href="/auth/login"
          className="text-center active:opacity-70 transition-opacity"
          onClick={() => setMenuOpen(false)}
          style={{
            fontFamily: 'var(--font-aktiv)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'rgb(44, 37, 37)',
          }}
        >
          Sign In
        </Link>

        {/* Book a Session — navigates instantly */}
        <Link
          href="/auth/signup"
          className="px-6 py-3.5 rounded-full text-center text-[13px] tracking-[0.05em] active:scale-[0.98] transition-transform"
          onClick={() => setMenuOpen(false)}
          style={{
            fontFamily: 'var(--font-jakarta)',
            fontWeight: 700,
            backgroundColor: 'rgb(44, 37, 37)',
            color: 'rgb(252, 244, 235)',
          }}
        >
          Book a Session
        </Link>
      </div>
    </header>
  );
}
