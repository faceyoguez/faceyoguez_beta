'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
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
  const router = useRouter();
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Error", { description: "Passwords do not match" });
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Error", { description: "Password must be at least 6 characters" });
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
    toast.success("Password Updated!", { description: "Your sanctuary access is now secured." });
    setLoading(false);

    setTimeout(() => {
      router.push('/auth/login');
      router.refresh();
    }, 2000);
  };

  return (
    <AuthLayout 
      title="Set New Password" 
      subtitle="Create a secure gateway to your face yoga journey."
    >
      {success ? (
        <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] text-center space-y-4 backdrop-blur-xl">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-xl font-bold text-foreground">Success!</p>
          <p className="text-sm text-warm-gray leading-relaxed">
            Your password has been updated. Redirecting you to login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <AuthInput
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min. 6 characters"
            isPassword
          />

          <AuthInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            isPassword
            error={error}
          />

          <AuthButton
            type="submit"
            loading={loading}
            icon={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          >
            Update Password
          </AuthButton>
        </form>
      )}
    </AuthLayout>
  );
}
