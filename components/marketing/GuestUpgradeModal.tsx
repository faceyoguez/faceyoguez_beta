'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GuestUpgradeModalProps {
  onClose: () => void;
  /** Called right after the guest account becomes a real one — resume payment here.
   *  Email verification happens later, right before the welcome message on the
   *  purchase-success page (see EmailOtpVerifyCard) — not blocking payment itself. */
  onSuccess: () => void;
}

/**
 * Shown the moment a guest (anonymous-session) visitor clicks "Complete
 * Payment". Turns their existing guest account into a real one — same
 * account ID throughout, nothing to migrate — then lets the caller resume
 * straight into the Razorpay flow with zero page reload. A real
 * email+password now exists, so even if they never come back, the account
 * is still recoverable (unlike a pure anonymous session).
 */
export function GuestUpgradeModal({ onClose, onSuccess }: GuestUpgradeModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');
    if (!phone.trim() || phone.trim().length < 8) return setError('Please enter a valid phone number.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        password,
        data: { full_name: fullName, phone },
      });

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
      // Not fatal if it fails; payment can still proceed.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ full_name: fullName, email, phone }).eq('id', user.id);
      }

      toast.success('Account registered! Continuing to payment…');
      onSuccess();
    } catch (err) {
      console.error('[GuestUpgradeModal] Registration failed:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register & Continue to Payment'}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-4">
            Already have an account?{' '}
            <a href="/auth/login" className="font-bold text-[#e76f51] hover:underline">
              Log in
            </a>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
