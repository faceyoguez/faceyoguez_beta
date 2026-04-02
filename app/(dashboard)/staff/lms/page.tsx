import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { CourseCreator } from '@/components/lms/CourseCreator';
import { ShieldCheck, BookOpen, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12 font-sans overflow-hidden animate-in fade-in duration-1000">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-rose/10 text-brand-rose text-[10px] font-black tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3" />
            Course Manager
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-zen tracking-tight">
            Manage Courses
          </h1>
          <p className="text-lg text-foreground/60 font-medium max-w-lg">
            Add, edit, and organise course content for students.
          </p>
        </div>

        <div className="flex h-20 w-20 rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-xl items-center justify-center text-foreground/20 rotate-6 hover:rotate-0 transition-transform duration-700">
           <BookOpen className="w-8 h-8" />
        </div>
      </header>

      <main className="relative z-10">
         <CourseCreator userId={profile.id} />
      </main>

      {/* Background accents */}
      <div className="fixed top-1/2 left-0 w-1/2 h-full bg-primary/2 rounded-full blur-[120px] -translate-y-1/2 -z-10" />
      <div className="fixed bottom-0 right-0 w-1/3 h-2/3 bg-brand-rose/2 rounded-full blur-[120px] -z-10" />
    </div>
  );
}
