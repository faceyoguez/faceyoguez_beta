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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/80 p-8 shadow-xl ring-1 ring-pink-100/50 backdrop-blur-xl transition-all duration-300">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200/50">
            <Flower2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Faceyoguez</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full rounded-xl border border-pink-100/60 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleComplete}
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200/50 transition-all hover:shadow-lg disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-pink-500 hover:text-pink-600">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
