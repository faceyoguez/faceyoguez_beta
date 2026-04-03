'use client';

import { Header } from '@/components/marketing/Header';
import { FloatingDock } from '@/components/marketing/FloatingDock';
import { motion } from 'framer-motion';
import { Star, Award, Heart } from 'lucide-react';
import Image from 'next/image';

const experts = [
  {
    name: "Dr. Elena Rossi",
    role: "Facial Anatomy Specialist",
    bio: "With over 15 years in dermatological research, Elena brings a scientific approach to face yoga, focusing on muscle engagement and skin elasticity.",
    rating: "4.9",
    skills: ["Muscle Rejuvenation", "Anti-Aging", "Lymphatic Drainage"],
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Maya Patel",
    role: "Holistic Wellness Guide",
    bio: "Maya combines traditional Ayurvedic principles with modern face yoga techniques to provide a truly transformative mindful experience.",
    rating: "5.0",
    skills: ["Zen Mindfulness", "Stress Relief", "Natural Glow"],
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Sarah Jenkins",
    role: "Aesthetic Yoga Lead",
    bio: "Sarah's energetic approach to face yoga focuses on immediate lifting and toning, making her classes a favorite for results-driven students.",
    rating: "4.8",
    skills: ["Toning", "Sculpting", "Aesthetic Symmetry"],
    image: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=800"
  }
];

export default function ExpertsPage() {
  return (
    <main className="min-h-screen bg-[#FFFAF7] text-slate-900 overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF8A75]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] font-black uppercase tracking-widest mb-6">
              Expert-Led Transformation
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Guided by the <span className="text-[#FF8A75]">Best</span> <br /> in the World.
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-slate-600 font-medium leading-relaxed"
          >
            Our instructors aren't just teachers; they are world-class specialists in facial anatomy, skincare, and holistic wellness.
          </motion.p>
        </div>
      </section>

      {/* Experts Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {experts.map((expert, i) => (
            <motion.div
              key={expert.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-white/70 backdrop-blur-xl rounded-[3rem] border border-white p-8 hover:shadow-2xl hover:shadow-[#FF8A75]/5 transition-all"
            >
              <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden mb-8 shadow-inner">
                <Image 
                  src={expert.image} 
                  alt={expert.name} 
                  fill 
                  className="object-cover transition-transform group-hover:scale-110 duration-700"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-[#FF8A75] text-[#FF8A75]" />
                  <span className="text-[10px] font-bold text-slate-900">{expert.rating}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900">{expert.name}</h3>
                  <p className="text-sm font-semibold text-[#FF8A75] uppercase tracking-wider">{expert.role}</p>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {expert.bio}
                </p>

                <div className="flex flex-wrap gap-2 pt-4">
                  {expert.skills.map(skill => (
                    <span key={skill} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto rounded-[4rem] bg-slate-900 p-12 md:p-20 text-center space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Learn from <span className="text-[#FF8A75]">True</span> Masters.
            </h2>
            <p className="text-slate-400 text-lg">
              Start your personalized journey today with our world-class team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
             <button className="px-10 py-4 rounded-full bg-[#FF8A75] text-white font-bold tracking-wide transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-[#FF8A75]/20">
               Book a 1-on-1 Session
             </button>
             <button className="px-10 py-4 rounded-full bg-white/10 text-white font-bold tracking-wide transition-all hover:bg-white/20">
               Explore Programs
             </button>
          </div>
        </div>
      </section>

      <FloatingDock />
    </main>
  );
}
