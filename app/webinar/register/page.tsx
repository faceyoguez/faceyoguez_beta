'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';

export default function WebinarRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!formData.name.trim()) {
      tempErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{8,15}$/.test(formData.phone.trim())) {
      tempErrors.phone = 'Please enter a valid phone number';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      // Success: Redirect to thank you page
      router.push('/webinar/thank-you');
    } catch (err: any) {
      console.error('Registration error:', err);
      setSubmitError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1a1a1a] font-jakarta overflow-x-hidden relative selection:bg-[#FF8A75]/20 selection:text-[#FF8A75] flex flex-col justify-between">
      <LuxuryBackground />

      {/* Simplified Navbar */}
      <nav className="w-full max-w-5xl mx-auto px-6 py-4 sm:py-5 flex items-center justify-between relative z-50">
        <Link 
          href="/webinar"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#2a2019]/60 hover:text-[#FF8A75] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Details
        </Link>
        <div className="font-sooner text-lg sm:text-xl font-bold text-[#2a2019] tracking-tight">
          faceyoguez
        </div>
      </nav>

      {/* Main Content Card Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-4 sm:py-8 relative z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#e76f51]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f4a261]/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="w-full max-w-[450px] bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 sm:p-8 shadow-[0_15px_30px_rgba(163,61,35,0.03)]"
        >
          <div className="text-center mb-5.5">
            <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[#FF8A75] mb-1 block">Secure Your Spot</span>
            <h1 className="text-2xl sm:text-[28px] font-aktiv font-bold text-[#2a2019] tracking-tight leading-tight">
              Register For The Live Session
            </h1>
            <p className="mt-1.5 text-xs sm:text-[13.5px] text-[#2a2019]/60 leading-relaxed max-w-[330px] sm:max-w-md mx-auto">
              Enter your details below to lock in your free seat. You will be redirected to the Zoom access & WhatsApp community link immediately after.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-1.5 w-full group">
              <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#2a2019]/60 transition-colors group-focus-within:text-[#FF8A75] pl-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Harsimrat Kaur"
                  disabled={isSubmitting}
                  className={`w-full bg-white/70 backdrop-blur-md border rounded-xl px-4.5 py-3 text-xs sm:text-sm text-[#1a1a1a] placeholder:text-[#2a2019]/30 outline-none transition-all focus:ring-4 shadow-sm ${
                    errors.name
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/5'
                      : 'border-[#2a2019]/10 focus:border-[#FF8A75] focus:ring-[#FF8A75]/5'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[9.5px] font-bold text-red-500 pl-2 mt-0.5">{errors.name}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-1.5 w-full group">
              <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#2a2019]/60 transition-colors group-focus-within:text-[#FF8A75] pl-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. harsimrat@example.com"
                  disabled={isSubmitting}
                  className={`w-full bg-white/70 backdrop-blur-md border rounded-xl px-4.5 py-3 text-xs sm:text-sm text-[#1a1a1a] placeholder:text-[#2a2019]/30 outline-none transition-all focus:ring-4 shadow-sm ${
                    errors.email
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/5'
                      : 'border-[#2a2019]/10 focus:border-[#FF8A75] focus:ring-[#FF8A75]/5'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[9.5px] font-bold text-red-500 pl-2 mt-0.5">{errors.email}</p>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5 w-full group">
              <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#2a2019]/60 transition-colors group-focus-within:text-[#FF8A75] pl-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number (WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  disabled={isSubmitting}
                  className={`w-full bg-white/70 backdrop-blur-md border rounded-xl px-4.5 py-3 text-xs sm:text-sm text-[#1a1a1a] placeholder:text-[#2a2019]/30 outline-none transition-all focus:ring-4 shadow-sm ${
                    errors.phone
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/5'
                      : 'border-[#2a2019]/10 focus:border-[#FF8A75] focus:ring-[#FF8A75]/5'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[9.5px] font-bold text-red-500 pl-2 mt-0.5">{errors.phone}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-[10px] font-bold text-red-600">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center justify-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-black uppercase tracking-[0.15em] text-white bg-[#e76f51] hover:bg-[#d4603f] rounded-full overflow-hidden transition-all shadow-[0_15px_30px_-10px_rgba(231,111,81,0.4)] active:scale-[0.98] w-full disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {isSubmitting ? 'Registering...' : 'Complete Registration'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>

            {/* Privacy note */}
            <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[9.5px] text-[#2a2019]/50 font-semibold tracking-wide pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Your contact details are secure and will never be shared.
            </div>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3.5 text-center text-[9px] text-[#2a2019]/40 border-t border-[#FF8A75]/5 relative z-50">
        &copy; {new Date().getFullYear()} faceyoguez. All rights reserved.
      </footer>
    </div>
  );
}
