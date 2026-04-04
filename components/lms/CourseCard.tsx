'use client';

import Link from 'next/link';
import { Lock, PlayCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CourseCardProps {
  id: string;
  title: string;
  level: number;
  thumbnail: string | null;
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number; // percentage 0-100
  moduleCount: number;
}

export function CourseCard({
  id,
  title,
  level,
  thumbnail,
  isUnlocked,
  isCompleted,
  progress,
  moduleCount
}: CourseCardProps) {
  return (
    <Link href={isUnlocked ? `/student/lms/${id}` : '#'} className="block h-full cursor-pointer group outline-none">
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          "relative rounded-[2.5rem] overflow-hidden transition-all duration-700 h-full",
          "zen-glass flex flex-col border border-white/80 shadow-2xl shadow-[#FF8A75]/5",
          !isUnlocked && "opacity-80 grayscale-[20%]"
        )}
      >
        
        {/* Decorative Aura Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A75]/10 rounded-full blur-[40px] -translate-y-8 translate-x-8 pointer-events-none group-hover:scale-150 transition-transform duration-1000" />

        {/* Status Badges */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
          <div className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-[#FF8A75]/10 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
            Level {level}
            {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A75]" />}
          </div>
          
          {isCompleted && (
             <div className="h-10 w-10 rounded-2xl bg-[#FF8A75] text-white flex items-center justify-center shadow-lg shadow-[#FF8A75]/30 transform group-hover:scale-110 transition-all">
                <CheckCircle className="w-5 h-5" />
             </div>
          )}
          {!isUnlocked && (
             <div className="h-10 w-10 rounded-2xl bg-slate-900/40 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5" />
             </div>
          )}
        </div>

        {/* Thumbnail Layer */}
        <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0 p-4">
           <div className="w-full h-full relative rounded-[2rem] overflow-hidden bg-slate-950/5">
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={title}
                  className={cn(
                    "object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110",
                    !isUnlocked && "opacity-60 grayscale-[30%]"
                  )}
                />
              ) : (
                <div className="absolute inset-0 bg-[#FF8A75]/5 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-[#FF8A75]/20" />
                </div>
              )}
              {/* Branded Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60" />

              {/* Central Play Icon Overlay */}
              {isUnlocked && !isCompleted && (
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-14 h-14 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 delay-100">
                        <PlayCircle className="w-6 h-6 fill-white/20" />
                     </div>
                 </div>
              )}
           </div>
        </div>

        {/* Content Section */}
        <div className="p-8 flex flex-col flex-1 relative z-10">
            <h3 className="font-serif font-bold text-2xl text-slate-900 tracking-tight leading-tight mb-2 line-clamp-2">
              {title}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75] mb-8">
              {moduleCount} {moduleCount === 1 ? 'Module' : 'Modules'}
            </p>

            <div className="mt-auto space-y-6">
               {isUnlocked && progress !== undefined && progress > 0 && (
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span className="text-slate-400">Radiance Level</span>
                        <span className="text-[#FF8A75]">{progress}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-900/5 rounded-full overflow-hidden shrink-0">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-[#FF8A75] to-[#FF8A75]/80 rounded-full relative"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px]" />
                        </motion.div>
                     </div>
                  </div>
               )}

               <div className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-sm",
                  isCompleted ? "bg-[#FF8A75]/10 text-[#FF8A75] hover:bg-[#FF8A75]/20" :
                  isUnlocked ? "bg-slate-900 text-white hover:bg-[#FF8A75] hover:shadow-xl hover:shadow-[#FF8A75]/20" :
                  "bg-white/5 border border-white/20 text-slate-300"
               )}>
                  {isCompleted ? 'Review Ritual' : isUnlocked ? 'Continue Journey' : 'Locked Ritual'}
                  {isUnlocked && !isCompleted && <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />}
               </div>
            </div>
        </div>

      </motion.div>
    </Link>
  );
}
