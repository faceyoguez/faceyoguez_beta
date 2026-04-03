'use client';

import { Header } from '@/components/marketing/Header';
import { FloatingDock } from '@/components/marketing/FloatingDock';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Sparkles, Users } from 'lucide-react';

const transformations = [
  {
    name: "Anya V.",
    story: "After 3 months of consistent face yoga, my jawline is sharper and my under-eye bags have visibly reduced. It's more than just exercise; it's self-love.",
    period: "12 Weeks",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Lila M.",
    story: "The 'Glow-Up' program completely changed my morning routine. My skin feels firmer, and I've noticed a significant reduction in forehead lines.",
    period: "8 Weeks",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Priya S.",
    story: "As a busy professional, the 10-minute daily routines are a lifesaver. I look refreshed and less stressed. Joining the community was the best decision.",
    period: "6 Weeks",
    image: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=800"
  }
];

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#FFFAF7] text-slate-900 overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#FF8A75]/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] font-black uppercase tracking-widest">
              Join 50,000+ Women
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              A Community of <span className="text-[#FF8A75]">Glow.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 font-medium leading-relaxed">
              Find support, share your progress, and celebrate your natural transformation with women from all over the world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
           {[
             { label: "Community Members", val: "50k+", icon: Users },
             { label: "Active Group Sessions", val: "200+", icon: Sparkles },
             { label: "Positive Feedback", val: "99%", icon: Heart },
             { label: "Monthly Stories", val: "1.2k", icon: MessageSquare }
           ].map((stat, i) => (
             <motion.div 
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               viewport={{ once: true }}
               className="p-8 rounded-[3rem] bg-white border border-[#FF8A75]/10 shadow-sm transition-transform hover:scale-105"
             >
               <stat.icon className="w-6 h-6 text-[#FF8A75] mb-4" />
               <div className="text-3xl font-bold text-slate-900">{stat.val}</div>
               <div className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]/70">{stat.label}</div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Testimonials Masonry */}
      <section className="py-20 px-6 bg-white/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
             <h2 className="text-4xl font-bold tracking-tight">Real Stories. <span className="text-[#FF8A75]">Real Results.</span></h2>
             <p className="text-slate-500 font-medium italic">Discover why women love the Faceyoguez journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {transformations.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 relative"
              >
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white/80 overflow-hidden relative shadow-lg">
                      <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                   </div>
                   <div className="space-y-0.5">
                      <div className="text-sm font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] font-bold text-[#FF8A75]/70 uppercase tracking-widest">{item.period} Journey</div>
                   </div>
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                  "{item.story}"
                </p>
                <div className="absolute top-8 right-8">
                  <Sparkles className="w-5 h-5 text-[#FF8A75]/20" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto rounded-[4rem] bg-[#FF8A75] p-12 md:p-20 text-center space-y-10 shadow-2xl shadow-[#FF8A75]/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,white/10_0%,transparent_70%)] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Start Your <span className="underline decoration-white/30 skew-y-1 block md:inline">First Class</span> Today.
            </h2>
            <p className="text-white/80 text-lg font-medium">
              The only community that lifts you up — literally.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
             <button className="px-12 py-5 rounded-full bg-slate-900 text-white font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-2xl">
               Join the Sanctuary
             </button>
             <button className="px-12 py-5 rounded-full bg-white/20 text-white font-bold tracking-wide transition-all hover:bg-white/30 backdrop-blur-md">
               View Community Forum
             </button>
          </div>
        </div>
      </section>

      <FloatingDock />
    </main>
  );
}
