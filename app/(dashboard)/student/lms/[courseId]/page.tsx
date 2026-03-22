import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { CourseViewer } from '@/components/lms/CourseViewer';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseViewerPage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();

  // 1. Fetch Course and its Modules
  const { data: course, error: courseError } = await admin
    .from('lms_courses')
    .select(`
      *,
      modules:lms_modules(*)
    `)
    .eq('id', courseId)
    .single();

  if (courseError || !course) return notFound();

  // Sort modules by order_index locally as Joined select order is inconsistent
  const sortedModules = (course.modules || []).sort((a: any, b: any) => a.order_index - b.order_index);

  // 2. Fetch Progress
  const { data: progress } = await admin
    .from('student_lms_progress')
    .select('module_id')
    .eq('student_id', user.id)
    .in('module_id', sortedModules.map((m: any) => m.id));

  const completedModuleIds = new Set(progress?.map(p => p.module_id) || []);

  // 3. Simple Access Check (Additional Layer)
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['admin', 'instructor', 'staff', 'client_management'].includes(profile?.role || '');

  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('plan_variant')
    .eq('student_id', user.id)
    .eq('status', 'active');

  const hasActiveSub = (subscriptions && subscriptions.length > 0) || isAdmin;
  const hasLevel2 = subscriptions?.some(s => s.plan_variant?.includes('Level 2')) || isAdmin;

  const isLevelAllowed = isAdmin || (course.level === 1 
    ? hasActiveSub 
    : (hasActiveSub && hasLevel2));

  if (!isLevelAllowed) redirect('/student/lms');

  // Level 2 dependency check
  if (course.level === 2 && !isAdmin) { // Admins bypass completion check
    const { data: level1Course } = await admin
       .from('lms_courses')
       .select('id, modules:lms_modules(id)')
       .eq('level', 1)
       .single();
    
    if (level1Course) {
       const { count } = await admin
          .from('student_lms_progress')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .in('module_id', level1Course.modules.map((m: any) => m.id));
       
       if ((count || 0) < level1Course.modules.length) {
          redirect('/student/lms'); // Redirect if Level 1 not finished
       }
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/student/lms" 
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-foreground/40 hover:text-brand-primary hover:bg-brand-primary/10 transition-all shadow-sm ring-1 ring-outline-variant/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">{course.title}</h2>
          <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Currently Practicing</p>
        </div>
      </div>

      <CourseViewer
        courseId={course.id}
        courseTitle={course.title}
        modules={sortedModules}
        completedModuleIds={completedModuleIds}
        studentId={user.id}
      />
    </div>
  );
}
