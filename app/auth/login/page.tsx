'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Facebook, Instagram } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { getRoleRedirectPath, fetchUserRole } from '@/lib/utils/auth';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User data could not be retrieved. Please try again.');
      setLoading(false);
      return;
    }

    const role = await fetchUserRole(supabase, user.id);
    const redirectPath = getRoleRedirectPath(role);

    console.log(`Login Success: User ${user.id} logged in as ${role}. Redirecting to ${redirectPath}`);
    router.push(redirectPath);
    router.refresh();
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    setError('');
    
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to continue your face yoga sanctuary."
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <AuthInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
        />

        <div className="space-y-1">
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl">
            <p className="text-xs text-red-600 font-bold text-center leading-relaxed">{error}</p>
          </div>
        )}

        <AuthButton
          type="submit"
          loading={loading}
          icon={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
        >
          Sign In
        </AuthButton>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-outline-variant/60" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-background px-4 text-warm-gray font-black tracking-widest">Or continue with</span>
        </div>
      </div>

      <div className="space-y-4">
        <AuthButton
          variant="outline"
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
          icon={<GoogleIcon />}
        >
          Continue with Google
        </AuthButton>
        <div className="grid grid-cols-2 gap-4">
          <AuthButton
            variant="outline"
            className="!bg-[#1877F2] !text-white !border-none hover:opacity-90"
            onClick={() => handleOAuthLogin('facebook')}
            disabled={loading}
            icon={<Facebook className="w-5 h-5 fill-white" stroke="none" />}
          >
            Facebook
          </AuthButton>
          <AuthButton
            variant="outline"
            className="!bg-gradient-to-tr !from-[#FFDC80] !via-[#F56040] !to-[#C13584] !text-white !border-none hover:opacity-90"
            onClick={() => handleOAuthLogin('instagram')}
            disabled={loading}
            icon={<Instagram className="w-5 h-5" />}
          >
            Instagram
          </AuthButton>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/auth/signup"
          className="text-sm text-warm-gray hover:text-primary transition-colors block"
        >
          New here?{' '}
          <span className="font-bold text-primary underline underline-offset-4 decoration-primary/20 hover:decoration-primary">Create an account</span>
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}