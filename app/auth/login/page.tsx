'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flower2, Loader2 } from 'lucide-react';

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

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Let the server-side home page handle role-based routing
    // It reads cookies properly and has the correct redirect logic
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4 font-sans selection:bg-[#e8c6c8] selection:text-[#1a1a1a]">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#f4e8e5] blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#e1e9e2] blur-[120px] opacity-60"></div>
      </div>

      <div className="relative w-full max-w-sm rounded-[2rem] bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#f4e8e5] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4e8e5] text-[#2d3748] shadow-sm">
            <Flower2 className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2d3748] tracking-tight">Faceyoguez</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">Welcome back to your practice</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[#f2efe9] bg-white/50 px-4 py-3 text-sm text-[#2d3748] outline-none transition-all placeholder:text-gray-300 focus:border-[#e8c6c8] focus:bg-white focus:ring-4 focus:ring-[#f4e8e5]"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-[#f2efe9] bg-white/50 px-4 py-3 text-sm text-[#2d3748] outline-none transition-all placeholder:text-gray-300 focus:border-[#e8c6c8] focus:bg-white focus:ring-4 focus:ring-[#f4e8e5]"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50/50 px-4 py-3 text-xs font-semibold text-red-600 border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#2d3748] py-3.5 text-sm font-bold text-white shadow-md shadow-gray-200 transition-all hover:bg-[#1a202c] hover:shadow-lg disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-bold text-[#2d3748] transition-colors hover:text-[#1a202c] underline decoration-[#e8c6c8] underline-offset-4"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}