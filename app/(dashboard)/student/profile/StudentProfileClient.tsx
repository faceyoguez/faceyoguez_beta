'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { CheckCircle2, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function StudentProfileClient({
  user,
  profile,
}: {
  user: User;
  profile: any;
}) {
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
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
    // Switch to OTP-based email verification
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email!,
      options: {
        shouldCreateUser: false,
      }
    });

    if (error) {
      toast.error('Failed to send verification code', { description: error.message });
    } else {
      toast.success('Verification code sent', { description: 'Please check your email inbox.' });
      setEmailOtpSent(true);
    }
    setLoadingEmail(false);
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) return;
    setVerifyingEmailOtp(true);
    const { error } = await supabase.auth.verifyOtp({
      email: user.email!,
      token: emailOtp,
      type: 'email',
    });

    if (error) {
      toast.error('Verification failed', { description: error.message });
    } else {
      // Unified Verification & Change Handler
      const updates: any = {
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: new Date().toISOString(),
      };

      if (isEditingPhone && newPhone) {
        updates.phone = newPhone;
      } else {
        updates.phone = newPhone || user.phone || profile?.phone;
      }

      const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', user.id);

      if (profileError) {
        console.error('Failed to update profile:', profileError);
      }

      toast.success('Changes saved successfully!', { description: 'Your identity has been verified and updated.' });
      setEmailOtpSent(false);
      setIsEditingPhone(false);
      setTimeout(() => window.location.reload(), 1500);
    }
    setVerifyingEmailOtp(false);
  };

  const handleUpdateAndVerifyPhone = async () => {
    if (!newPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setLoadingPhone(true);
    // Send OTP to EMAIL to authorize this change
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email!,
      options: {
        shouldCreateUser: false,
      }
    });

    if (error) {
      toast.error('Failed to send authorization code', { description: error.message });
    } else {
      toast.success('Authorization code sent', { description: 'Please check your email to confirm this change.' });
      setEmailOtpSent(true);
    }
    setLoadingPhone(false);
  };

  const handleVerifyPhone = async () => {
    const phoneToVerify = user.phone || profile?.phone;
    if (!phoneToVerify) {
      setIsEditingPhone(true);
      return;
    }
    
    setLoadingPhone(true);
    // Send OTP to EMAIL for verification
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email!,
      options: {
        shouldCreateUser: false,
      }
    });
    
    if (error) {
      toast.error('Failed to send verification code', { description: error.message });
    } else {
      toast.success('Verification code sent', { description: 'Please check your email to verify your identity.' });
      setEmailOtpSent(true);
    }
    setLoadingPhone(false);
  };

  return (
    <div className="container-app py-12 md:py-24 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-12">
        <h1 className="font-aktiv text-3xl sm:text-4xl md:text-5xl mb-4 text-zen-taupe leading-tight">Profile & Verification</h1>
        <p className="text-body-lg text-warm-gray">Manage your sanctuary access and contact details.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Info */}
        <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-12 premium-shadow relative overflow-hidden border border-outline-variant/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zen-peach/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          
          <h2 className="font-aktiv text-2xl mb-8 relative z-10 text-zen-taupe">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
              <p className="text-label-sm text-warm-gray uppercase tracking-wider mb-2 font-bold">Full Name</p>
              <p className="text-body-lg font-medium text-foreground">{profile?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-label-sm text-warm-gray uppercase tracking-wider mb-2 font-bold">Join Date</p>
              <p className="text-body-lg font-medium text-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Details & Verification */}
        <section id="verification-hub" className="relative scroll-mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="font-aktiv text-2xl text-zen-taupe">Verification Hub</h2>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-zen-peach/5 rounded-full border border-zen-peach/10 w-fit">
              <ShieldCheck className="w-4 h-4 text-[#E76F51]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E76F51]">Security Level: {(user.email_confirmed_at || profile?.email_confirmed_at) && (user.phone || profile?.phone) && (user.phone_confirmed_at || profile?.phone_confirmed_at) ? 'High' : 'Action Required'}</span>
            </div>
          </div>
          
          {!(user.phone || profile?.phone) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
              <Phone className="w-5 h-5 text-red-500" />
              <p className="text-sm font-bold text-red-700">Mobile number is required for account security.</p>
            </div>
          )}

          <div className="mb-8 p-6 bg-zen-peach/5 border border-zen-peach/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-aktiv text-lg text-zen-taupe">Unified Verification</h3>
              <p className="text-xs text-warm-gray">Verify both email and mobile via a single OTP sent to your email.</p>
            </div>
            <button 
              onClick={handleVerifyEmail}
              disabled={loadingEmail || !(newPhone || user.phone || profile?.phone)}
              className="px-8 py-3 rounded-full bg-[#E76F51] text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              Verify Both Now
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Card */}
            <div className={cn(
              "p-6 sm:p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between",
              user.email_confirmed_at 
                ? "bg-white/40 border-emerald-100 shadow-sm" 
                : "bg-white border-outline-variant/30 premium-shadow"
            )}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center",
                    user.email_confirmed_at ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  )}>
                    <Mail className="w-6 h-6" />
                  </div>
                  {user.email_confirmed_at ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Verified</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full">Unverified</span>
                  )}
                </div>
                <h3 className="font-aktiv text-xl mb-1 text-zen-taupe">Email Address</h3>
                <p className="text-body-md text-warm-gray mb-6 break-all">{user.email}</p>
              </div>
              
              {!user.email_confirmed_at && (
                <div className="space-y-3">
                  {emailOtpSent ? (
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        placeholder="6-digit Code" 
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="flex-1 bg-slate-50 border border-outline-variant/50 rounded-full px-5 py-3.5 text-sm font-bold tracking-[0.2em] text-center outline-none focus:border-[#E76F51] transition-colors"
                      />
                      <button 
                        onClick={handleVerifyEmailOtp}
                        disabled={verifyingEmailOtp || emailOtp.length < 6}
                        className="h-[52px] px-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#e76f51] transition-all disabled:opacity-50"
                      >
                        {verifyingEmailOtp ? '...' : <ArrowRight className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleVerifyEmail}
                      disabled={loadingEmail}
                      className="w-full py-4 rounded-full bg-[#1a1a1a] text-white font-bold text-sm hover:bg-[#e76f51] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingEmail ? 'Sending Code...' : 'Get Email Code'}
                    </button>
                  )}
                </div>
              )}
              {user.email_confirmed_at && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Primary contact verified
                </div>
              )}
            </div>

            {/* Phone Card */}
            <div className={cn(
              "p-6 sm:p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between",
              user.phone_confirmed_at 
                ? "bg-white/40 border-emerald-100 shadow-sm" 
                : "bg-white border-outline-variant/30 premium-shadow"
            )}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center",
                    user.phone_confirmed_at ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  )}>
                    <Phone className="w-6 h-6" />
                  </div>
                  {user.phone_confirmed_at ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Verified</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full">Unverified</span>
                  )}
                </div>
                <h3 className="font-aktiv text-xl mb-1 text-zen-taupe">Mobile Number <span className="text-red-500">*</span></h3>
                
                {isEditingPhone ? (
                  <div className="mt-2 mb-6">
                    <input 
                      type="tel"
                      placeholder="+1234567890"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-outline-variant/50 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-[#E76F51] transition-colors"
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
                    <p className="text-body-md text-warm-gray">{user.phone || profile?.phone || 'No phone added'}</p>
                    {!user.phone_confirmed_at && !profile?.phone_confirmed_at ? (
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
              
              {!(user.phone_confirmed_at || profile?.phone_confirmed_at) || isEditingPhone ? (
                <div className="space-y-3">
                  {emailOtpSent ? (
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        placeholder="Email OTP" 
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="flex-1 bg-slate-50 border border-outline-variant/50 rounded-full px-5 py-3.5 text-sm font-bold tracking-[0.2em] text-center outline-none focus:border-[#E76F51] transition-colors"
                      />
                      <button 
                        onClick={handleVerifyEmailOtp}
                        disabled={verifyingEmailOtp || emailOtp.length < 6}
                        className="h-[52px] px-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#e76f51] transition-all disabled:opacity-50"
                      >
                        {verifyingEmailOtp ? '...' : <ArrowRight className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={isEditingPhone ? handleUpdateAndVerifyPhone : handleVerifyPhone}
                      disabled={loadingPhone || (isEditingPhone && !newPhone)}
                      className="w-full py-4 rounded-full bg-[#1a1a1a] text-white font-bold text-sm hover:bg-[#e76f51] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {loadingPhone ? 'Sending Email Code...' : isEditingPhone ? 'Update via Email Code' : 'Verify via Email Code'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Mobile verified via email
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
