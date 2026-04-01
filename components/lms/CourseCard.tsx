import Link from 'next/link';
import { Lock, PlayCircle, CheckCircle, ArrowRight } from 'lucide-react';
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
    <Link href={isUnlocked ? `/student/lms/${id}` : '#'} className="block h-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 rounded-[2.5rem]">
      <div className={cn(
        "group relative rounded-[2.5rem] overflow-hidden transition-all duration-700 h-full",
        "border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.03)] bg-white/40 backdrop-blur-2xl flex flex-col hover:border-white hover:bg-white/60",
        !isUnlocked && "opacity-80 grayscale-[20%]"
      )}>
        
        {/* Soft glowing orb behind thumbnail */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -translate-y-8 translate-x-8 pointer-events-none group-hover:scale-150 transition-transform duration-1000" />

        {/* Status Badges */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
          <div className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white text-[10px] font-bold text-foreground/70 uppercase tracking-[0.2em] flex items-center gap-2">
            Level {level}
            {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </div>
          
          {isCompleted && (
             <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
             </div>
          )}
          {!isUnlocked && (
             <div className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
                <Lock className="w-4 h-4" />
             </div>
          )}
        </div>

        {/* Thumbnail Layer */}
        <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0 p-3">
           <div className="w-full h-full relative rounded-[2rem] overflow-hidden bg-black/5">
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={title}
                  className={cn(
                    "object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105",
                    !isUnlocked && "opacity-60 grayscale-[30%]"
                  )}
                />
              ) : (
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-primary/20" />
                </div>
              )}
              {/* Soft overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-60" />

              {/* Central Play Icon Overlay */}
              {isUnlocked && !isCompleted && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 delay-100">
                        <PlayCircle className="w-6 h-6" />
                     </div>
                 </div>
              )}
           </div>
        </div>

        {/* Content Section */}
        <div className="p-8 flex flex-col flex-1 relative z-10">
            <h3 className="font-serif font-black text-2xl text-foreground tracking-tight leading-none mb-3 line-clamp-2 pt-2">
              {title}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-8">
              {moduleCount} {moduleCount === 1 ? 'Module' : 'Modules'}
            </p>

            <div className="mt-auto space-y-6">
               {isUnlocked && progress !== undefined && progress > 0 && (
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span className="text-foreground/40">Progress</span>
                        <span className="text-primary">{progress}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden shrink-0">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000 relative"
                          style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[2px]" />
                        </div>
                     </div>
                  </div>
               )}

               <div className={cn(
                  "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-sm",
                  isCompleted ? "bg-primary/10 text-primary group-hover:bg-primary/20" :
                  isUnlocked ? "bg-black text-white group-hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.1)]" :
                  "bg-white/5 border border-white/20 text-foreground/30"
               )}>
                  {isCompleted ? 'Review Course' : isUnlocked ? 'Continue' : 'Locked'}
                  {isUnlocked && !isCompleted && <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />}
               </div>
            </div>
        </div>

      </div>
    </Link>
  );
}
