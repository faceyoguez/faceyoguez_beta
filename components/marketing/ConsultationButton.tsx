'use client';

import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { pixel } from '@/lib/pixel';

export function ConsultationButton() {
  return (
    <motion.a
      href="https://form.jotform.com/261413254231041"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => pixel.consultationEnquiryClicked()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group flex items-center gap-3 bg-[#e76f51] border border-[#2c2525]/5 rounded-2xl px-5 py-3 shadow-2xl hover:bg-[#d66042] transition-all duration-500"
    >
      <div className="text-right hidden md:block">
        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/70 group-hover:text-white/90 leading-none">Consultation</p>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white group-hover:text-white leading-tight">
          Enquiry Form
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white transition-colors">
        <ClipboardList className="w-5 h-5" />
      </div>
    </motion.a>
  );
}
