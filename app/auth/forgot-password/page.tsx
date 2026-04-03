'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Flower2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#FFFAF7] font-sans items-center justify-center p-6">
      <div className="w-full max-w-[420px] space-y-10">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75]">
            <Flower2 className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <span className="text-2xl font-bold text-slate-900">Faceyoguez</span>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Reset Password
          </h1>
          <p className="text-slate-500 font-bold">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-white border border-[#FF8A75]/20 rounded-2xl shadow-sm text-center space-y-4">
            <p className="text-sm text-slate-700 font-medium">
              We've sent a password reset link to <span className="font-bold text-slate-900">{email}</span>.
            </p>
            <p className="text-xs text-slate-500">
              Please check your inbox (and spam folder) and click the link to reset your password.
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#FF8A75] hover:text-[#ff745c] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
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
                  Send Reset Link
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#FF8A75] transition-colors font-semibold"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
