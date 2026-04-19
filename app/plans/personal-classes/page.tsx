'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Star, Target, MessageCircle, Calendar, ShieldCheck, Heart, Camera, Clock, Zap } from 'lucide-react';
import { PlanNavigation } from '@/components/marketing/PlanNavigation';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';

export default function PersonalClassesPage() {
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

  return (
    <main className="min-h-screen bg-[#FFFAF7] selection:bg-[#bc162d]/10 selection:text-[#bc162d] pb-20">
      <LuxuryBackground />
      <PlanNavigation title="High Mastery // 1:1" />

      <div className="max-w-7xl mx-auto pt-24 px-6 md:px-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT COLUMN: Deep Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* HERO */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 bg-[#bc162d]/10 text-[#bc162d] text-[10px] font-black uppercase tracking-[0.3em] rounded-full">✨ 1-1 Consultation & Personalised Plan</span>
                 <div className="h-px bg-[#2c2525]/5 flex-1" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light text-[#2c2525] leading-none" style={{ fontFamily: 'var(--font-cormorant)' }}>
                Because Your Face <br /> 
                <span className="italic">Deserves a Plan Made Only for You.</span>
              </h1>

              {/* Pain Point Section */}
              <div className="pt-6 space-y-4 border-t border-[#2c2525]/5">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#bc162d]">😔 Does Any of This Sound Familiar?</h3>
                 <p className="text-sm text-[#5d605c] leading-relaxed">
                   You’ve tried group programmes, generic routines, and that one viral face massage everyone was doing — and while others seemed to glow, you were left thinking <span className="italic">“why isn’t this working for me?”</span>
                 </p>
                 <p className="text-sm text-[#5d605c] leading-relaxed">
                   Here’s the truth: your face is not the same as everyone else’s. Your bone structure, your muscle tension, your skin concerns — all of it is uniquely, specifically yours.
                 </p>
                 <p className="text-sm font-bold text-[#2c2525]">
                   The plan adjusts itself to fit you. You’re not adjusting yourself to fit a plan.
                 </p>
              </div>
            </motion.div>

            {/* BENTO: Targeted Areas */}
            <motion.div variants={itemVariants} className="bg-[#2c2525] rounded-[2rem] p-10 text-[#FAF9F6]">
               <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 mb-8">📌 What We Work On</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                  {workOn.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                       <Check className="w-3 h-3 text-[#bc162d]" strokeWidth={3} />
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
                      <div className="w-8 h-8 rounded-full bg-[#fcf8f7] border border-[#bc162d]/10 flex items-center justify-center text-[10px] font-black text-[#bc162d] flex-shrink-0 group-hover:bg-[#bc162d] group-hover:text-white transition-all">
                         {sidx + 1}
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-xs font-black text-[#2c2525] uppercase tracking-wider">{step.t}</h4>
                         <p className="text-[11px] text-[#5d605c] font-medium leading-relaxed">{step.d}</p>
                      </div>
                   </div>
                 ))}
                 <div className="pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#bc162d]">
                   📝 Your customised plan is yours for a lifetime — access it anytime, anywhere.
                 </div>
              </div>
            </motion.div>

            {/* BENTO: Dashboard Features */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#bc162d]/5 p-8 rounded-[2rem] border border-[#bc162d]/10 space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#bc162d]">📱 Inside Your Personal Dashboard</h3>
                  <div className="space-y-4">
                     {[
                       { i: Camera, t: "Journey Path", d: "Track transformation at Day 1, 7, 14, 21, 30." },
                       { i: MessageCircle, t: "Personal Chat", d: "A direct message line to Harsimrat for guidance." },
                       { i: Calendar, t: "Schedule Meeting", d: "Book consultations with 1 click." },
                       { i: Zap, t: "Daily Reflection", d: "A simple daily check-in to keep you mindful." }
                     ].map((item, idx) => (
                       <div key={idx} className="flex gap-3">
                          <item.i className="w-4 h-4 text-[#bc162d] mt-0.5" />
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
                     <span className="text-[10px] font-black text-[#bc162d] uppercase tracking-[0.3em]">⏳ What to Expect</span>
                     <div className="space-y-4 pt-4 text-left">
                        <div className="flex items-center gap-4">
                           <span className="text-xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>15 Days</span>
                           <span className="text-[10px] font-bold text-[#2c2525]/40 uppercase tracking-widest">Early changes begin to show</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>30 Days</span>
                           <span className="text-[10px] font-bold text-[#2c2525]/40 uppercase tracking-widest">Visible, real results</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>3-6 Months</span>
                           <span className="text-[10px] font-bold text-[#2c2525]/40 uppercase tracking-widest">Complete transformation</span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: PRICING (4 TIERS) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
             <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-[#bc162d]/20 shadow-xl space-y-8">
                <div className="text-center space-y-1">
                   <ShieldCheck className="w-8 h-8 text-[#bc162d] mx-auto mb-2" strokeWidth={1.5} />
                   <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#bc162d]">Selective Availability</span>
                   <h3 className="text-lg font-bold text-[#2c2525] uppercase tracking-widest">Pricing Tiers</h3>
                </div>

                <div className="space-y-3">
                   {[
                     { label: "Plan 1 — Monthly", orig: "₹8,000", disc: "₹5,499", tag: "Basic" },
                     { label: "Plan 2 — 3 Months", orig: "₹24,000", disc: "₹11,000", tag: "Best Value" },
                     { label: "Plan 3 — 6 Months", orig: "₹48,000", disc: "₹18,000", tag: "60% OFF" },
                     { label: "Plan 4 — 12 Months", orig: "₹96,000", disc: "₹30,000", tag: "70% OFF" },
                   ].map((tier, tidx) => (
                     <div key={tidx} className={`p-4 rounded-2xl border ${tidx === 1 ? 'border-[#bc162d] bg-[#bc162d]/5' : 'border-[#2c2525]/5 bg-[#fcf8f7]'} relative transition-transform hover:scale-[1.02] cursor-pointer`}>
                        <div className="flex justify-between items-start mb-2">
                           <div className="space-y-0.5">
                              <h4 className="text-[10px] font-black text-[#2c2525] uppercase tracking-tighter">{tier.label}</h4>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm font-black text-[#2c2525]">{tier.disc}</span>
                                 <span className="text-[9px] text-[#2c2525]/30 line-through tracking-widest">{tier.orig}</span>
                              </div>
                           </div>
                           <span className="px-2 py-0.5 bg-[#bc162d] text-white text-[7px] font-black uppercase rounded-full tracking-widest">{tier.tag}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-5 border-2 border-dashed border-[#bc162d]/10 rounded-2xl space-y-4">
                   <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#bc162d]">🎁 Membership Perks</h4>
                   <ul className="space-y-2">
                      {[
                        "15 bonus days (6m) / 1 extra month (12m)",
                        "Free lifetime 21-Day Transformation recordings",
                        "Complete Face Yoga Manual (worth ₹3,000) FREE",
                        "50% off on Maintenance Plan",
                        "10% referral discount on renewal"
                      ].map((perk, pidx) => (
                        <li key={pidx} className="text-[9px] font-bold text-[#2c2525]/60 flex items-start gap-2">
                           <Heart className="w-3 h-3 text-[#bc162d] mt-0.5 flex-shrink-0" />
                           {perk}
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="pt-2 text-[8px] font-black text-[#bc162d] text-center uppercase tracking-widest">
                  💳 Plan 4 can be paid in 2 easy instalments.
                </div>

                <button 
                  onClick={() => window.location.href = '/auth/signup'}
                  className="w-full py-5 bg-[#2c2525] text-[#FAF9F6] rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#bc162d] transition-all duration-500 shadow-lg shadow-[#2c2525]/10"
                >
                  Join the Masterclass
                </button>
             </motion.div>
          </div>
        </motion.div>
      </div>

      <footer className="mt-20 border-t border-[#2c2525]/5 pt-20 pb-10 px-8 text-center max-w-4xl mx-auto space-y-8">
           <h2 className="text-4xl font-light text-[#2c2525] leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
             No filters. No treatments. <br /> <span className="italic text-[#bc162d]">Just Your Face.</span>
           </h2>
           <button 
              onClick={() => window.location.href = '/auth/signup'}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-[#2c2525] border-b border-[#bc162d] pb-2 hover:opacity-60 transition-opacity"
           >
             Start Your Journey
           </button>
      </footer>
    </main>
  );
}
