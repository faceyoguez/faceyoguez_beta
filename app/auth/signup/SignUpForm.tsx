'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { getRoleRedirectPath } from '@/lib/utils/auth';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'SG (+65)' },
  { code: '+81', label: 'JP (+81)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+33', label: 'FR (+33)' },
];

export default function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    
    // Zod validation
    const result = formSchema.safeParse({ fullName, email, phone, password });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
        toast.error("Validation Error", { description: issue.message });
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone ? `${countryCode}${phone.replace(/[^0-9]/g, '')}` : undefined,
          role: 'student',
        },
      },
    });

    if (authError) {
      setErrors({ form: authError.message });
      toast.error("Sign Up Failed", { description: authError.message });
      setLoading(false);
      return;
    }

    if (!authData.user) {
      const msg = 'Failed to create account. Please try again.';
      setErrors({ form: msg });
      toast.error("Sign Up Failed", { description: msg });
      setLoading(false);
      return;
    }

    // Attempt auto-login if confirmed is not required or auto-complete succeeds
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      toast.success('Account created!', {
        description: 'Please confirm your email before signing in.',
      });
      setErrors({ form: 'Success! Please confirm your email before signing in.' });
      setLoading(false);
      return;
    }

    toast.success('Account created successfully!', {
      description: 'Welcome to Faceyoguez.',
    });
    const redirectPath = getRoleRedirectPath('student');
    router.push(redirectPath);
    router.refresh();
  }

  const handleOAuthSignup = async (provider: string) => {
    setLoading(true);
    setErrors({});
    
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setErrors({ form: oauthError.message });
      toast.error("OAuth Sign Up Failed", { description: oauthError.message });
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Begin your journey" 
      subtitle="Create your sanctuary and start practicing face yoga today."
      isSignup={true}
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        <AuthInput
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Enter your full name"
          error={errors.fullName}
        />

        <AuthInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
          error={errors.email}
        />

        <div className="space-y-2 w-full group">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray/80 transition-colors group-focus-within:text-primary pl-1">
            Phone Number <span className="opacity-50">(Optional)</span>
          </label>
          <div className="flex bg-white/40 sm:bg-white/50 backdrop-blur-md border border-outline-variant rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="bg-transparent text-sm sm:text-base font-medium text-foreground outline-none py-3.5 sm:py-4 pl-4 pr-2 border-r border-outline-variant/50 focus:bg-white/50 cursor-pointer"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-warm-gray/30 outline-none px-4 py-3.5 sm:py-4"
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] font-bold text-red-500 pl-2 mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Create a password"
          error={errors.password}
          isPassword
        />

        {errors.form && (
          <div className="p-3 bg-red-50/50 border border-red-100 rounded-2xl">
            <p className="text-[10px] text-red-600 font-bold text-center leading-relaxed">{errors.form}</p>
          </div>
        )}

        <AuthButton
          type="submit"
          loading={loading}
          icon={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
        >
          Create Account
        </AuthButton>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-outline-variant/60" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-background px-4 text-warm-gray font-black tracking-widest">Or continue with</span>
        </div>
      </div>

      <div className="space-y-3">
        <AuthButton
          variant="outline"
          onClick={() => handleOAuthSignup('google')}
          disabled={loading}
          icon={<GoogleIcon />}
        >
          Google
        </AuthButton>
        <div className="grid grid-cols-2 gap-3">
          <AuthButton
            variant="outline"
            className="!bg-[#1877F2] !text-white !border-none hover:opacity-90"
            onClick={() => handleOAuthSignup('facebook')}
            disabled={loading}
            icon={<Facebook className="w-4 h-4 fill-white" stroke="none" />}
          >
            Facebook
          </AuthButton>
          <AuthButton
            variant="outline"
            className="!bg-gradient-to-tr !from-[#FFDC80] !via-[#F56040] !to-[#C13584] !text-white !border-none hover:opacity-90 shadow-sm"
            onClick={() => handleOAuthSignup('instagram')}
            disabled={loading}
            icon={<Instagram className="w-4 h-4" />}
          >
            Instagram
          </AuthButton>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/auth/login"
          className="text-sm text-warm-gray hover:text-primary transition-colors block"
        >
          Already have an account?{' '}
          <span className="font-bold text-primary underline underline-offset-4 decoration-primary/20 hover:decoration-primary">Sign In</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
