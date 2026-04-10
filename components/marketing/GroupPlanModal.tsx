'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Calendar, Video, Clock, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

interface GroupPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroupPlanModal({ isOpen, onClose }: GroupPlanModalProps) {
  // STRICT BODY LOCK
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
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
          <div className="flex-shrink-0 bg-[#f2ede4] border-b border-[#2a2019]/5 px-8 py-7 relative">
             <div className="text-center">
                <span className="inline-block px-3 py-1 bg-[#e76f51] text-white text-[9px] font-bold tracking-[0.2em] uppercase rounded-full mb-3">
                  ✨ Face Yoga 21-Day Transformation 🌸
                </span>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl md:text-2xl font-bold text-[#2a2019] leading-tight">
                  The Glow-Up Your Skin Has Been Waiting For
                </h2>
             </div>
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
            <section className="mb-10 text-[#2a2019]/70 text-[11px] md:text-xs leading-relaxed space-y-4">
               <p>You moisturise. You SPF. You drink (almost) enough water. And yet — the fine lines, the puffiness, the asymmetry — they show up anyway, uninvited.</p>
               <p className="font-semibold text-[#2a2019]">What if the most powerful skincare tool you own… is your face itself?</p>
               <p>Welcome to Face Yoga — where ancient muscle movement meets modern glow science. No needles. No filters. No expensive serums. Just you, your face, and 21 days to a version of yourself that turns heads.</p>
            </section>

            <section className="mb-10 p-6 bg-[#e76f51]/5 rounded-[2rem] border border-[#e76f51]/10">
               <h3 className="text-xs font-bold text-[#e76f51] mb-5 uppercase tracking-widest">🌿 What Transforms in 21 Days?</h3>
               <div className="space-y-4">
                  {[
                    ["Facial Sculpting", "Redefine your jawline and cheekbones."],
                    ["Asymmetry Correction", "Bring your face into beautiful natural balance."],
                    ["Natural Facelift", "Work back against gravity."],
                    ["Wrinkle Softening", "Soften fine lines and face the world with confidence."],
                    ["Inner Glow", "Boost circulation so your skin lights up from within."]
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex gap-3">
                       <Check className="w-3.5 h-3.5 text-[#e76f51] mt-0.5 flex-shrink-0" />
                       <div>
                          <h4 className="text-[11px] font-bold text-[#2a2019]">{title}</h4>
                          <p className="text-[10px] text-[#2a2019]/60">{desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section className="mb-10">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2a2019]/40 mb-5 text-center">🙋‍♀️ Who Is This For?</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Natural results seekers", "Control over aging", "Tired of inactive products", 
                    "Consistency lovers", "Seeking radiant skin"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-[#2a2019]/5 rounded-xl text-[10px] font-medium">
                       <Sparkles className="w-3 h-3 text-[#e76f51]" /> {text}
                    </div>
                  ))}
               </div>
            </section>

            <section className="mb-10 p-6 bg-[#2a2019] text-white rounded-[2rem]">
               <h3 className="text-xs font-bold text-[#e76f51] mb-6 flex items-center gap-2">📋 How It Works</h3>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div>
                        <div className="text-[9px] uppercase opacity-40 mb-1">Starts</div>
                        <div className="text-xs font-bold">6th April</div>
                     </div>
                     <div>
                        <div className="text-[9px] uppercase opacity-40 mb-1">Time</div>
                        <div className="text-xs font-bold">7:30 PM Daily</div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <div className="text-[9px] uppercase opacity-40 mb-1">Access</div>
                        <div className="text-xs font-bold">Intimate Small Group</div>
                     </div>
                     <div>
                        <div className="text-[9px] uppercase opacity-40 mb-1">Recordings</div>
                        <div className="text-xs font-bold">12-Day Access Included</div>
                     </div>
                  </div>
               </div>
            </section>

            <section className="mb-10">
               <div className="bg-[#e76f51] text-white py-3 px-6 rounded-2xl text-center mb-10 shadow-lg">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]">⚠️ Only 8 Slots Remaining Early Bird Offer</p>
               </div>

               <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-black text-[#2a2019] mb-4 text-center text-opacity-40 uppercase tracking-widest">🌟 1 Month Plan</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-[#2a2019]/5 text-center">
                           <div className="text-[9px] font-bold text-[#2a2019]/40 mb-2 whitespace-nowrap">12-Day Access</div>
                           <div className="text-[10px] line-through opacity-20">₹4,400</div>
                           <div className="text-lg font-black text-[#2a2019]">₹1,499</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border-2 border-[#e76f51]/20 text-center relative shadow-xl">
                           <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#e76f51] text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap">Best Value</div>
                           <div className="text-[9px] font-bold text-[#2a2019]/40 mb-2 whitespace-nowrap">Lifetime Access</div>
                           <div className="text-[10px] line-through opacity-20">₹4,400</div>
                           <div className="text-lg font-black text-[#e76f51]">₹1,998</div>
                        </div>
                    </div>
                  </div>
               </div>
            </section>
          </div>

          <div className="flex-shrink-0 p-6 bg-[#faf7f2] border-t border-[#2a2019]/5">
             <button onClick={() => { onClose(); window.location.href='/auth/signup'; }} className="w-full bg-[#2a2019] text-white py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#2a2019]/90 transition-all shadow-xl">
               Join Transformation <ArrowRight className="w-4 h-4" />
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
