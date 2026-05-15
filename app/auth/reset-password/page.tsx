'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Invalid or expired reset link", { description: "Please request a new password reset link." });
        router.push('/auth/forgot-password');
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      toast.error("Update Failed", { description: updateError.message });
      setLoading(false);
      return;
    }

    setSuccess(true);
    toast.success("Password updated!", { description: "Your sanctuary access has been restored." });
    setLoading(false);

    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  return (
    <AuthLayout 
      title="New Password" 
      subtitle="Create a strong new password to secure your sanctuary access."
    >
      {success ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] text-center space-y-4 backdrop-blur-sm">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-aktiv text-emerald-900">Password Restored</h3>
            <p className="text-sm text-emerald-700/80 leading-relaxed">
              Your password has been successfully updated. <br/>
              Redirecting you to login...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-4">
            <AuthInput
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
            />
            <AuthInput
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              icon={<ShieldCheck className="h-4 w-4" />}
              error={error}
            />
          </div>

          <AuthButton
            type="submit"
            loading={loading}
            icon={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          >
            Update Password
          </AuthButton>

          <div className="p-4 bg-zen-peach/5 border border-zen-peach/10 rounded-2xl">
            <ul className="text-[10px] space-y-1 text-warm-gray font-medium uppercase tracking-wider">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-[#E76F51] rounded-full" />
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-[#E76F51] rounded-full" />
                Mix of letters and numbers
              </li>
            </ul>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
