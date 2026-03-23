import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/lms/CourseCard';
import { BookOpen, Sparkles } from 'lucide-react';

export default async function StudentLmsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  
  // 1. Fetch Profile & Subscription
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['admin', 'instructor', 'staff', 'client_management'].includes(profile?.role || '');

  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('plan_variant, status')
    .eq('student_id', user.id)
    .eq('status', 'active');

  const hasActiveSub = (subscriptions && subscriptions.length > 0) || isAdmin;
  
  // Look for Level 2 in any of the active subscriptions
  const hasLevel2 = subscriptions?.some(s => s.plan_variant?.includes('Level 2')) || isAdmin;
  const planVariant = subscriptions?.map(s => s.plan_variant).join(',') || '';

  // 2. Fetch Courses and their module counts
  const { data: courses } = await admin
    .from('lms_courses')
    .select(`
      *,
      modules:lms_modules(id)
    `)
    .order('level', { ascending: true });

  // 3. Fetch Student Progress (completed modules)
  const { data: progress } = await admin
    .from('student_lms_progress')
    .select('module_id')
    .eq('student_id', user.id);

  const completedModuleIds = new Set(progress?.map(p => p.module_id) || []);

  // 4. Calculate status for each course
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
    <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-transparent pb-24 lg:pb-10 font-sans relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <header className="flex flex-col items-center text-center space-y-4 relative z-10 py-12 md:py-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm">
          <BookOpen className="w-3.5 h-3.5" />
          Learning Path
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-black text-foreground tracking-tight leading-none max-w-3xl">
          The Curriculum
        </h1>
        <p className="text-lg text-foreground/50 italic font-medium max-w-xl">
          Follow your sequential path to master structural renewal and the art of Face Yoga.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 lg:px-12">
        {courseStatus.map((course, index) => {
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

        {/* Level Indicator for Level 2 locked */}
        {courseStatus.length > 1 && !courseStatus.find(c => c.level === 2)?.isFullyCompleted && (
          <div className="md:col-span-1 lg:col-span-1 border border-white/60 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 bg-white/40 backdrop-blur-3xl group hover:border-white hover:bg-white/60 transition-all duration-700 shadow-[0_20px_60px_rgba(0,0,0,0.03)] opacity-80">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary group-hover:scale-110 shadow-sm transition-transform duration-700">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h4 className="font-serif font-black text-2xl text-foreground tracking-tight">Next Level Awaits</h4>
              <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                Master Level 1 entirely to reveal the secrets of Level 2
              </p>
            </div>
          </div>
        )}
      </div>

      {(!courses || courses?.length === 0) && (
         <div className="flex flex-col items-center justify-center py-32 text-center space-y-5 opacity-40">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-primary shadow-sm border border-black/5 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <p className="text-2xl font-serif font-black tracking-tight text-foreground">No courses available.</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/50">The path is being prepared for you</p>
         </div>
      )}
    </div>
  );
}
