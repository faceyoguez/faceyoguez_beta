'use client';

import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EmailOtpVerifyCardProps {
  email: string;
  /** Called once the 8-digit code is confirmed. */
  onVerified: () => void;
}

/**
 * Standalone (non-modal) version of the email code-verify step — used on
 * the purchase-success page for guests who registered right before
 * payment but haven't verified yet. Same `verifyOtp({ type: 'email_change' })`
 * mechanism as GuestUpgradeModal's original flow, just without the
 * surrounding popup chrome so it can sit inline, blocking the welcome
 * message until confirmed.
 */
export function EmailOtpVerifyCard({ email, onVerified }: EmailOtpVerifyCardProps) {
  const [otp, setOtp] = useState('');
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 8) return setError('Enter the 8-digit code from your email.');
    setError('');
    setChecking(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'email_change' });
      if (otpError) {
        setError('That code is invalid or expired — check the latest email, or resend below.');
      } else {
        toast.success('Email verified!');
        onVerified();
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'email_change', email });
      if (resendError) {
        toast.error('Could not resend', { description: resendError.message });
      } else {
        toast.success('Verification code resent — check your inbox and spam folder.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
        <MailCheck className="w-7 h-7 text-emerald-600" />
      </div>

      <h2 className="text-2xl font-aktiv font-bold text-[#2a2019] mb-2">You're in! Just one small step</h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        Your payment is confirmed — welcome to Faceyoguez 🌸 We just want to make sure this account is really
        yours, so it's always safe and yours to come back to. We've sent an 8-digit code to{' '}
        <span className="font-bold text-[#2a2019]">{email}</span> — pop it in below and we'll take you straight to your welcome page.
      </p>

      <form onSubmit={handleVerifyOtp} className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={8}
          placeholder="8-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-center text-lg tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-[#e76f51]/30 focus:border-[#e76f51]"
        />

        {error && (
          <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={checking}
          className="w-full py-4 bg-[#2a2019] hover:bg-[#e76f51] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full py-3 mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#e76f51] transition-colors flex items-center justify-center gap-2"
      >
        {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Resend code'}
      </button>

      <p className="text-[10px] text-slate-400 text-center mt-2">
        Didn't get it? Check your spam folder, or try resending above.
      </p>
    </div>
  );
}
