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
    <div className="p-6 lg:p-10 space-y-10 min-h-screen pb-24 lg:pb-10">
      <header className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-sm ring-1 ring-brand-primary/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">LMS Learning Platform</h1>
        </div>
        <p className="text-foreground/60 leading-relaxed font-medium">
          Welcome back to your practice. Follow your assigned sequential path to master the art of Face Yoga effectively.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courseStatus.map((course, index) => {
          // Logic:
          // Level 1: Unlocked if they have ANY active subscription OR are Admin/Staff
          // Level 2: Unlocked if they have Level 2 in variant (or Admin) AND Level 1 is fully completed (or Admin)
          let isUnlocked = false;
          
          if (course.level === 1) {
            isUnlocked = hasActiveSub;
          } else if (course.level === 2) {
            const level1Course = courseStatus.find(c => c.level === 1);
            const level1Completed = level1Course?.isFullyCompleted || false;
            // Admins bypass both the sub check and the completion check for Level 2
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
          <div className="md:col-span-1 lg:col-span-1 border-2 border-dashed border-outline-variant/30 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-surface-container-low/10 group hover:bg-surface-container-low/20 transition-all duration-500">
            <div className="w-16 h-16 rounded-3xl bg-surface-container-highest flex items-center justify-center text-foreground/20 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-foreground/30">Next Level Awaits</h4>
              <p className="text-xs text-foreground/20 font-bold uppercase tracking-widest leading-normal">
                Finish Level 1 completely<br />to reveal Level 2 content
              </p>
            </div>
          </div>
        )}
      </div>

      {!courses || courses.length === 0 && (
         <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary/20">
               <BookOpen className="w-10 h-10" />
            </div>
            <p className="text-foreground/40 font-bold italic">No courses have been assigned to the LMS platform yet.</p>
         </div>
      )}
    </div>
  );
}
