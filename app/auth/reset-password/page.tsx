'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Flower2, Loader2, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Supabase automatically logs the user in securely when they click the magic link 
  // in the forgot-password email. This page just needs to update the session user's password.

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Give them a moment to see the success message, then route home.
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 2000);
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
            Set New Password
          </h1>
          <p className="text-slate-500 font-bold">
            Please enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm text-center space-y-3">
            <p className="text-green-800 font-bold text-lg">Password Updated!</p>
            <p className="text-sm text-green-700">
              Redirecting you to the dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 6 characters"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-[#FF8A75] focus:ring-4 focus:ring-[#FF8A75]/10 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
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
                  Update Password
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
