'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CourseCard } from '@/components/lms/CourseCard';
import { BookOpen, Sparkles, Layout } from 'lucide-react';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';
import { SupportContact } from '@/components/ui/SupportContact';
import { cn } from '@/lib/utils';
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
    <div className="min-h-full font-jakarta px-4 sm:px-8 lg:px-12 py-8 space-y-8 max-w-[1920px] mx-auto">
      
      {subscriptionStartDate && (
        <PlanExpiryPill 
          subscriptionStartDate={subscriptionStartDate} 
          planName="Course Curriculum"
        />
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
            Program <span className="text-[#e76f51]">Curriculum</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Master the art of natural radiance step-by-step</p>
        </div>
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <SupportContact className="px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm" />
          <div className="h-10 w-10 rounded-xl bg-[#e76f51]/10 flex items-center justify-center shrink-0 w-fit sm:w-10">
            <Layout className="w-5 h-5 text-[#e76f51]" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Main Curriculum Area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div key={course.id} className={cn("relative group", course.level === 1 && "mt-4 mb-4")}>
                  {course.level === 1 && (
                    <div className="absolute -top-4 left-8 z-20 px-4 py-2 bg-[#e76f51] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-[#e76f51]/20">
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

          </div>

          {(!courses || courses?.length === 0) && (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                <div className="h-24 w-24 rounded-[2.5rem] zen-glass flex items-center justify-center text-[#e76f51] shadow-xl">
                  <BookOpen className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-aktiv font-bold text-slate-900">Program Loading...</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Your path is being prepared</p>
                </div>
            </div>
          )}
        </div>

        {/* Sidebar: Learning Path & Stats */}
        <aside className="space-y-6">
          <div className="bg-slate-900 rounded-[1.75rem] p-8 text-white space-y-8 relative overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e76f51]/10 rounded-full blur-3xl -z-0" />
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#e76f51] uppercase tracking-[0.2em]">Learning Status</p>
                <h3 className="text-2xl font-aktiv font-bold tracking-tight">Daily Rituals</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[32px] font-aktiv font-bold leading-none">{courses.filter(c => c.isFullyCompleted).length}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mastered</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[32px] font-aktiv font-bold leading-none">{courses.length}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Courses</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Consitency is the key to natural beauty. Practice your rituals daily to see the best results.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>
  );
}
