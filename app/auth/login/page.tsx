'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flower2, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[#FFFAF7] font-sans">
      {/* ── Left Decorative Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#FF8A75]/10 via-[#FFFAF7] to-[#FF8A75]/5 items-center justify-center p-16">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#FF8A75]/10 blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-[#FF8A75]/8 blur-[60px]" />

        {/* Stacked glassmorphic cards */}
        <div className="relative w-full max-w-sm space-y-4">
          <div className="rounded-[2.5rem] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-2xl p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-700">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-3">Day 21 — Transformation</p>
            <p className="text-2xl font-serif font-bold text-slate-900 leading-snug">
              &ldquo;The face reveals what the soul chooses to speak.&rdquo;
            </p>
          </div>
          <div className="rounded-[2.5rem] bg-white/40 backdrop-blur-3xl border border-white/60 shadow-xl p-6 ml-8 transform rotate-1 hover:rotate-0 transition-transform duration-700">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Your Journey Awaits</p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
              Structural metamorphosis through the art of face yoga
            </p>
          </div>
        </div>

        {/* Brand watermark */}
        <div className="absolute bottom-10 left-16 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75]">
            <Flower2 className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <span className="text-2xl font-serif font-bold text-slate-900 tracking-tight italic">Faceyoguez</span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-[420px] space-y-10">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75]">
              <Flower2 className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <span className="text-2xl font-serif font-bold text-slate-900 italic">Faceyoguez</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-slate-500 font-light">
              Enter your ritual space to continue your practice.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
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
                required
                placeholder="Your secure password"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#FF8A75] focus:ring-4 focus:ring-[#FF8A75]/10 shadow-sm"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs text-red-600 font-medium text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 bg-[#FF8A75] text-white py-4 rounded-2xl text-sm font-bold tracking-wide shadow-xl shadow-[#FF8A75]/20 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-[#FF8A75]/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="space-y-4 text-center">
            <Link
              href="/auth/signup"
              className="text-sm text-slate-500 hover:text-[#FF8A75] transition-colors block"
            >
              New here?{' '}
              <span className="font-semibold text-[#FF8A75]">Create an account</span>
            </Link>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors block"
            >
              Forgotten your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}