'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { CheckCircle2, Mail, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Profile } from '@/types/database';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  staff: 'Staff',
  client_management: 'Client Management',
};

export default function StudentProfileClient({
  user,
  profile,
}: {
  user: User;
  profile: Profile & { phone_confirmed_at?: string | null; email_confirmed_at?: string | null };
}) {
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const supabase = createClient();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(profile?.phone || user.phone || '');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#verify') {
      setTimeout(() => {
        const element = document.getElementById('verification-hub');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);

  const handleVerifyEmail = async () => {
    setLoadingEmail(true);
    // Standard Supabase resend for signup verification
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      toast.error('Failed to send verification link', { description: error.message });
    } else {
      toast.success('Verification link sent', { description: 'Please check your email inbox and spam.' });
    }
    setLoadingEmail(false);
  };

  const handleUpdateAndVerifyPhone = async () => {
    if (!newPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setLoadingPhone(true);
    // Triggers SMS OTP to the NEW number
    const { error } = await supabase.auth.updateUser({ 
      phone: newPhone 
    });

    if (error) {
      toast.error('SMS Failed', { description: error.message });
    } else {
      toast.success('OTP sent via SMS', { description: 'Enter the 6-digit code sent to your phone.' });
      setPhoneOtpSent(true);
    }
    setLoadingPhone(false);
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) return;
    setVerifyingPhoneOtp(true);
    
    const { error } = await supabase.auth.verifyOtp({
      phone: isEditingPhone ? newPhone : (user.phone || profile?.phone),
      token: phoneOtp,
      type: 'phone_change',
    });

    if (error) {
      toast.error('Verification failed', { description: error.message });
    } else {
      // Update profile record
      const { error: profileError } = await supabase.from('profiles').update({
        phone: isEditingPhone ? newPhone : (user.phone || profile?.phone),
        phone_confirmed_at: new Date().toISOString()
      }).eq('id', user.id);

      if (profileError) console.error('Profile sync error:', profileError);

      toast.success('Phone verified successfully!');
      setPhoneOtpSent(false);
      setPhoneOtp('');
      setIsEditingPhone(false);
      setTimeout(() => window.location.reload(), 1000);
    }
    setVerifyingPhoneOtp(false);
  };

  const handleVerifyPhone = async () => {
    const phoneToVerify = user.phone || profile?.phone;
    if (!phoneToVerify) {
      setIsEditingPhone(true);
      return;
    }

    setLoadingPhone(true);
    // Triggers SMS OTP to the EXISTING number
    //Test
    const { error } = await supabase.auth.updateUser({
      phone: phoneToVerify
    });

    if (error) {
      toast.error('SMS Failed', { description: error.message });
    } else {
      toast.success('OTP sent via SMS', { description: 'Enter the 6-digit code.' });
      setPhoneOtpSent(true);
    }
    setLoadingPhone(false);
  };

  const isEmailVerified = Boolean(user.email_confirmed_at || profile?.email_confirmed_at);
  const isPhoneVerified = Boolean(user.phone_confirmed_at || profile?.phone_confirmed_at);
  const verifiedCount = (isEmailVerified ? 1 : 0) + (isPhoneVerified ? 1 : 0);
  const roleLabel = ROLE_LABELS[profile?.role];

  return (
    <div className="container-app py-8 sm:py-12 md:py-24 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8 md:mb-10">
        <h1 className="font-aktiv text-2xl sm:text-4xl md:text-5xl mb-3 text-zen-taupe leading-tight">Profile & Verification</h1>
        <p className="text-sm sm:text-body-lg text-warm-gray">Manage your account access and contact details.</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Profile Hero */}
        <section className="bg-surface-container-lowest rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 border border-outline-variant/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-zen-peach/10 flex items-center justify-center shrink-0">
                <span className="font-aktiv text-2xl sm:text-[28px] text-[#E76F51]">
                  {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="font-aktiv text-xl sm:text-2xl text-zen-taupe leading-snug truncate">{profile?.full_name || 'Not provided'}</p>
                  {roleLabel && (
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-zen-peach/10 text-[#E76F51]">
                      {roleLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-warm-gray mt-0.5">
                  Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="sm:w-52 shrink-0 sm:pl-8 sm:border-l sm:border-outline-variant/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-warm-gray">Account Security</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E76F51]">{verifiedCount}/2</span>
              </div>
              <div className="flex items-center gap-1 mb-2.5">
                <div className={cn("h-1.5 flex-1 rounded-full transition-colors", isEmailVerified ? "bg-[#E76F51]" : "bg-outline-variant")} />
                <div className={cn("h-1.5 flex-1 rounded-full transition-colors", isPhoneVerified ? "bg-[#E76F51]" : "bg-outline-variant")} />
              </div>
              <p className="text-xs font-medium text-warm-gray flex items-center gap-1.5">
                {verifiedCount === 2 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Fully verified
                  </>
                ) : (
                  `${2 - verifiedCount} step${2 - verifiedCount > 1 ? 's' : ''} remaining`
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Details & Verification */}
        <section id="verification-hub" className="scroll-mt-12 space-y-5 sm:space-y-6">
          <div>
            <h2 className="font-aktiv text-xl sm:text-2xl text-zen-taupe">Verification</h2>
            <p className="text-sm text-warm-gray mt-1">Confirm your email and mobile number to secure your account.</p>
          </div>

          {!(user.phone || profile?.phone) && (
            <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-red-700">Add a mobile number to secure your account.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Email Card */}
            <div className={cn(
              "p-6 sm:p-7 rounded-3xl border transition-all duration-500 flex flex-col justify-between",
              isEmailVerified
                ? "bg-white border-outline-variant/40"
                : "bg-white border-outline-variant/60 premium-shadow"
            )}>
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    isEmailVerified ? "bg-emerald-50 text-emerald-600" : "bg-[#E76F51]/10 text-[#E76F51]"
                  )}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                    isEmailVerified ? "text-emerald-600 bg-emerald-50" : "text-warm-gray bg-surface-container-highest/60"
                  )}>
                    {isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <h3 className="font-aktiv text-lg mb-1 text-zen-taupe">Email Address</h3>
                <p className="text-sm text-warm-gray mb-6 break-all">{user.email}</p>
              </div>

              {!isEmailVerified && (
                <div className="space-y-3">
                  <button
                    onClick={handleVerifyEmail}
                    disabled={loadingEmail}
                    className="w-full py-3.5 rounded-full bg-[#1a1a1a] text-white font-bold text-sm hover:bg-[#e76f51] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingEmail ? 'Sending Link...' : 'Send Verification Link'}
                  </button>
                  <p className="text-[10px] text-center text-warm-gray">
                    Click the link in your inbox to verify
                  </p>
                </div>
              )}
              {isEmailVerified && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Primary contact verified
                </div>
              )}
            </div>

            {/* Phone Card */}
            <div className={cn(
              "p-6 sm:p-7 rounded-3xl border transition-all duration-500 flex flex-col justify-between",
              isPhoneVerified
                ? "bg-white border-outline-variant/40"
                : "bg-white border-outline-variant/60 premium-shadow"
            )}>
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    isPhoneVerified ? "bg-emerald-50 text-emerald-600" : "bg-[#E76F51]/10 text-[#E76F51]"
                  )}>
                    <Phone className="w-5 h-5" />
                  </div>
                  {isPhoneVerified ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Verified</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-warm-gray bg-surface-container-highest/60 px-2.5 py-1 rounded-full">Unverified</span>
                  )}
                </div>
                <h3 className="font-aktiv text-lg mb-1 text-zen-taupe">Mobile Number <span className="text-[#E76F51]">*</span></h3>

                {isEditingPhone ? (
                  <div className="mt-2 mb-6">
                    <input
                      type="tel"
                      placeholder="+91..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-outline-variant/50 rounded-2xl px-4 py-3 text-base font-medium outline-none focus:border-[#E76F51] transition-colors"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setIsEditingPhone(false)}
                        className="text-xs text-warm-gray hover:text-foreground underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-6 group">
                    <p className="text-sm text-warm-gray">{user.phone || profile?.phone || 'No phone added'}</p>
                    {!isPhoneVerified ? (
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="text-xs text-[#E76F51] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="text-xs text-[#E76F51] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Change
                      </button>
                    )}
                  </div>
                )}
              </div>

              {(!isPhoneVerified || isEditingPhone) ? (
                <div className="space-y-3">
                  {phoneOtpSent ? (
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <input
                        type="text"
                        placeholder="SMS Code"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="flex-1 min-w-0 bg-slate-50 border border-outline-variant/50 rounded-full px-4 sm:px-5 py-3.5 text-base font-bold tracking-[0.1em] sm:tracking-[0.2em] text-center outline-none focus:border-[#E76F51] transition-colors"
                      />
                      <button
                        onClick={handleVerifyPhoneOtp}
                        disabled={verifyingPhoneOtp || phoneOtp.length < 6}
                        className="h-[52px] px-4 sm:px-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#e76f51] transition-all disabled:opacity-50 shrink-0"
                      >
                        {verifyingPhoneOtp ? '...' : <ArrowRight className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={isEditingPhone ? handleUpdateAndVerifyPhone : handleVerifyPhone}
                      disabled={loadingPhone || (isEditingPhone && !newPhone)}
                      className="w-full py-3.5 rounded-full bg-[#1a1a1a] text-white font-bold text-sm hover:bg-[#e76f51] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingPhone ? 'Sending SMS...' : isEditingPhone ? 'Update via SMS' : 'Verify via SMS'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Mobile verified
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
