'use client';

import { Users, Zap, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Structural Metamorphosis',
    description: 'Rebuild facial symmetry and tone through targeted, expert-guided resistance training and natural lifting techniques.',
    icon: Sparkles,
  },
  {
    title: 'Daily Journey Tracking',
    description: 'Document your transformation with integrated daily logs, visual progression tools, and milestone markers.',
    icon: Zap,
  },
  {
    title: 'Live Guided Sessions',
    description: 'Connect directly with master instructors for personalized one-on-one rituals and interactive group classes.',
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
