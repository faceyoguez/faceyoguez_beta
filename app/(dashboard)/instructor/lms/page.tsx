import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { CourseCreator } from '@/components/lms/CourseCreator';

export default async function InstructorLmsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Curriculum Management</h1>
        <p className="text-foreground/60 max-w-xl">
          Course creation portal for Lead Instructors. Sequential learning paths are automatically generated from YouTube playlists.
        </p>
      </div>

      <CourseCreator userId={profile.id} />
    </div>
  );
}
