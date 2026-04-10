'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

interface PersonalPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonalPlanModal({ isOpen, onClose }: PersonalPlanModalProps) {
  // --- ROBUST SCROLL LOCK ---
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;
      
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.documentElement.style.overflow = originalOverflow;
        document.body.style.overflow = originalBodyOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 lg:p-12 overflow-hidden"
        style={{ pointerEvents: 'auto' }}
      >
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-[#2a2019]/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative w-full max-w-[620px] bg-[#faf7f2] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Persistent Header */}
          <div className="flex-shrink-0 bg-[#f2ede4] border-b border-[#2a2019]/5 px-8 py-6 relative">
             <div className="text-center">
                <span className="inline-block px-3 py-1 bg-[#e76f51] text-white text-[9px] font-bold tracking-[0.2em] uppercase rounded-full mb-2">
                   ✨ 1-1 Consultation & Personalised Plan
                </span>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl md:text-2xl font-bold text-[#2a2019] leading-tight">
                   Because Your Face Deserves a Plan Made Only for You
                </h2>
             </div>
             <button 
                onClick={onClose}
                className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-[#2a2019] hover:bg-white shadow-sm transition-all z-20"
             >
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* SCROLLABLE CONTENT WITH LENIS PREVENT */}
          <div 
             className="flex-1 overflow-y-auto p-6 md:p-10 CustomScroll" 
             style={{ WebkitOverflowScrolling: 'touch' }}
             data-lenis-prevent
          >
             {/* 1. Pain Points */}
             <section className="mb-10">
               <h3 className="text-sm font-bold text-[#2a2019] mb-4 flex items-center gap-2">
                 <span>😔</span> Does Any of This Sound Familiar?
               </h3>
               <div className="space-y-4 text-[#2a2019]/70 text-[11px] md:text-xs leading-relaxed">
                  <p>You’ve tried group programmes, generic routines, and that one viral face massage... but you were left thinking “why isn’t this working for me?”</p>
                  <div className="p-4 bg-white border-l-4 border-[#e76f51] rounded-r-xl italic text-[12px] text-[#2a2019] leading-relaxed shadow-sm">
                    Here’s the truth: your face is not the same as everyone else’s. Your bone structure and muscle tension are uniquely yours.
                  </div>
                  <p className="font-semibold text-[#2a2019]">So why would a plan designed for everyone work for you? It won’t.</p>
               </div>
             </section>

             {/* 2. Value Prop */}
             <section className="mb-10 p-6 bg-[#8B6914]/5 rounded-[2rem] border border-[#8B6914]/10">
               <h3 className="text-xs font-bold text-[#8B6914] mb-3 uppercase tracking-widest">🌿 What This Plan Gives You</h3>
               <p className="text-[#2a2019]/70 text-[11px] md:text-xs leading-relaxed mb-4">
                 Every exercise is chosen specifically for your face — your concerns, your structure, your goals. The plan adjusts itself to fit you.
               </p>
               <p className="text-[11px] font-bold text-[#2a2019] italic">With a personal consultation and direct chat, you are never doing this alone.</p>
             </section>

             {/* 3. Targeted Work */}
             <section className="mb-10">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2a2019]/40 mb-5">📌 What We Work On</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    "Sagging & Loss of Firmness", "Puffiness & Facial Bloating", "Double Chin", 
                    "Fine Lines & Wrinkles", "Facial Asymmetry", "Dark Circles & Eye Bags", 
                    "Drooping Eyelids & Cheeks", "Muscle Tension & Stiffness", "Loss of Jawline Definition"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] md:text-[11px] text-[#2a2019]/80 py-1.5 border-b border-[#2a2019]/5">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#e76f51]" /> {item}
                    </div>
                  ))}
               </div>
             </section>

             {/* 4. Steps */}
             <section className="mb-10">
               <h3 className="text-sm font-bold text-[#2a2019] mb-6">🗺️ Your Journey — Step by Step</h3>
               <div className="space-y-6">
                  {[
                    { t: "01. Enrol & Access", d: "Get immediate access to your personal Dashboard." },
                    { t: "02. Share Your Photo", d: "Upload your photo for evaluation — your Day 1 baseline." },
                    { t: "03. 1-1 Consultation Call", d: "A private video call with Harsimrat at your convenience." },
                    { t: "04. Your Customised Plan", d: "Personalised video demos uploaded directly to your dashboard." },
                    { t: "05. Follow & Stay Connected", d: "Work daily with our chat support always a message away." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="text-[#e76f51] font-black text-xs pt-0.5">{i+1}.</div>
                       <div>
                         <h4 className="font-bold text-[#2a2019] text-[11px]">{item.t}</h4>
                         <p className="text-[10px] text-[#2a2019]/60">{item.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
             </section>

             <section className="mb-10 p-6 bg-[#2a2019] text-white rounded-[2rem]">
               <h4 className="text-[10px] font-bold text-[#e76f51] uppercase tracking-widest mb-6">📱 Your Dashboard Features</h4>
               <div className="grid grid-cols-1 gap-5">
                  {[
                    { i: "📸", t: "Journey Path", d: "Track transformation at Day 1, 7, 14, 21, 30." },
                    { i: "💬", t: "Personal Chat", d: "Direct message line for questions and guidance." },
                    { i: "📅", t: "One-Click Booking", d: "Schedule re-consultations easily." },
                    { i: "🗂️", t: "Your Resource Vault", d: "All personalised routines & guide manuals." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                       <span className="text-sm">{item.i}</span>
                       <div>
                          <h5 className="text-[11px] font-bold text-white mb-0.5">{item.t}</h5>
                          <p className="text-[10px] text-white/40 leading-tight">{item.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
             </section>

             <section className="mb-10 text-center py-6 border-y border-[#2a2019]/5">
               <span className="text-[10px] font-black text-[#2a2019]/30 uppercase tracking-widest">⏳ Results Timeline</span>
               <div className="flex justify-between mt-4 max-w-sm mx-auto">
                  <div><div className="text-sm font-bold">15 Days</div><p className="text-[9px] opacity-40">Early changes</p></div>
                  <div><div className="text-sm font-bold text-[#e76f51]">30 Days</div><p className="text-[9px] opacity-50">Visible results</p></div>
                  <div><div className="text-sm font-bold">3-6 Mo</div><p className="text-[9px] opacity-40">Transformation</p></div>
               </div>
             </section>

             <section className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="bg-white p-5 rounded-2xl border border-[#2a2019]/5 text-center">
                      <span className="text-[9px] font-bold text-[#2a2019]/40 block mb-1">Monthly</span>
                      <div className="text-lg font-bold text-[#20192a]">₹5,499</div>
                   </div>
                   <div className="bg-[#8B6914]/5 p-5 rounded-2xl border-2 border-[#8B6914]/20 text-center relative">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#8B6914] text-white text-[7px] font-black uppercase px-3 py-0.5 rounded-full whitespace-nowrap">Recommended</div>
                      <span className="text-[9px] font-bold text-[#2a2019]/40 block mb-1">3 Months</span>
                      <div className="text-lg font-bold text-[#e76f51]">₹11,000</div>
                   </div>
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-center p-4 bg-[#2a2019]/5 rounded-xl text-[10px] font-bold px-6">
                      <span>6 Months Radiant (60% OFF)</span>
                      <span>₹18,000</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-[#2a2019] text-white rounded-xl text-[10px] font-bold px-6">
                      <span>12 Months Eternal (70% OFF)</span>
                      <span className="text-[#e76f51]">₹30,000</span>
                   </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded-xl border border-[#2a2019]/5">
                   <h4 className="text-[9px] font-black uppercase text-[#8B6914] mb-3">🎁 Membership Perks</h4>
                   <ul className="space-y-2 text-[9px] text-[#2a2019]/60 font-medium">
                      <li className="flex gap-2"><Check className="w-3 h-3 text-[#e76f51]" /> 15 bonus days / 1 extra month</li>
                      <li className="flex gap-2"><Check className="w-3 h-3 text-[#e76f51]" /> Free lifetime recordings</li>
                      <li className="flex gap-2"><Check className="w-3 h-3 text-[#e76f51]" /> Complete Face Yoga Guide Manual</li>
                   </ul>
                </div>
             </section>
          </div>

          <div className="flex-shrink-0 p-6 bg-[#faf7f2] border-t border-[#2a2019]/5">
             <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/auth/signup';
                }}
                className="w-full bg-[#2a2019] text-white py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#2a2019]/90 transition-all shadow-xl"
             >
                Start Your Glow Journey <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </motion.div>

        <style jsx>{`
          .CustomScroll::-webkit-scrollbar { width: 5px; }
          .CustomScroll::-webkit-scrollbar-thumb { background: rgba(42, 32, 25, 0.15); border-radius: 20px; }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
