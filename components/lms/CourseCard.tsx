import Link from 'next/link';
import { Lock, Play, CheckCircle2, Video, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className={cn(
      "group relative rounded-[3rem] overflow-hidden transition-all duration-700 h-full",
      isUnlocked 
        ? "hover:scale-[1.02] hover:-translate-y-2 active:scale-[0.98]" 
        : "grayscale-[0.5]"
    )}>
      {/* Background Layer */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-700",
        isUnlocked 
          ? "bg-gradient-to-br from-surface-container-low to-brand-primary/5 opacity-100" 
          : "bg-surface-container opacity-40"
      )} />
      
      {/* Content Container */}
      <div className="relative p-8 h-full flex flex-col liquid-glass border-2 border-brand-primary/10 group-hover:border-brand-primary/30 transition-colors">
        
        {/* Header - Vibrant Badge */}
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-2">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg",
              isUnlocked ? "bg-brand-primary text-white shadow-brand-primary/20" : "bg-surface-container-highest text-foreground/40"
            )}>
              {isUnlocked ? <Trophy className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isUnlocked ? `Level ${level}` : `LVL ${level} RESTRICTED`}
            </div>
            {!isUnlocked && (
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest pl-1">
                Support required to enable access
              </p>
            )}
          </div>
          
          {isCompleted && (
            <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20 transform -rotate-12">
               <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Title Section */}
        <div className="flex-1 space-y-4">
          <h3 className={cn(
            "text-3xl font-black tracking-tighter leading-[1.1] transition-colors",
            isUnlocked ? "text-foreground" : "text-foreground/40"
          )}>
            {title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/30 text-[10px] font-black text-foreground/60 uppercase">
                <Video className="w-3.5 h-3.5 text-brand-primary" />
                {moduleCount} Lessons
             </div>
             {isUnlocked && (
               <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-black text-brand-primary uppercase">
                  {isCompleted ? 'Finished' : `${Math.round(progress)}% Mastered`}
               </div>
             )}
          </div>
        </div>

        {/* Action / Progress Footer */}
        <div className="mt-12 space-y-6">
          {isUnlocked ? (
            <Link 
              href={`/student/lms/${id}`}
              className="group/btn relative w-full h-16 bg-brand-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-brand-primary/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center gap-3">
                {isCompleted ? 'Deep Practice' : 'Start Journey'}
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="w-full h-16 rounded-[2rem] border-2 border-dashed border-outline-variant/30 flex items-center justify-center gap-3">
               <Lock className="w-5 h-5 text-foreground/20" />
               <span className="text-xs font-black text-foreground/20 uppercase tracking-widest text-center px-4">Enrollment Required</span>
            </div>
          )}

          {isUnlocked && !isCompleted && progress > 0 && (
             <div className="space-y-2 px-2">
                <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden p-0.5 ring-1 ring-brand-primary/10 mt-2">
                   <div 
                     className="h-full bg-gradient-to-r from-brand-primary to-rose-400 rounded-full shadow-[0_0_12px_rgba(var(--brand-primary),0.3)] transition-all duration-1000 ease-out"
                     style={{ width: `${progress}%` }}
                   />
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
