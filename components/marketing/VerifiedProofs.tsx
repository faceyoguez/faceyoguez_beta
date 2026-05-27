'use client';

import { motion } from 'framer-motion';
import { ThumbnailsCarousel } from '@/components/ui/signature';

interface VerifiedProofsProps {
  hideCTA?: boolean;
}

export function VerifiedProofs({ hideCTA = false }: VerifiedProofsProps = {}) {
  return (
    <section className="py-6 md:py-10 bg-transparent overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12 space-y-6">
          <div className="inline-flex flex-col items-center gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="px-4 py-1.5 rounded-full bg-[#e76f51]/5 border border-[#e76f51]/10 backdrop-blur-sm"
            >
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#e76f51]">Success Stories</span>
            </motion.div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold text-[#2a2019] tracking-tight leading-[1.1]">
              Verified <span className="italic font-light opacity-50 serif">Transformations.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[#2a2019]/60 font-jakarta text-lg md:text-xl leading-relaxed">
              Real people. Real results. Our community's journey towards facial wellness, 
              captured in unedited, authentic proofs.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 pt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#e76f51]/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#e76f51]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#2a2019]">No Retouching</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#e76f51]/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#e76f51]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#2a2019]">100% Authentic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#e76f51]/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#e76f51]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#2a2019]">Member Submitted</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Decorative Rings */}
          <div className="absolute -top-20 -left-20 w-40 h-40 border border-[#e76f51]/10 rounded-full animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 border border-[#e76f51]/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          
          <ThumbnailsCarousel />
        </motion.div>

        {/* Free Class CTA Button */}
        {!hideCTA && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center mt-12 md:mt-16 relative z-20"
          >
            <a
              href="/auth/signup?redirectTo=/student/lms"
              className="group relative inline-flex items-center justify-center px-6 md:px-8 py-4 text-sm md:text-base font-bold text-white bg-[#2a2019] hover:bg-[#e76f51] rounded-full transition-all duration-500 overflow-hidden shadow-2xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                Try your first free face yoga class today
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
