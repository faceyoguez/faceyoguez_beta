'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { toast } from 'sonner';

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
      toast.error("Reset Failed", { description: resetError.message });
      setLoading(false);
      return;
    }

    setSuccess(true);
    toast.success("Reset link sent!", { description: `We've sent a link to ${email}` });
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your email and we'll send you a sanctuary access link."
    >
      {success ? (
        <div className="space-y-6">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl text-center space-y-4 backdrop-blur-sm">
            <p className="text-sm text-foreground font-medium leading-relaxed">
              We've sent a password reset link to <br/>
              <span className="font-bold text-primary">{email}</span>
            </p>
            <p className="text-xs text-warm-gray leading-relaxed">
              Please check your inbox (and spam folder) and click the link to reset your password.
            </p>
          </div>
          
          <Link href="/auth/login" className="block">
            <AuthButton variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Login
            </AuthButton>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-8">
          <AuthInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            error={error}
          />

          <AuthButton
            type="submit"
            loading={loading}
            icon={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          >
            Send Reset Link
          </AuthButton>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-primary transition-colors font-bold group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to LOGIN
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
