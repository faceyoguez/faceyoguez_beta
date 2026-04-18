'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Calendar, Users, Clock, Video, Globe, Zap, Heart, Star } from 'lucide-react';
import { PlanNavigation } from '@/components/marketing/PlanNavigation';
import { LuxuryBackground } from '@/components/marketing/LuxuryBackground';

export default function LiveGroupPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <main className="min-h-screen bg-[#FFFAF7] selection:bg-[#446187]/10 selection:text-[#446187] pb-20">
      <LuxuryBackground />
      <PlanNavigation title="Live Ritual // 21 Days" />

      <div className="max-w-7xl mx-auto pt-24 px-6 md:px-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT COLUMN: Transformation & Batch Logic */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* HERO */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5 shadow-sm space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <Globe className="w-16 h-16 text-[#446187]/5" />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#446187]/10 text-[#446187] text-[10px] font-black uppercase tracking-[0.3em] rounded-full">✨ Face Yoga 21-Day Transformation 🌸</span>
                    <div className="h-px bg-[#2c2525]/5 flex-1" />
                 </div>
                 
                 <h1 className="text-4xl md:text-7xl font-light text-[#2c2525] leading-none" style={{ fontFamily: 'var(--font-cormorant)' }}>
                   The Glow-Up <br /> 
                   <span className="italic text-[#446187]">Your Skin Has Been Waiting For.</span>
                 </h1>

                 <div className="pt-4 space-y-4">
                    <p className="text-sm text-[#5d605c] font-medium leading-relaxed max-w-2xl">
                      You moisturise. You SPF. You drink (almost) enough water. And yet — the fine lines, the puffiness, the asymmetry — they show up anyway, uninvited.
                    </p>
                    <p className="text-sm text-[#5d605c] font-medium leading-relaxed max-w-2xl italic">
                      "What if the most powerful skincare tool you own… is your face itself?"
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[#2c2525]/5 relative z-10">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#446187]/60">📅 Starts</span>
                    <p className="text-xs font-bold text-[#2c2525]">6th April</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#446187]/60">⏰ Time</span>
                    <p className="text-xs font-bold text-[#2c2525]">7:30 PM Daily</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#446187]/60">📹 Access</span>
                    <p className="text-xs font-bold text-[#2c2525]">Live Zoom</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#446187]/60">👥 Format</span>
                    <p className="text-xs font-bold text-[#2c2525]">Small Group</p>
                 </div>
              </div>
            </motion.div>

            {/* BENTO: Transforms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <motion.div variants={itemVariants} className="bg-[#2c2525] text-white p-8 rounded-[2rem] space-y-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#446187]">🌿 What Transforms?</h3>
                  <div className="space-y-4">
                     {[
                       ["Facial Sculpting & Toning", "Redefine your jawline and cheekbones."],
                       ["Facial Asymmetry", "Bring your face into beautiful natural balance."],
                       ["Natural Facelift", "Gravity has been working against you. Work back."],
                       ["Wrinkles & Fine Lines", "Soften them, slow them, face the world."],
                       ["Facial Glow", "Boost circulation so your skin literally lights up."],
                       ["Better Complexion", "Uneven skin tone? Dullness? Address the root."]
                     ].map(([title, desc], i) => (
                       <div key={i} className="flex gap-4">
                          <Check className="w-4 h-4 text-[#446187] mt-0.5" strokeWidth={3} />
                          <div>
                             <h4 className="text-[11px] font-bold uppercase tracking-wider">{title}</h4>
                             <p className="text-[10px] text-white/40 font-medium leading-tight">{desc}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </motion.div>

               <div className="space-y-6">
                  <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-[#2c2525]/5 space-y-6">
                     <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#2c2525]/30">🙋‍♀️ Who Is This For?</h3>
                     <div className="space-y-3">
                        {[
                          "Real, natural results without invasive treatments",
                          "You’ve noticed your face changing and want control",
                          "Tired of products that promise and deliver nothing",
                          "You believe in consistency over quick fixes",
                          "Want to feel confident and radiant in your skin"
                        ].map((text, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-[#f8f8f8] rounded-xl text-[10px] font-bold text-[#2c2525]/60">
                             <Sparkles className="w-3.5 h-3.5 text-[#446187] flex-shrink-0" />
                             <span>{text}</span>
                          </div>
                        ))}
                     </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="bg-[#446187]/5 p-8 rounded-[2rem] border border-[#446187]/10 space-y-4 text-center">
                     <Heart className="w-6 h-6 text-[#446187] mx-auto" />
                     <p className="text-xs font-light italic text-[#2c2525] leading-relaxed">
                       "Transformation is better together. Your community pulls you back in when you don't feel like showing up."
                     </p>
                  </motion.div>
               </div>
            </div>

            {/* WHY & WALK AWAY SECTION */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-10 border border-[#2c2525]/5 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#2c2525]/30">💬 Why Live Group?</h3>
                  <div className="space-y-4 text-[11px] text-[#5d605c] leading-relaxed">
                     <p>Because transformation is better together. Stay accountable. Stay motivated. Get real-time guidance and ask questions in every session.</p>
                     <p className="font-bold text-[#2c2525]">This isn’t a pre-recorded course you buy and forget. This is a commitment to yourself.</p>
                  </div>
               </div>

               <div className="space-y-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#446187]">🌸 What You Walk Away With</h3>
                  <div className="space-y-3">
                    {[
                      "A more sculpted, defined facial structure",
                      "Reduced puffiness and improved symmetry",
                      "Fresher, plumper, radiant skin",
                      "A daily ritual that takes minutes",
                      "The quiet confidence of a genuine glow"
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-[#2c2525]/70">
                        <Check className="w-3 h-3 text-[#446187] mt-0.5" strokeWidth={3} />
                        {item}
                      </div>
                    ))}
                  </div>
               </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: PRICING (EARLY BIRD) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            {/* PRICING SELECTOR */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border-2 border-[#446187]/10 shadow-xl space-y-8 overflow-hidden relative">

               
               <div className="space-y-6 pt-4">
                  <div className="text-center">
                     <Star className="w-8 h-8 text-[#446187] mx-auto mb-2" strokeWidth={1.5} />
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#446187]">Early Bird Offer</span>
                     <h3 className="text-lg font-bold text-[#2c2525] mt-2">1 Month Plan</h3>
                  </div>

                  <div className="space-y-4">
                     {/* 1 Month Card */}
                     <div className="p-6 bg-[#fcf8f7] border border-[#2c2525]/5 rounded-2xl relative group hover:border-[#446187]/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#446187] mb-1 block">Early Bird Offer</span>
                              <h3 className="text-sm font-bold text-[#2c2525]">1 Month Ritual</h3>
                           </div>
                           <div className="text-right">
                              <span className="text-[8px] text-[#2c2525]/20 line-through font-bold block">₹4,400</span>
                              <span className="text-xl font-black text-[#2c2525]">₹1,499</span>
                           </div>
                        </div>
                        <p className="text-[9px] text-[#2c2525]/40 font-medium leading-relaxed">
                          Includes 21 Days Live Classes + 12-Day Recording Access.
                        </p>
                     </div>

                     {/* 3 Month Card */}
                     <div className="p-6 bg-[#446187]/5 border-2 border-[#446187]/20 rounded-2xl relative shadow-sm hover:shadow-md transition-all">
                        <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#446187] text-white text-[7px] font-black px-3 py-0.5 rounded-full tracking-widest uppercase">Best Value</div>
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#446187] mb-1 block">Sustained Results</span>
                              <h3 className="text-sm font-bold text-[#2c2525]">3 Months Ritual</h3>
                           </div>
                           <div className="text-right">
                              <span className="text-[8px] text-[#2c2525]/20 line-through font-bold block">₹12,999</span>
                              <span className="text-xl font-black text-[#446187]">₹3,499</span>
                           </div>
                        </div>
                        <p className="text-[9px] text-[#446187]/60 font-medium leading-relaxed">
                          Ideal for personal transformation. 3 batches + 12-day recordings per session.
                        </p>
                     </div>
                  </div>

                  <button 
                    onClick={() => window.location.href = '/auth/signup'}
                    className="w-full py-5 bg-[#2c2525] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#446187] transition-all duration-500 shadow-lg shadow-[#446187]/10"
                  >
                    Join Transformation
                  </button>
               </div>
            </motion.div>



          </div>
        </motion.div>
      </div>

      {/* COMPACT FOOTER */}
      <footer className="mt-20 border-t border-[#2c2525]/5 pt-20 pb-10 px-8 text-center max-w-4xl mx-auto space-y-8">
           <h2 className="text-4xl font-light text-[#2c2525] leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
             This isn't a course. <br /> <span className="italic text-[#446187]">It's a New Standard of Radiance.</span>
           </h2>
           <button 
              onClick={() => window.location.href = '/auth/signup'}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-[#2c2525] border-b border-[#446187] pb-2 hover:opacity-60 transition-opacity"
           >
             Check Slot Availability
           </button>
      </footer>
    </main>
  );
}
