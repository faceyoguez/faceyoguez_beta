import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { LmsClient } from './LmsClient';
import type { Profile } from '@/types/database';

export default async function StudentLmsPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();

  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch Profile & Subscription in parallel
  const [profile, { data: subscriptions }] = await Promise.all([
    getServerProfile(user.id),
    admin
      .from('subscriptions')
      .select('plan_variant, status, created_at, end_date')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const subscriptionStartDate = subscriptions?.[0]?.created_at || null;

  const isAdmin = ['admin', 'instructor', 'staff', 'client_management'].includes(profile?.role || '');
  const hasActiveSub = (subscriptions && subscriptions.length > 0) || isAdmin;
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
    <LmsClient
      currentUser={profile as Profile}
      courses={courseStatus}
      hasActiveSub={hasActiveSub}
      hasLevel2={hasLevel2}
      isAdmin={isAdmin}
    />
  );
}
