import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { FloatingDock } from '@/components/marketing/FloatingDock';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, handle role-based redirection
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'instructor') {
      redirect('/instructor/dashboard');
    }

    if (profile && ['admin', 'staff', 'client_management'].includes(profile.role)) {
      redirect('/staff/dashboard');
    }

    redirect('/student/dashboard');
  }

  // If no user, show the beautiful Faceyoguez landing page
  return (
    <main className="min-h-screen bg-[#FFFAF7] text-slate-900 selection:bg-[#FF8A75]/20 selection:text-[#FF8A75]">
      <Hero />
      <Features />
      
      {/* Premium Footer Concept */}
      <footer className="py-32 px-4 border-t border-[#FF8A75]/10 bg-white text-center">
        <div className="max-w-xl mx-auto space-y-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900">
            Ready for your <span className="italic font-light text-[#FF8A75]">transformation?</span>
          </h2>
          <p className="text-slate-600 text-lg font-light">
            Join the collective of thousands finding their sanctuary through face yoga.
          </p>
          <div className="pt-4">
            <Link
              href="/auth/signup"
              className="inline-flex px-10 py-4 rounded-full bg-slate-900 text-white font-medium tracking-wide text-sm shadow-xl transition-transform hover:scale-105"
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      </footer>

      <FloatingDock />
    </main>
  );
}
