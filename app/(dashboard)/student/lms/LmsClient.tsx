'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CourseCard } from '@/components/lms/CourseCard';
import { BookOpen, Sparkles, Layout } from 'lucide-react';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';
import type { Profile } from '@/types/database';

interface LmsClientProps {
  currentUser: Profile;
  courses: any[];
  hasActiveSub: boolean;
  hasLevel2: boolean;
  isAdmin: boolean;
}

export function LmsClient({
  currentUser,
  courses,
  hasActiveSub,
  hasLevel2,
  isAdmin,
  subscriptionStartDate
}: LmsClientProps & { subscriptionStartDate?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const subChannel = supabase
      .channel('student-lms-subscriptions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `student_id=eq.${currentUser.id}`
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
    };
  }, [supabase, currentUser.id, router]);

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFAF7] text-slate-900 font-sans selection:bg-[#FF8A75]/20 overflow-x-hidden pb-32">
      
      {subscriptionStartDate && (
        <PlanExpiryPill 
          subscriptionStartDate={subscriptionStartDate} 
          planName="Course Curriculum"
        />
      )}

      {/* ── Website Style Auroras ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.08)_0%,transparent_50%)] blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.05)_0%,transparent_60%)] translate-y-1/3 translate-x-1/4 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 p-8 lg:p-12 max-w-[1600px] mx-auto">
        
        {/* ── Branded Header ── */}
        <header className="flex flex-col items-center text-center space-y-6 pt-12 pb-20">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] font-black tracking-[0.3em] uppercase shadow-sm">
            <Layout className="w-3.5 h-3.5" />
            Program Curriculum
          </div>
          <div className="space-y-4">
             <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-none font-serif">
               Your <span className="text-[#FF8A75]">Journey</span>
             </h1>
             <p className="text-base md:text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
               Master the art of natural radiance. Complete each ritual level to unlock your path forward.
             </p>
          </div>
        </header>

        {/* ── Course Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12 px-2">
          {courses.map((course) => {
            let isUnlocked = false;
            
            if (course.level === 1) {
              isUnlocked = true;
            } else if (course.level === 2) {
              const level1Course = courses.find(c => c.level === 1);
              const level1Completed = level1Course?.isFullyCompleted || false;
              isUnlocked = isAdmin || (hasActiveSub && hasLevel2 && level1Completed);
            }

            return (
              <div key={course.id} className="relative group">
                {course.level === 1 && (
                  <div className="absolute -top-3 left-8 z-20 px-4 py-1.5 bg-[#FF8A75] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-[#FF8A75]/20">
                    Free Rituals
                  </div>
                )}
                <CourseCard
                  id={course.id}
                  title={course.title}
                  level={course.level}
                  thumbnail={course.thumbnail_url}
                  isUnlocked={isUnlocked}
                  isCompleted={course.isFullyCompleted}
                  progress={course.progressPercent}
                  moduleCount={course.totalModules}
                />
              </div>
            );
          })}

          {/* Level 2 Lock Indicator (If Level 2 isn't fully visible/unlocked) */}
          {courses.length > 0 && !courses.find(c => c.level === 2)?.isFullyCompleted && (
            <div className="relative rounded-[3rem] p-12 flex flex-col items-center justify-center text-center space-y-8 bg-white/20 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-[#FF8A75]/5 group">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white flex items-center justify-center text-[#FF8A75] shadow-xl group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">The Next Horizon</h4>
                <p className="text-[10px] text-[#FF8A75] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
                  Complete Level 1 Rituals to unlock Advanced Immersion.
                </p>
              </div>
            </div>
          )}
        </div>

        {(!courses || courses?.length === 0) && (
           <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
              <div className="h-24 w-24 rounded-[2.5rem] zen-glass flex items-center justify-center text-[#FF8A75] shadow-xl">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-serif font-bold text-slate-900">Program Loading...</p>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Your path is being prepared</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
