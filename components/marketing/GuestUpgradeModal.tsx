'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShieldCheck, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GuestUpgradeModalProps {
  onClose: () => void;
  /** Called only once the guest account is real AND the email is verified — resume payment here. */
  onSuccess: () => void;
}

type Step = 'form' | 'verify';

/**
 * Shown the moment a guest (anonymous-session) visitor clicks "Complete
 * Payment". Turns their existing guest account into a real one — same
 * account ID throughout, nothing to migrate — then requires them to
 * verify their email (a real link click, same mechanism as the rest of
 * the app — see StudentProfileClient's "Verification Hub") before letting
 * the caller resume into the Razorpay flow.
 */
export function GuestUpgradeModal({ onClose, onSuccess }: GuestUpgradeModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');
    if (!phone.trim() || phone.trim().length < 8) return setError('Please enter a valid phone number.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);

    try {
      // Email + password go through Supabase Auth (email needs a
      // confirmation click before this account counts as verified).
      const { error: updateError } = await supabase.auth.updateUser(
        {
          email,
          password,
          data: { full_name: fullName, phone },
        },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=/student/plans` }
      );

      if (updateError) {
        if (/registered|exists|already/i.test(updateError.message)) {
          setError('This email is already registered. Please log in instead to continue.');
        } else {
          setError(updateError.message);
        }
        setLoading(false);
        return;
      }

      // Best-effort — the placeholder "Guest" profile row (created at
      // anonymous sign-in) should reflect their real name/email/phone now.
      // Not fatal if it fails; the account itself is already updated.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ full_name: fullName, email, phone }).eq('id', user.id);
      }

      // Already confirmed (e.g. project has email confirmation turned
      // off) — skip straight to payment instead of asking them to click
      // a link that was never sent.
      if (user?.email_confirmed_at) {
        toast.success('Account registered! Continuing to payment…');
        onSuccess();
        return;
      }

      setStep('verify');
      setLoading(false);
    } catch (err) {
      console.error('[GuestUpgradeModal] Registration failed:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) return setError('Enter the 6-digit code from your email.');
    setError('');
    setChecking(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'email_change' });
      if (otpError) {
        setError('That code is invalid or expired — check the latest email, or resend below.');
      } else {
        toast.success('Email verified! Continuing to payment…');
        onSuccess();
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'email_change',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/student/plans` },
      });
      if (resendError) {
        toast.error('Could not resend', { description: resendError.message });
      } else {
        toast.success('Verification email resent — check your inbox and spam folder.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {step === 'form' ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#e76f51]/10 flex items-center justify-center mb-5">
                <ShieldCheck className="w-7 h-7 text-[#e76f51]" />
              </div>

              <h2 className="text-2xl font-aktiv font-bold text-[#2a2019] mb-2">Almost there</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Register to complete your payment and secure your spot. This takes 10 seconds — your plan selection is saved.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e76f51]/30 focus:border-[#e76f51]"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e76f51]/30 focus:border-[#e76f51]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e76f51]/30 focus:border-[#e76f51]"
                />
                <input
                  type="password"
                  placeholder="Create a Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e76f51]/30 focus:border-[#e76f51]"
                />

                {error && (
                  <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                    {error.includes('already registered') && (
                      <a href="/auth/login" className="block mt-1.5 underline font-bold">
                        Go to login →
                      </a>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#2a2019] hover:bg-[#e76f51] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register & Verify Email'}
                </button>
              </form>

              <p className="text-[10px] text-slate-400 text-center mt-4">
                Already have an account?{' '}
                <a href="/auth/login" className="font-bold text-[#e76f51] hover:underline">
                  Log in
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <MailCheck className="w-7 h-7 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-aktiv font-bold text-[#2a2019] mb-2">Verify your email</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                We sent a 6-digit code to <span className="font-bold text-[#2a2019]">{email}</span>. Enter it below to continue.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
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
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
