'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Users, Sparkles, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingDock() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { icon: Home, label: 'Programs', href: '#' },
    { icon: Sparkles, label: 'Our Experts', href: '#' },
    { icon: Users, label: 'Community', href: '#' },
  ];

  return (
    <div className={cn(
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
      scrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
    )}>
      <nav className="flex items-center gap-2 bg-white/70 backdrop-blur-2xl border border-slate-200 p-2 rounded-full shadow-2xl">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-slate-600 hover:text-[#FF8A75] hover:bg-[#FF8A75]/10 transition-all"
          >
            <item.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
        <div className="w-px h-6 bg-slate-200 mx-2" />
        <Link
          href="/auth/login"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FF8A75] text-white hover:bg-[#FF8A75]/90 hover:scale-105 shadow-xl shadow-[#FF8A75]/20 transition-all"
        >
          <LogIn className="w-5 h-5 ml-1" />
        </Link>
      </nav>
    </div>
  );
}
