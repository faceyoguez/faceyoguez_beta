import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { CourseCard } from '@/components/lms/CourseCard';
import { BookOpen, Sparkles, Layout } from 'lucide-react';

export default async function StudentLmsPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();

  // 1. Fetch Profile & Subscription in parallel
  const [profile, { data: subscriptions }] = await Promise.all([
    getServerProfile(user.id),
    admin
      .from('subscriptions')
      .select('plan_variant, status')
      .eq('student_id', user.id)
      .eq('status', 'active'),
  ]);

  const isAdmin = ['admin', 'instructor', 'staff', 'client_management'].includes(profile?.role || '');

  const hasActiveSub = (subscriptions && subscriptions.length > 0) || isAdmin;
  
  // Look for Level 2 in any of the active subscriptions
  const hasLevel2 = subscriptions?.some(s => s.plan_variant?.includes('Level 2')) || isAdmin;

  // 2. Fetch courses + progress in parallel
  const [{ data: courses }, { data: progress }] = await Promise.all([
    admin
      .from('lms_courses')
      .select(`*, modules:lms_modules(id)`)
      .order('level', { ascending: true }),
    admin
      .from('student_lms_progress')
      .select('module_id')
      .eq('student_id', user.id),
  ]);

  const completedModuleIds = new Set(progress?.map(p => p.module_id) || []);

  const courseStatus = courses?.map(course => {
    const totalModules = course.modules?.length || 0;
    const completedInThisCourse = course.modules?.filter((m: any) => completedModuleIds.has(m.id)).length || 0;
    const progressPercent = totalModules > 0 ? (completedInThisCourse / totalModules) * 100 : 0;
    const isFullyCompleted = totalModules > 0 && completedInThisCourse === totalModules;

    return {
      ...course,
      totalModules,
      completedInThisCourse,
      progressPercent,
      isFullyCompleted
    };
  }) || [];

  return (
    <div className="relative min-h-screen bg-[#FFFAF7] text-slate-900 font-sans selection:bg-[#FF8A75]/20 overflow-x-hidden pb-32">
      
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
          {courseStatus.map((course) => {
            let isUnlocked = false;
            
            if (course.level === 1) {
              isUnlocked = hasActiveSub;
            } else if (course.level === 2) {
              const level1Course = courseStatus.find(c => c.level === 1);
              const level1Completed = level1Course?.isFullyCompleted || false;
              isUnlocked = isAdmin || (hasActiveSub && hasLevel2 && level1Completed);
            }

            return (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                level={course.level}
                thumbnail={course.thumbnail_url}
                isUnlocked={isUnlocked}
                isCompleted={course.isFullyCompleted}
                progress={course.progressPercent}
                moduleCount={course.totalModules}
              />
            );
          })}

          {/* Level 2 Lock Indicator (If Level 2 isn't fully visible/unlocked) */}
          {courseStatus.length > 0 && !courseStatus.find(c => c.level === 2)?.isFullyCompleted && (
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
