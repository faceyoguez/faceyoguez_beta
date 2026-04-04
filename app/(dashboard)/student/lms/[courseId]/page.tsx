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

  const { data: activeSubscriptions } = await admin
    .from('subscriptions')
    .select('plan_variant, is_trial')
    .eq('student_id', user.id)
    .eq('status', 'active');

  const isTrial = activeSubscriptions?.some(s => s.is_trial) || false;
  const hasActiveSub = (activeSubscriptions && activeSubscriptions.length > 0) || isAdmin;
  const hasLevel2 = activeSubscriptions?.some(s => s.plan_variant?.includes('Level 2')) || isAdmin;

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
    <div className="relative min-h-screen bg-[#FFFAF7] text-slate-900 font-sans selection:bg-[#FF8A75]/20 overflow-x-hidden pb-32">
      
      {/* ── Website Style Auroras ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.05)_0%,transparent_60%)] -translate-y-1/3 translate-x-1/4 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_60%)] translate-y-1/4 -translate-x-1/4 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 p-8 lg:p-12 max-w-[1600px] mx-auto space-y-8">
        
        {/* ── Branded Navigation ── */}
        <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <Link 
            href="/student/lms" 
            className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#FF8A75]/20 flex items-center justify-center text-[#FF8A75] hover:bg-[#FF8A75] hover:text-white transition-all shadow-sm hover:shadow-xl hover:shadow-[#FF8A75]/20 group"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </Link>
          <div className="space-y-1">
            <p className="text-[10px] text-[#FF8A75] font-black uppercase tracking-[0.3em] leading-none">Currently Practicing</p>
            <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight leading-none">{course.title}</h2>
          </div>
        </div>

        <CourseViewer
          courseId={course.id}
          courseTitle={course.title}
          modules={sortedModules}
          completedModuleIds={completedModuleIds}
          studentId={user.id}
          isTrial={isTrial}
        />
      </div>
    </div>
  );
}
