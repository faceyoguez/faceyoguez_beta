'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-20 bg-[#FFFAF7]">
      {/* Background Zen Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-10 bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.08)_0%,transparent_50%)] blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.05)_0%,transparent_60%)] -translate-y-1/2 translate-x-1/3 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,250,247,0.8)_0%,transparent_60%)] translate-y-1/3 -translate-x-1/4 blur-2xl rounded-full" />
      
      <div className="max-w-4xl w-full text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 border border-white/80 shadow-sm text-[#FF8A75] text-xs font-bold tracking-widest uppercase backdrop-blur-xl">
          <Sparkles className="w-4 h-4" />
          Faceyoguez — Face Yoga for Women
        </div>
        
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-slate-900 leading-[1.05]">
            Natural <br className="hidden md:block" />
            <span className="text-[#FF8A75] font-bold">Face Yoga</span> for a Younger, Glowing You
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 font-light leading-relaxed">
            Expert-led face yoga classes online — lift, tone & glow naturally. No surgery, no filters, just results.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
          <Link
            href="/auth/signup"
            className="group relative px-12 py-5 rounded-full bg-[#FF8A75] text-white font-bold tracking-wide text-sm shadow-xl shadow-[#FF8A75]/20 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl hover:shadow-[#FF8A75]/30"
          >
            Start Your Free Trial
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="#discover"
            className="group flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#FF8A75] transition-colors"
          >
            See How It Works
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Decorative Floating Mirrors - Aesthetic Placeholders */}
      <div className="mt-28 grid grid-cols-3 gap-6 w-full max-w-6xl h-48 md:h-96 -mb-24 px-4 opacity-80 transition-all duration-1000 z-0">
        <div className="rounded-[3rem] bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl transition-all hover:-translate-y-4 hover:rotate-1" />
        <div className="rounded-[4rem] bg-gradient-to-t from-white/80 to-white/20 backdrop-blur-3xl border border-white/50 shadow-xl transition-all hover:-translate-y-8 -mt-12" />
        <div className="rounded-[3rem] bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl transition-all hover:-translate-y-4 hover:-rotate-1 mt-8" />
      </div>
    </section>
  );
}
