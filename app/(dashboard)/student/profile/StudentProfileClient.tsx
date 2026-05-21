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

  return (
    <div className="container-app py-8 sm:py-12 md:py-24 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8 md:mb-12">
        <h1 className="font-aktiv text-2xl sm:text-4xl md:text-5xl mb-3 text-zen-taupe leading-tight">Profile & Verification</h1>
        <p className="text-sm sm:text-body-lg text-warm-gray">Manage your sanctuary access and contact details.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Info */}
        <section className="bg-surface-container-lowest rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 premium-shadow relative overflow-hidden border border-outline-variant/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zen-peach/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          
          <h2 className="font-aktiv text-xl sm:text-2xl mb-6 md:mb-8 relative z-10 text-zen-taupe">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3 sm:gap-4">
            <h2 className="font-aktiv text-xl sm:text-2xl text-zen-taupe">Verification Hub</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zen-peach/5 rounded-full border border-zen-peach/10 w-fit max-w-full">
              <ShieldCheck className="w-4 h-4 text-[#E76F51] shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#E76F51] truncate">Security Level: {(user.email_confirmed_at || profile?.email_confirmed_at) && (user.phone || profile?.phone) && (user.phone_confirmed_at || profile?.phone_confirmed_at) ? 'High' : 'Action Required'}</span>
            </div>
          </div>
          
          {!(user.phone || profile?.phone) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
              <Phone className="w-5 h-5 text-red-500" />
              <p className="text-sm font-bold text-red-700">Mobile number is required for account security.</p>
            </div>
          )}

          <div className="mb-6 md:mb-8 p-5 sm:p-6 bg-zen-peach/5 border border-zen-peach/10 rounded-2xl sm:rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-aktiv text-base sm:text-lg text-zen-taupe">Multi-Channel Security</h3>
              <p className="text-xs text-warm-gray mt-1">Verify your identity via independent security channels.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
              {!user.email_confirmed_at && (
                <button 
                  onClick={handleVerifyEmail}
                  disabled={loadingEmail}
                  className="px-6 py-2.5 rounded-full bg-zen-taupe text-white font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Verify Email
                </button>
              )}
              {!(user.phone_confirmed_at || profile?.phone_confirmed_at) && (
                <button 
                  onClick={handleVerifyPhone}
                  disabled={loadingPhone || !(newPhone || user.phone || profile?.phone)}
                  className="px-6 py-2.5 rounded-full bg-[#E76F51] text-white font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Verify Phone
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Card */}
            <div className={cn(
              "p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between",
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
                  <button 
                    onClick={handleVerifyEmail}
                    disabled={loadingEmail}
                    className="w-full py-4 rounded-full bg-[#1a1a1a] text-white font-bold text-sm hover:bg-[#e76f51] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingEmail ? 'Sending Link...' : 'Send Verification Link'}
                  </button>
                  <p className="text-[10px] text-center text-warm-gray italic">
                    Click the link in your inbox to verify
                  </p>
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
              "p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between",
              user.phone_confirmed_at || profile?.phone_confirmed_at
                ? "bg-white/40 border-emerald-100 shadow-sm" 
                : "bg-white border-outline-variant/30 premium-shadow"
            )}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center",
                    user.phone_confirmed_at || profile?.phone_confirmed_at ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  )}>
                    <Phone className="w-6 h-6" />
                  </div>
                  {(user.phone_confirmed_at || profile?.phone_confirmed_at) ? (
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
                    <p className="text-body-md text-warm-gray">{user.phone || profile?.phone || 'No phone added'}</p>
                    {!(user.phone_confirmed_at || profile?.phone_confirmed_at) ? (
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
              
              {(!(user.phone_confirmed_at || profile?.phone_confirmed_at) || isEditingPhone) ? (
                <div className="space-y-3">
                  {phoneOtpSent ? (
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <input 
                        type="text" 
                        placeholder="SMS Code" 
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="flex-1 bg-slate-50 border border-outline-variant/50 rounded-full px-4 sm:px-5 py-3.5 text-base font-bold tracking-[0.1em] sm:tracking-[0.2em] text-center outline-none focus:border-[#E76F51] transition-colors"
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
                      className="w-full py-4 rounded-full bg-[#1a1a1a] text-white font-bold text-sm hover:bg-[#e76f51] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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
