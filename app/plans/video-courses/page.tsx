'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, BookOpen, Monitor, Clock, Play, Layers, Smartphone, Download, Unlock, ShieldCheck, Heart } from 'lucide-react';
import { PlanNavigation } from '@/components/marketing/PlanNavigation';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';

export default function VideoCoursesPage() {
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
    <main className="min-h-screen bg-[#FFFAF7] selection:bg-[#5a6343]/10 selection:text-[#5a6343] pb-20">
      <LuxuryBackground />
      <PlanNavigation title="Video Mastery // Lifetime" />

      <div className="max-w-7xl mx-auto pt-24 px-6 md:px-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT COLUMN: Library & Curriculum */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* HERO */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5 shadow-sm space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 transform group-hover:rotate-12 transition-transform duration-700">
                 <Layers className="w-16 h-16 text-[#5a6343]/5" />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#5a6343]/10 text-[#5a6343] text-[10px] font-black uppercase tracking-[0.3em] rounded-full">✨ Recorded Plan — Lifetime Access</span>
                    <div className="h-px bg-[#2c2525]/5 flex-1" />
                 </div>
                 
                 <h1 className="text-4xl md:text-7xl font-light text-[#2c2525] leading-none" style={{ fontFamily: 'var(--font-cormorant)' }}>
                   Your Transformation. <br /> 
                   <span className="italic text-[#5a6343]">Your Pace. Your Time.</span>
                 </h1>

                 <div className="pt-4 space-y-4">
                    <p className="text-sm text-[#5d605c] font-medium leading-relaxed max-w-2xl">
                      Life is busy, schedules are unpredictable. This is for the person who wants structured face yoga without being tied to a timetable.
                    </p>
                    <p className="text-sm font-bold text-[#2c2525]">
                      No live sessions. No pressure. No expiry date.
                    </p>
                 </div>
              </div>
            </motion.div>

            {/* BENTO: Two Levels */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-8 rounded-[2rem] border border-[#2c2525]/5 space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#5a6343]">🌱 Level 1</span>
                     <span className="text-[9px] font-bold text-[#5a6343] uppercase border border-[#5a6343]/20 px-2 py-0.5 rounded-full">16 Sessions</span>
                  </div>
                  <h3 className="text-xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>Foundation & Basics</h3>
                  <ul className="space-y-3">
                     {[
                       "Introduction & Basic Exercises",
                       "Posture Awareness & Entry-Level Tech",
                       "Skincare Basics & Lymphatic Drainage",
                       "Building a Sustainable Daily Practice"
                     ].map((item, idx) => (
                       <li key={idx} className="flex gap-3 text-[10px] font-bold text-[#2c2525]/60 uppercase tracking-widest">
                          <Check className="w-3.5 h-3.5 text-[#5a6343] mt-0.5 flex-shrink-0" strokeWidth={3} />
                          {item}
                       </li>
                     ))}
                  </ul>
               </div>

               <div className="bg-[#2c2525] p-8 rounded-[2rem] text-white space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#5a6343]">🔥 Level 2</span>
                     <span className="text-[9px] font-bold text-[#5a6343] uppercase border border-[#5a6343]/20 px-2 py-0.5 rounded-full">16 Sessions</span>
                  </div>
                  <h3 className="text-xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>Advanced Techniques</h3>
                  <ul className="space-y-3 text-white/60">
                     {[
                       "Progressive Focused Sculpting",
                       "Enhanced Facial Symmetry",
                       "Advanced Lymphatic Drainage",
                       "In-depth Skincare Integration"
                     ].map((item, idx) => (
                       <li key={idx} className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
                          <Check className="w-3.5 h-3.5 text-[#5a6343] mt-0.5 flex-shrink-0" strokeWidth={3} />
                          {item}
                       </li>
                     ))}
                  </ul>
               </div>
            </motion.div>

            {/* BENTO: Steps & Dashboard */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#2c2525]/30">🗺️ Your Journey — Step by Step</h2>
                  <div className="space-y-6">
                     {[
                       { t: "Instant Confirmation", d: "Immediate access to your personal Dashboard." },
                       { t: "Access Your Plan", d: "Organised and ready to go — log in anytime, anywhere." },
                       { t: "Upload Day 1 Photo", d: "Add your baseline photo to track your transformation." },
                       { t: "Unlock as You Go", d: "Sessions open progressively, building on each step." },
                       { t: "Practice at Your Pace", d: "Morning or night — consistency is the only rule." }
                     ].map((item, idx) => (
                       <div key={idx} className="flex gap-4 group">
                          <span className="text-[10px] font-black text-[#5a6343]">0{idx+1}</span>
                          <div className="space-y-0.5">
                             <h4 className="text-[10px] font-bold uppercase text-[#2c2525]">{item.t}</h4>
                             <p className="text-[10px] text-[#5d605c] font-medium">{item.d}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-8">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#2c2525]/30">📱 Inside Your Dashboard</h2>
                  <div className="grid grid-cols-1 gap-4">
                     {[
                        { i: Monitor, t: "Progress Tracker", d: "Upload photos and watch your transformation unfold." },
                        { i: Unlock, t: "Unlock System", d: "Progressive access to keep you structured." },
                        { i: Play, t: "Lifetime Sessions", d: "Every recorded session, accessible forever." },
                        { i: Smartphone, t: "Device Agnostic", d: "Access from mobile, tablet, or desktop." }
                     ].map((item, idx) => (
                       <div key={idx} className="flex items-center gap-4 p-4 bg-[#fcf8f7] rounded-2xl border border-[#2c2525]/5">
                          <item.i className="w-4 h-4 text-[#5a6343] flex-shrink-0" />
                          <div className="space-y-0.5">
                             <h4 className="text-[10px] font-bold text-[#2c2525] uppercase tracking-widest">{item.t}</h4>
                             <p className="text-[9px] text-[#2c2525]/50 leading-tight uppercase font-black">{item.d}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>

            {/* WHAT WE WORK ON COMPACT LIST */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border-2 border-dashed border-[#5a6343]/10">
               <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#2c2525] mb-8 text-center">🎯 Targeted Mastery Areas</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {workOn.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-[#2c2525]/50 group">
                       <Check className="w-2.5 h-2.5 text-[#5a6343] group-hover:scale-125 transition-transform" strokeWidth={4} />
                       {item}
                    </div>
                  ))}
               </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: PRICING (L1 vs L1+L2) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-[#5a6343]/20 shadow-xl space-y-10 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#5a6343]" />
               <div className="text-center space-y-2">
                   <ShieldCheck className="w-8 h-8 text-[#5a6343] mx-auto opacity-40" strokeWidth={1.5} />
                   <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#5a6343]">One-Time Payment</span>
                   <h3 className="text-lg font-bold text-[#2c2525] uppercase tracking-widest">Mastery Pricing</h3>
               </div>

               <div className="space-y-4">
                  <div className="p-6 bg-[#fcf8f7] border border-[#2c2525]/5 rounded-2xl space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h4 className="text-[10px] font-black text-[#2c2525] uppercase tracking-widest">Level 1 Only</h4>
                           <span className="text-[8px] font-bold text-[#5a6343] uppercase tracking-widest">16 Sessions</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#5a6343] text-white text-[7px] font-black uppercase rounded-full tracking-widest">Foundation</span>
                     </div>
                     <div className="flex items-end gap-3">
                        <span className="text-2xl font-black text-[#2c2525]">₹999</span>
                        <span className="text-xs text-[#2c2525]/30 line-through mb-1 tracking-widest">₹1,999</span>
                     </div>
                  </div>

                  <div className="p-6 bg-[#5a6343]/5 border-2 border-[#5a6343]/20 rounded-2xl space-y-4 shadow-lg">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h4 className="text-[10px] font-black text-[#2c2525] uppercase tracking-widest">Level 1 + Level 2</h4>
                           <span className="text-[8px] font-bold text-[#5a6343] uppercase tracking-widest">32 Sessions</span>
                        </div>
                        <span className="px-2 py-0.5 bg-white text-[#5a6343] text-[7px] font-black uppercase rounded-full tracking-widest border border-[#5a6343]/20 shadow-sm">62.5% OFF</span>
                     </div>
                     <div className="flex items-end gap-3">
                        <span className="text-3xl font-black text-[#5a6343]">₹1,499</span>
                        <span className="text-xs text-[#2c2525]/30 line-through mb-1 tracking-widest">₹3,999</span>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-[#2c2525] rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                     <Clock className="w-5 h-5 text-[#5a6343]" />
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5a6343]">Access Duration</span>
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider italic">Lifetime Sanctuary Access</h4>
                  <p className="text-[10px] text-white/40 leading-tight">
                    Your transformation ritual never expires. Log in and revisit any lesson, anytime.
                  </p>
               </div>

               <button 
                  onClick={() => window.location.href = '/auth/signup'}
                  className="w-full py-5 bg-[#2c2525] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#5a6343] transition-all duration-500 shadow-xl"
               >
                 Unlock Lifetime Access
               </button>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 border-2 border-dashed border-[#5a6343]/10 rounded-3xl space-y-4 text-center">
               <Heart className="w-6 h-6 text-[#5a6343] mx-auto opacity-20" />
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2c2525]/40 leading-relaxed">
                 Start today. Finish on your terms. <br /> The results follow the consistency.
               </p>
            </motion.div>

          </div>
        </motion.div>
      </div>

      <footer className="mt-20 border-t border-[#2c2525]/5 pt-20 pb-10 px-8 text-center max-w-4xl mx-auto space-y-8">
           <h2 className="text-4xl font-light text-[#2c2525] leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
             The plan does the work. <br /> <span className="italic text-[#5a6343]">You just have to show up.</span>
           </h2>
           <button 
              onClick={() => window.location.href = '/auth/signup'}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-[#2c2525] border-b border-[#5a6343] pb-2 hover:opacity-60 transition-opacity"
           >
             Unlock Your Plan
           </button>
      </footer>
    </main>
  );
}
