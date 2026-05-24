'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MessageCircle, Calendar, ShieldCheck, Heart, Camera, Zap } from 'lucide-react';
import { PlanNavigation } from '@/components/marketing/PlanNavigation';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';
import { pixel } from '@/lib/pixel';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CONSULTATION_PRICE = 999;
const CONSULTATION_CREDIT = 999;

const TIERS = [
  { label: 'Plan 1 — Monthly', orig: 8000, disc: 5499, tag: 'Basic', months: 1 },
  { label: 'Plan 2 — 3 Months', orig: 24000, disc: 11000, tag: 'Best Value', months: 3 },
  { label: 'Plan 3 — 6 Months', orig: 48000, disc: 18000, tag: '60% OFF', months: 6 },
  { label: 'Plan 4 — 12 Months', orig: 96000, disc: 30000, tag: '70% OFF', months: 12 },
];

interface Props {
  userId?: string;
  hasCredit?: boolean;  // user paid for consultation and hasn't used credit yet
  hasActiveConsultation?: boolean; // user already has paid/active consultation
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PersonalClassesPage({ userId, hasCredit, hasActiveConsultation }: Props) {
  const router = useRouter();

  useEffect(() => {
    pixel.viewContent({ contentName: 'Personal Classes Plan Page', contentIds: ['one_on_one'] });
    pixel.planPageView('personal_classes');
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const workOn = [
    "Sagging & Loss of Firmness", "Puffiness & Facial Bloating", "Double Chin",
    "Fine Lines & Wrinkles", "Dullness & Poor Complexion", "Facial Asymmetry",
    "Eye Bags & Dark Circles", "Drooping Eyelids & Cheeks", "Muscle Tension & Stiffness",
    "Aging & Loss of Elasticity", "Dryness & Dehydration", "Stress Lines", "Loss of Jawline Definition"
  ];

  const handleConsultationPurchase = async () => {
    // Per user logic: clicking consultation redirects to plans section on the sidebar
    const redirectPath = '/student/plans?plan=one_on_one';
    
    if (!userId) {
      window.location.href = `/auth/signup?redirectTo=${encodeURIComponent(redirectPath)}`;
      return;
    } 
    
    // If logged in, we check if they already have an active consultation
    // However, per user request: "if some one clicks on consultation redirect to plans section on the sidebar"
    // So we just redirect them to plans.
    router.push(redirectPath);
  };

  const handlePlanPurchase = async (tierIdx: number) => {
    const redirectPath = encodeURIComponent(`/student/plans?plan=one_on_one&tierIdx=${tierIdx}`);
    window.location.href = `/auth/signup?redirectTo=${redirectPath}`;
  };

  return (
    <main className="min-h-screen bg-[#FFFAF7] selection:bg-[#e76f51]/10 selection:text-[#e76f51] pb-20">
      <LuxuryBackground />
      <PlanNavigation title="High Mastery // 1:1" />

      <div className="max-w-7xl mx-auto pt-24 px-6 md:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* HERO */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#e76f51]/10 text-[#e76f51] text-[10px] font-black uppercase tracking-[0.3em] rounded-full">✨ 1-1 Consultation & Personalised Plan</span>
                <div className="h-px bg-[#2c2525]/5 flex-1" />
              </div>
              <h1 className="text-4xl md:text-6xl font-light text-[#2c2525] leading-none" style={{ fontFamily: 'var(--font-cormorant)' }}>
                Because Your Face <br />
                <span className="text-[#e76f51]">Deserves a Plan Made Only for You.</span>
              </h1>
              <div className="pt-6 space-y-4 border-t border-[#2c2525]/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#e76f51]">😔 Does Any of This Sound Familiar?</h3>
                <p className="text-sm text-[#5d605c] leading-relaxed">
                  You've tried group programmes, generic routines, and that one viral face massage everyone was doing — and while others seemed to glow, you were left thinking <span className="italic">"why isn't this working for me?"</span>
                </p>
                <p className="text-sm text-[#5d605c] leading-relaxed">
                  Here's the truth: your face is not the same as everyone else's. Your bone structure, your muscle tension, your skin concerns — all of it is uniquely, specifically yours.
                </p>
                <p className="text-sm font-bold text-[#2c2525]">
                  The plan adjusts itself to fit you. You're not adjusting yourself to fit a plan.
                </p>
              </div>
            </motion.div>

            {/* BENTO: Targeted Areas */}
            <motion.div variants={itemVariants} className="bg-[#2c2525] rounded-[2rem] p-10 text-[#FAF9F6]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 mb-8">📌 What We Work On</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {workOn.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    <Check className="w-3 h-3 text-[#e76f51]" strokeWidth={3} />
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 italic">
                Not sure if your concern is listed? Your personal consultation will address it directly.
              </p>
            </motion.div>

            {/* BENTO: Steps */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#2c2525]/30 mb-10">🗺️ Your Journey — Step by Step</h2>
              <div className="space-y-8">
                {[
                  { t: "Enrol & Get Instant Access", d: "Receive your confirmation email and immediate access to your personal Dashboard." },
                  { t: "Share Your Photo for Evaluation", d: "Upload your current photo — this becomes your Day 1 and the starting point of your transformation." },
                  { t: "Book Your 1-1 Consultation Call", d: "Use the Schedule a Meeting link in your dashboard to book your personal video call with Harsimrat." },
                  { t: "Receive Your Customised Plan", d: "After your consultation, your personalised plan with video demonstrations is uploaded to your dashboard." },
                  { t: "Follow Your Plan & Stay Connected", d: "Work through your plan daily. Use the Daily Reflection to stay consistent. Expert help is a message away." }
                ].map((step, sidx) => (
                  <div key={sidx} className="flex gap-6 group">
                    <div className="w-8 h-8 rounded-full bg-[#fcf8f7] border border-[#e76f51]/10 flex items-center justify-center text-[10px] font-black text-[#e76f51] flex-shrink-0 group-hover:bg-[#e76f51] group-hover:text-white transition-all">
                      {sidx + 1}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-[#2c2525] uppercase tracking-wider">{step.t}</h4>
                      <p className="text-[11px] text-[#5d605c] font-medium leading-relaxed">{step.d}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#e76f51]">
                  📝 Your customised plan is yours for a lifetime — access it anytime, anywhere.
                </div>
              </div>
            </motion.div>

            {/* BENTO: Dashboard Features */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#e76f51]/5 p-8 rounded-[2rem] border border-[#e76f51]/10 space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#e76f51]">📱 Inside Your Personal Dashboard</h3>
                <div className="space-y-4">
                  {[
                    { i: Camera, t: "Journey Path", d: "Track transformation at Day 1, 7, 14, 21, 30." },
                    { i: MessageCircle, t: "Personal Chat", d: "A direct message line to Harsimrat for guidance." },
                    { i: Calendar, t: "Schedule Meeting", d: "Book consultations with 1 click." },
                    { i: Zap, t: "Daily Reflection", d: "A simple daily check-in to keep you mindful." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <item.i className="w-4 h-4 text-[#e76f51] mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-black text-[#2c2525] uppercase tracking-widest">{item.t}</h4>
                        <p className="text-[10px] text-[#2c2525]/60 leading-tight">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-[#2c2525]/5 space-y-8 flex flex-col justify-center text-center">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-[#e76f51] uppercase tracking-[0.3em]">⏳ What to Expect</span>
                  <div className="space-y-4 pt-4 text-left">
                    {[
                      { time: '15 Days', result: 'Early changes begin to show' },
                      { time: '30 Days', result: 'Visible, real results' },
                      { time: '3-6 Months', result: 'Complete transformation' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>{item.time}</span>
                        <span className="text-[10px] font-bold text-[#2c2525]/40 uppercase tracking-widest">{item.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: PRICING */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            {/* Credit badge */}
            {hasCredit && (
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-[#e76f51]/10 to-[#e76f51]/5 border-2 border-[#e76f51]/30 rounded-[1.5rem] p-5 flex items-start gap-3"
              >
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-[10px] font-black text-[#e76f51] uppercase tracking-[0.2em]">Consultation Credit Active</p>
                  <p className="text-sm font-bold text-[#2c2525] mt-1">₹999 OFF applied automatically on your first plan below</p>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-[#e76f51]/20 shadow-xl space-y-8">
              <div className="text-center space-y-1">
                <ShieldCheck className="w-8 h-8 text-[#e76f51] mx-auto mb-2" strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#e76f51]">Selective Availability</span>
                <h3 className="text-lg font-bold text-[#2c2525] uppercase tracking-widest">Pricing Tiers</h3>
              </div>

              <div className="space-y-3">
                {TIERS.map((tier, tidx) => {
                  const displayPrice = hasCredit ? Math.max(tier.disc - CONSULTATION_CREDIT, 0) : tier.disc;

                  return (
                    <button
                      key={tidx}
                      onClick={() => handlePlanPurchase(tidx)}
                      className={`w-full p-4 rounded-2xl border text-left ${tidx === 1 ? 'border-[#e76f51] bg-[#e76f51]/5' : 'border-[#2c2525]/5 bg-[#fcf8f7]'} relative transition-transform hover:scale-[1.02] cursor-pointer`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-black text-[#2c2525] uppercase tracking-tighter">{tier.label}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-[#2c2525]">{formatINR(displayPrice)}</span>
                            {hasCredit && (
                              <span className="text-[9px] text-[#e76f51] line-through tracking-widest">{formatINR(tier.disc)}</span>
                            )}
                            <span className="text-[9px] text-[#2c2525]/30 line-through tracking-widest">{formatINR(tier.orig)}</span>
                          </div>
                          {hasCredit && (
                            <p className="text-[8px] text-[#e76f51] font-bold uppercase tracking-widest">-₹999 consultation credit</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 bg-[#e76f51] text-white text-[7px] font-black uppercase rounded-full tracking-widest">{tier.tag}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Perks */}
              <div className="p-5 border-2 border-dashed border-[#e76f51]/10 rounded-2xl space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#e76f51]">🎁 Membership Perks</h4>
                <ul className="space-y-2">
                  {[
                    "15 bonus days (6m) / 1 extra month (12m)",
                    "Free lifetime 21-Day Transformation recordings",
                    "Complete Face Yoga Manual (worth ₹3,000) FREE",
                    "50% off on Maintenance Plan",
                    "10% referral discount on renewal"
                  ].map((perk, pidx) => (
                    <li key={pidx} className="text-[9px] font-bold text-[#2c2525]/60 flex items-start gap-2">
                      <Heart className="w-3 h-3 text-[#e76f51] mt-0.5 flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 text-[8px] font-black text-[#e76f51] text-center uppercase tracking-widest">
                💳 Plan 4 can be paid in 2 easy instalments.
              </div>

              {/* CONSULTATION BUTTON */}
              <div className="space-y-3">
                {/* Consultation CTA */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFAF7] to-[#fff5f0] border border-[#e76f51]/10">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#e76f51] mb-2">💬 Not Sure Where to Start?</p>
                  <p className="text-[10px] text-[#5d605c] leading-relaxed mb-3">
                    Book a personal 30-min consultation with our expert — understand your face, your goals, and the right plan for you.{' '}
                    <strong className="text-[#e76f51]">₹999 paid here will be deducted from your 1-on-1 plan (first purchase only).</strong>
                  </p>
                  <button
                    onClick={handleConsultationPurchase}
                    disabled={hasActiveConsultation}
                    id="book-consultation-btn"
                    className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-2 ${
                      hasActiveConsultation
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                        : 'bg-[#e76f51]/10 text-[#e76f51] border border-[#e76f51]/20 hover:bg-[#e76f51] hover:text-white'
                    }`}
                  >
                    {hasActiveConsultation ? (
                      <>✅ Consultation Active</>
                    ) : (
                      <>
                        <MessageCircle className="w-3.5 h-3.5" />
                        Book Consultation — ₹999
                      </>
                    )}
                  </button>
                </div>

                {/* Main subscribe button */}
                <button
                  onClick={() => {
                    pixel.initiateCheckout({ value: TIERS[1].disc, planId: 'one_on_one', planLabel: TIERS[1].label });
                    handlePlanPurchase(1);
                  }}
                  id="subscribe-now-btn"
                  className="w-full py-5 bg-[#2c2525] text-[#FAF9F6] rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#e76f51] transition-all duration-500 shadow-lg shadow-[#2c2525]/10 flex items-center justify-center gap-2"
                >
                  Subscribe Now
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <footer className="mt-20 border-t border-[#2c2525]/5 pt-20 pb-10 px-8 text-center max-w-4xl mx-auto space-y-8">
        <h2 className="text-4xl font-light text-[#2c2525] leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
          No filters. No treatments. <br /> <span className="italic text-[#e76f51]">Just Your Face.</span>
        </h2>
        <button
          onClick={() => {
            pixel.initiateCheckout({ value: TIERS[1].disc, planId: 'one_on_one', planLabel: 'Personal Classes — Footer CTA' });
            window.location.href = '/auth/signup';
          }}
          className="text-[10px] font-black uppercase tracking-[0.5em] text-[#2c2525] border-b border-[#e76f51] pb-2 hover:opacity-60 transition-opacity"
        >
          Start Your Journey
        </button>
      </footer>
    </main>
  );
}
