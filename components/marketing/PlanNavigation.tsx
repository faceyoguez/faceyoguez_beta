'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Map, Globe, Wind } from 'lucide-react';

interface PlanNavigationProps {
  title: string;
}

const PLANS = [
  { name: 'Personal', href: '/plans/personal-classes', label: '1:1 Mastery' },
  { name: 'Group', href: '/plans/live-group', label: 'Batch Ritual' },
  { name: 'LMS', href: '/plans/video-courses', label: 'Self-Paced' }
];

/**
 * Levitating Sanctuary Dock
 * Professional, high-density navigation with fluid motion and mathematical symmetry.
 */
export function PlanNavigation({ title }: PlanNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 md:px-12 bg-[#FFFAF7]/20 backdrop-blur-2xl border-b border-[#2c2525]/5 select-none">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-3 items-center">
        
        {/* PILLAR I: EXIT RITUAL (Editorial Style) */}
        <div className="flex justify-start">
          <Link 
            href="/#plans-overview"
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#2c2525]/30 hover:text-[#2c2525] transition-all duration-700"
          >
            <div className="relative flex items-center justify-center">
               <div className="absolute inset-0 bg-[#2c2525] rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
               <ArrowLeft className="w-4 h-4 relative z-10 transition-colors group-hover:text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-cormorant)' }} className="italic lowercase tracking-wider text-sm opacity-60 group-hover:opacity-100 transition-opacity">
              Exit <span className="font-bold uppercase tracking-[0.2em] text-[9px] not-italic ml-1">Ritual</span>
            </span>
          </Link>
        </div>

        {/* PILLAR II: FLUID PILL SWITCHER (Stitch Style) */}
        <div className="flex justify-center">
          <div className="flex items-center bg-[#2c2525]/5 p-1 rounded-full border border-[#2c2525]/5 shadow-inner backdrop-blur-md">
             {PLANS.map((plan) => {
               const isActive = pathname === plan.href;
               return (
                 <Link
                   key={plan.href}
                   href={plan.href}
                   className="relative px-5 md:px-7 h-7 flex items-center justify-center rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-500 group"
                 >
                   {/* LayoutId Pill - The "Stitch" element */}
                   {isActive && (
                     <motion.div
                       layoutId="nav-pill"
                       className="absolute inset-x-0 h-full bg-white shadow-[0_4px_12px_rgba(44,37,37,0.08)] border border-[#2c2525]/5 rounded-full"
                       transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     />
                   )}
                   
                   <span className={`relative z-10 leading-none ${isActive ? 'text-[#2c2525]' : 'text-[#2c2525]/30 group-hover:text-[#2c2525]'}`}>
                     {plan.name}
                   </span>
                 </Link>
               );
             })}
          </div>
        </div>

        {/* PILLAR III: SANCTUARY STATUS (Balanced Metadata) */}
        <div className="flex justify-end">
           <div className="flex items-center gap-5">
              <div className="hidden xl:flex flex-col items-end">
                 <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#bc162d] animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#2c2525]/20">Global Sanctuary</span>
                 </div>
                 <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#2c2525]/40 leading-none mt-1">
                   {title.split('//')[0].trim()} <span className="opacity-20 mx-1">·</span> {title.split('//')[1]?.trim()}
                 </span>
              </div>
              
              <div className="flex -space-x-2">
                 <div className="w-8 h-8 rounded-full border border-white bg-[#bc162d]/5 flex items-center justify-center text-[#bc162d]/40">
                    <Wind className="w-3.5 h-3.5" />
                 </div>
                 <div className="w-8 h-8 rounded-full border border-white bg-[#446187]/5 flex items-center justify-center text-[#446187]/40 ring-2 ring-[#FFFAF7]">
                    <Sparkles className="w-3.5 h-3.5" />
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Noise Texture Overlay for the Navbar itself */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />
    </nav>
  );
}
