'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Users, Sparkles, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingDock() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { icon: Home, label: 'Programs', href: '/programs' },
    { icon: Sparkles, label: 'Experts', href: '/experts' },
    { icon: Users, label: 'Community', href: '/community' },
  ];

  return (
    <div className={cn(
      'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500',
      scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none',
    )}>
      <nav
        className="flex items-center gap-1 p-2 rounded-full shadow-xl"
        style={{
          backgroundColor: 'rgba(44, 37, 37, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(252, 244, 235, 0.1)',
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] tracking-[0.1em] uppercase transition-all duration-200"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(252, 244, 235, 0.7)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgb(252, 244, 235)';
              e.currentTarget.style.backgroundColor = 'rgba(252, 244, 235, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(252, 244, 235, 0.7)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(252, 244, 235, 0.15)' }} />
        <Link
          href="/auth/login"
          className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200"
          style={{ backgroundColor: 'rgb(249, 109, 65)', color: 'rgb(252, 244, 235)' }}
          aria-label="Sign in"
        >
          <LogIn className="w-4 h-4" />
        </Link>
      </nav>
    </div>
  );
}
