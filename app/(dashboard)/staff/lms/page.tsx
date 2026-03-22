import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { CourseCreator } from '@/components/lms/CourseCreator';

const ALLOWED_ROLES = ['admin', 'staff', 'client_management'];

export default async function StaffLMSPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) redirect('/auth/login');

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">LMS Repository</h1>
        <p className="text-foreground/60 max-w-xl">
          Manage your sequential level courses here. Paste a YouTube playlist URL to automatically import videos.
        </p>
      </div>

      <CourseCreator userId={profile.id} />
    </div>
  );
}
