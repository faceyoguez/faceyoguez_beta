'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flower2,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleComplete() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || undefined,
          role: 'student',
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    // Auto-login immediately after signup to establish a session
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      // Email confirmation is likely required — inform the user
      setError(
        'Account created! Please check your email to confirm your account, then sign in.'
      );
      setLoading(false);
      return;
    }

    // Verify session is active before redirecting
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError('Account created but session failed. Please sign in manually.');
      setLoading(false);
      return;
    }

    // Session is now active — redirect to dashboard
    router.push('/student/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4 font-sans selection:bg-[#e8c6c8] selection:text-[#1a1a1a] py-12">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#e1e9e2] blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#f4e8e5] blur-[120px] opacity-60"></div>
      </div>

      <div className="relative w-full max-w-[420px] rounded-[2rem] bg-white/70 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#f4e8e5] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e1e9e2] text-[#2d3748] shadow-sm">
            <Flower2 className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2d3748] tracking-tight">Faceyoguez</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">Begin your wellness journey</p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Emma Thompson"
              className="w-full rounded-xl border border-[#f2efe9] bg-white/50 px-4 py-3 text-sm text-[#2d3748] outline-none transition-all placeholder:text-gray-300 focus:border-[#e8c6c8] focus:bg-white focus:ring-4 focus:ring-[#f4e8e5]"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#f2efe9] bg-white/50 px-4 py-3 text-sm text-[#2d3748] outline-none transition-all placeholder:text-gray-300 focus:border-[#e8c6c8] focus:bg-white focus:ring-4 focus:ring-[#f4e8e5]"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl border border-[#f2efe9] bg-white/50 px-4 py-3 text-sm text-[#2d3748] outline-none transition-all placeholder:text-gray-300 focus:border-[#e8c6c8] focus:bg-white focus:ring-4 focus:ring-[#f4e8e5]"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full rounded-xl border border-[#f2efe9] bg-white/50 px-4 py-3 text-sm text-[#2d3748] outline-none transition-all placeholder:text-gray-300 focus:border-[#e8c6c8] focus:bg-white focus:ring-4 focus:ring-[#f4e8e5]"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50/50 px-4 py-3 text-xs font-semibold text-red-600 border border-red-100">
              {error}
            </p>
          )}

          <button
            onClick={handleComplete}
            disabled={loading}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#2d3748] py-3.5 text-sm font-bold text-white shadow-md shadow-gray-200 transition-all hover:bg-[#1a202c] hover:shadow-lg disabled:opacity-70 group"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
               <>
                 Create Account 
                 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
               </>
            )}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-[#2d3748] transition-colors hover:text-[#1a202c] underline decoration-[#e1e9e2] underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
