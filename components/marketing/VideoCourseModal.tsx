'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, PlayCircle, BookOpen, Layers } from 'lucide-react';
import { useEffect } from 'react';

interface VideoCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoCourseModal({ isOpen, onClose }: VideoCourseModalProps) {
  // STRICT BODY LOCK
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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-12 overflow-hidden" style={{ pointerEvents: 'auto' }}>
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
          {/* Header */}
          <div className="flex-shrink-0 bg-[#f2ede4] border-b border-[#2a2019]/5 px-8 py-7 relative text-center">
             <span className="inline-block px-3 py-1 bg-[#e76f51] text-white text-[9px] font-bold tracking-[0.2em] uppercase rounded-full mb-3">
               ✨ Recorded Face Yoga Plan — Lifetime Access
             </span>
             <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl md:text-2xl font-bold text-[#2a2019] leading-tight">
               Your Transformation. Your Pace. Your Time.
             </h2>
             <button onClick={onClose} className="absolute top-7 right-7 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-[#2a2019] hover:bg-white shadow-sm transition-all z-20">
               <X className="w-5 h-5" />
             </button>
          </div>

          {/* Content with Lenis Prevent */}
          <div 
             className="flex-1 overflow-y-auto p-6 md:p-10 CustomScroll" 
             style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
             data-lenis-prevent
          >
            <section className="mb-10">
               <h3 className="text-sm font-bold text-[#2a2019] mb-4">🌿 The Plan That Fits Around Your Life</h3>
               <div className="space-y-4 text-[#2a2019]/70 text-[11px] md:text-xs leading-relaxed">
                  <p>Not everyone can show up at a fixed time every day. Life is busy, schedules are unpredictable. But your skin doesn’t take a day off — and neither should your practice.</p>
                  <div className="p-5 bg-white border-l-4 border-[#e76f51] rounded-r-2xl italic shadow-sm text-[#2a2019]">
                    This is for the person who wants real face yoga without being tied to a timetable. Ready when you are, for as long as you need it.
                  </div>
                  <p className="font-semibold text-[#8B6914] text-[10px] uppercase tracking-widest">No live sessions. No pressure. No expiry date.</p>
               </div>
            </section>

            <section className="mb-10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2a2019]/40 mb-5">📌 What We Work On</h3>
               <div className="grid grid-cols-2 gap-2 text-[10px] text-[#2a2019]/70">
                  {["Sagging & Firmness", "Puffiness", "Double Chin", "Fine Lines", "Dullness", "Asymmetry", "Eye Bags", "Muscle Tension"].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#2a2019]/5">
                       <span className="text-[#e76f51]">♦</span> {t}
                    </div>
                  ))}
               </div>
            </section>

            <section className="mb-10 text-center">
               <h3 className="text-sm font-bold text-[#20192a] mb-8">🎯 Two Levels. One Complete Transformation.</h3>
               <div className="grid grid-cols-1 gap-6">
                  <div className="bg-[#8B6914]/5 p-6 rounded-[2rem] border border-[#8B6914]/10 text-left">
                     <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 bg-[#8B6914] text-white text-[8px] font-black uppercase rounded-full">Level 1</div>
                        <span className="text-[10px] text-[#8B6914] font-black">16 SESSIONS</span>
                     </div>
                     <h4 className="font-bold text-[#2a2019] text-sm mb-3">Foundation & Basics</h4>
                     <ul className="space-y-2 text-[10px] text-[#2a2019]/60 font-medium">
                        <li className="flex gap-2"><Check className="w-3 h-3 text-[#8B6914]" /> Basic Facial Exercises & Introduction</li>
                        <li className="flex gap-2"><Check className="w-3 h-3 text-[#8B6914]" /> Posture Awareness & Entry Techniques</li>
                        <li className="flex gap-2"><Check className="w-3 h-3 text-[#8B6914]" /> Lymphatic Drainage Basics</li>
                     </ul>
                  </div>

                  <div className="bg-[#e76f51]/5 p-6 rounded-[2rem] border border-[#e76f51]/10 text-left">
                     <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 bg-[#e76f51] text-white text-[8px] font-black uppercase rounded-full">Level 2</div>
                        <span className="text-[10px] text-[#e76f51] font-black">16 SESSIONS</span>
                     </div>
                     <h4 className="font-bold text-[#2a2019] text-sm mb-3">Advanced Techniques</h4>
                     <ul className="space-y-2 text-[10px] text-[#2a2019]/60 font-medium">
                        <li className="flex gap-2"><Check className="w-3 h-3 text-[#e76f51]" /> Focused Facial Sculpting</li>
                        <li className="flex gap-2"><Check className="w-3 h-3 text-[#e76f51]" /> Enhanced Symmetry & Deep Drainage</li>
                        <li className="flex gap-2"><Check className="w-3 h-3 text-[#e76f51]" /> In-depth Skincare Integration</li>
                     </ul>
                  </div>
               </div>
            </section>

            <section className="mb-10">
               <h3 className="text-sm font-bold text-[#2a2019] mb-6">🗺️ Your Journey — Step by Step</h3>
               <div className="space-y-5">
                  {[
                    "Enrol & Get Instant Confirmation", "Access Your Plan on Your Dashboard",
                    "Upload Photo for Progress Tracker", "Unlock Sessions as You Go", "Enjoy at Your Own Pace"
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4 items-center">
                       <div className="w-7 h-7 bg-[#2a2019] text-white rounded-full flex items-center justify-center text-[10px] font-black">{i+1}</div>
                       <p className="text-[11px] font-bold text-[#2a2019]">{text}</p>
                    </div>
                  ))}
               </div>
               <div className="mt-8 p-4 bg-[#2a2019] text-[#e76f51] rounded-2xl text-[10px] font-bold text-center">
                 📝 Lifetime access means exactly that — your plan never expires.
               </div>
            </section>

            <section className="mb-10">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2a2019]/40 mb-6 text-center">💸 Pricing — One-Time Payment</h3>
               <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-[#2a2019]/5 flex justify-between items-center group">
                     <div>
                        <span className="text-[9px] font-black text-[#8B6914] uppercase">🌟 Level 1 Only</span>
                        <h4 className="text-xs font-bold text-[#2a2019] mt-0.5">16 Sessions Foundation</h4>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] line-through opacity-20">₹1,999</div>
                        <div className="text-lg font-black text-[#2a2019]">₹999</div>
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border-2 border-[#e76f51]/20 flex justify-between items-center relative shadow-xl">
                     <div className="absolute top-0 right-6 px-3 py-1 bg-[#e76f51] text-white text-[8px] font-black uppercase transform -translate-y-1/2 rounded-full shadow-lg">Complete Package</div>
                     <div>
                        <span className="text-[9px] font-black text-[#e76f51] uppercase">🌟 Level 1 + Level 2</span>
                        <h4 className="text-xs font-bold text-[#2a2019] mt-0.5">32 Sessions Transformation</h4>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] line-through opacity-20">₹3,999</div>
                        <div className="text-lg font-black text-[#e76f51]">₹1,499</div>
                     </div>
                  </div>
               </div>
            </section>
          </div>

          <div className="flex-shrink-0 p-6 bg-[#faf7f2] border-t border-[#2a2019]/5">
             <button onClick={() => { onClose(); window.location.href='/auth/signup'; }} className="w-full bg-[#2a2019] text-white py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#2a2019]/90 transition-all shadow-xl">
               Get Lifetime Access <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </motion.div>

        <style jsx>{`
          .CustomScroll::-webkit-scrollbar { width: 4px; }
          .CustomScroll::-webkit-scrollbar-thumb { background: rgba(42, 32, 25, 0.15); border-radius: 20px; }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
