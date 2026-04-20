'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MessageCircle, Mail, X, Plus } from 'lucide-react';

export function FloatingEnquiry() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
      {/* Contact Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3"
          >
            {/* WhatsApp */}
            <a
              href="https://wa.me/917837310255"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-white border border-[#2c2525]/5 rounded-2xl px-5 py-3 shadow-xl hover:bg-[#2c2525] transition-all duration-500"
            >
              <div className="text-right">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#2c2525]/30 group-hover:text-white/40">WhatsApp</p>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#2c2525] group-hover:text-white">Quick Chat</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:bg-white/10 group-hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
            </a>

            {/* Email (Gmail Redirect) */}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=simrat@faceyoguez.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-white border border-[#2c2525]/5 rounded-2xl px-5 py-3 shadow-xl hover:bg-[#2c2525] transition-all duration-500"
            >
              <div className="text-right">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#2c2525]/30 group-hover:text-white/40">Email</p>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#2c2525] group-hover:text-white">Send Inquiry</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#bc162d]/10 flex items-center justify-center text-[#bc162d] group-hover:bg-white/10 group-hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700 ${
          isOpen ? 'bg-white text-[#2c2525] rotate-90 border border-[#2c2525]/5' : 'bg-[#2c2525] text-white'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="flex items-center justify-center"
            >
              <User className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Label (Only when closed) */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-20 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="bg-[#2c2525] text-white text-[9px] font-jakarta font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full whitespace-nowrap shadow-xl">
            Enquiry
          </div>
        </motion.div>
      )}
    </div>
  );
}
