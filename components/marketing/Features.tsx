'use client';

import { Users, Zap, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Face Toning & Lifting',
    description: 'Tone your face naturally with expert-guided exercises for a lifted, sculpted look.',
    icon: Sparkles,
  },
  {
    title: 'Track Your Progress',
    description: 'See your results with daily photo logs, before-after comparisons & milestone tracking.',
    icon: Zap,
  },
  {
    title: 'Live Classes with Experts',
    description: 'Join live 1-on-1 or group face yoga classes with certified instructors.',
    icon: Users,
  },
];

export function Features() {
  return (
    <section id="discover" className="py-32 px-4 max-w-7xl mx-auto bg-[#FFFAF7]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
        {features.map((feature, idx) => (
          <div 
            key={feature.title} 
            className="group p-10 rounded-[2.5rem] bg-white border border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 hover:shadow-2xl hover:shadow-[#FF8A75]/10 hover:-translate-y-2 transition-all duration-500"
          >
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8A75]/10 text-[#FF8A75] group-hover:bg-[#FF8A75] group-hover:text-white transition-colors duration-500">
              <feature.icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-serif font-bold tracking-tight text-slate-900 mb-4">
              {feature.title}
            </h3>
            <p className="text-base text-slate-600 font-light leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
