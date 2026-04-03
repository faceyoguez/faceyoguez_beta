'use client';

import { Header } from '@/components/marketing/Header';
import { FloatingDock } from '@/components/marketing/FloatingDock';
import { motion } from 'framer-motion';
import { Clock, Users, PlayCircle, Star, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

const programs = [
  {
    title: "The 21-Day Sanctuary",
    type: "Signature Program",
    description: "The complete foundation. Learn everything from basic muscle activation to advanced facial sculpting in just 3 weeks.",
    features: ["Daily 15-min routines", "Anatomy deep-dives", "Glow-up checklist"],
    duration: "21 Days",
    sessions: "Daily Videos",
    price: "$49",
    tagColor: "bg-[#FF8A75]"
  },
  {
    title: "1-on-1 Personalized Labs",
    type: "Elite Coaching",
    description: "A tailored experience with our top experts. Focus on your specific goals—whether it’s lifting, toning, or symmetry.",
    features: ["Private video sessions", "Custom routine plan", "Direct chat support"],
    duration: "Flexible",
    sessions: "4 Private Sessions",
    price: "$199",
    tagColor: "bg-slate-900"
  },
  {
    title: "The Stress-Relief Protocol",
    type: "Digital Mini-Course",
    description: "Target facial tension and stress-lines. Perfect for practitioners looking for a quick, effective morning release.",
    features: ["Relaxation techniques", "Sleep-well routine", "Tension release-kit"],
    duration: "7 Days",
    sessions: "10 Video Lessons",
    price: "$29",
    tagColor: "bg-[#FF8A75]"
  }
];

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-[#FFFAF7] text-slate-900 overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FF8A75]/5 blur-[120px] rounded-full translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] font-black uppercase tracking-widest">
              Science-Backed Routines
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Begin Your <span className="text-[#FF8A75]">True</span> <br /> Transformation.
            </h1>
            <p className="max-w-xl mx-auto text-lg text-slate-600 font-medium leading-relaxed">
              From our signature 21-day challenge to personalized one-on-one laboratories. Choose the path that matches your glow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          {programs.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group flex flex-col p-8 md:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-[#FF8A75]/10 hover:-translate-y-2 transition-all"
            >
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${program.tagColor}`}>
                    {program.type}
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight leading-tight group-hover:text-[#FF8A75] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {program.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-2 text-slate-400">
                     <Clock className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-widest">{program.duration}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-400">
                     <PlayCircle className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-widest">{program.sessions}</span>
                   </div>
                </div>

                <div className="h-px bg-slate-50" />

                <ul className="space-y-3">
                   {program.features.map(f => (
                     <li key={f} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <BadgeCheck className="w-4 h-4 text-[#FF8A75]" />
                        {f}
                     </li>
                   ))}
                </ul>
              </div>

              <div className="mt-12 flex items-center justify-between">
                 <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investment</span>
                    <div className="text-3xl font-black text-slate-900">{program.price}</div>
                 </div>
                 <Link 
                   href="/auth/signup"
                   className="px-8 py-4 rounded-full bg-slate-900 text-white font-bold tracking-wide transition-all group-hover:bg-[#FF8A75] active:scale-95 shadow-xl shadow-black/10"
                 >
                   Enrol Now
                 </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-20 px-6 border-y border-slate-100 bg-[#FF8A75]/[0.02]">
         <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-60">
            {['No Surgery', 'No Chemicals', 'Expert Guided', '99% Satisfaction'].map(label => (
              <div key={label} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                 <Star className="w-4 h-4 fill-slate-200 text-slate-200" />
                 {label}
              </div>
            ))}
         </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-40 px-6 text-center space-y-12">
         <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Need Help <span className="text-[#FF8A75]">Choosing?</span></h2>
            <p className="text-lg text-slate-500 font-medium">Chat with our experts and find the perfect routine for your specific skin type and goals.</p>
         </div>
         <div className="pt-6">
            <button className="px-14 py-6 rounded-full border-2 border-slate-900 text-slate-900 font-bold tracking-widest uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
               Speak with a Guide
            </button>
         </div>
      </footer>

      <FloatingDock />
    </main>
  );
}
