'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flower2, Loader2, ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

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
    const result = formSchema.safeParse({ fullName, email, phone, password });
    
    if (!result.success) {
      setError(result.error.issues[0].message);
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

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError('Account created! Please check your email to confirm, then sign in.');
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError('Account created but session failed. Please sign in manually.');
      setLoading(false);
      return;
    }

    router.push('/student/dashboard');
    router.refresh();
  }

  const benefits = [
    { icon: Sparkles, text: 'Expert face yoga instructors' },
    { icon: TrendingUp, text: 'Daily journey tracking & milestones' },
    { icon: Users, text: 'Live 1-on-1 & group sessions' },
  ];

  return (
    <div className="flex min-h-screen bg-[#FFFAF7] font-sans">
      {/* ── Left Form Panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75]">
              <Flower2 className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-slate-900">Faceyoguez</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Begin your journey
            </h1>
            <p className="text-slate-500 font-bold">
              Create your account and start practising face yoga today.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#FF8A75] focus:ring-4 focus:ring-[#FF8A75]/10 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#FF8A75] focus:ring-4 focus:ring-[#FF8A75]/10 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Phone <span className="text-slate-300 normal-case font-light tracking-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#FF8A75] focus:ring-4 focus:ring-[#FF8A75]/10 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#FF8A75] focus:ring-4 focus:ring-[#FF8A75]/10 shadow-sm"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs text-red-600 font-medium text-center">{error}</p>
              </div>
            )}

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 bg-[#FF8A75] text-white py-4 rounded-2xl text-sm font-bold tracking-wide shadow-xl shadow-[#FF8A75]/20 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-[#FF8A75]/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-slate-500 hover:text-[#FF8A75] transition-colors"
            >
              Already have an account?{' '}
              <span className="font-semibold text-[#FF8A75]">Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right Decorative Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-slate-900 items-center justify-center p-16">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full bg-[#FF8A75]/15 blur-[100px] -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[#FF8A75]/10 blur-[80px]" />

        <div className="relative z-10 space-y-10 max-w-sm">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF8A75]/10 border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] font-black uppercase tracking-[0.3em]">
              <Sparkles className="w-3.5 h-3.5" />
              Faceyoguez Community
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Start your face yoga <span className="text-[#FF8A75] font-bold">journey today.</span>
            </h2>
            <p className="text-slate-400 font-bold leading-relaxed">
              Join thousands of women learning face yoga with expert instructors — online, from home.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#FF8A75]/15 text-[#FF8A75]">
                  <b.icon className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-slate-200">{b.text}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-slate-500 font-bold">
              &ldquo;Every small effort adds up. Your face will thank you.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
