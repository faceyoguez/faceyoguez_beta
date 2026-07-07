'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MessageCircle, Mail, X, Plus, ClipboardList } from 'lucide-react';
import { ConsultationButton } from './ConsultationButton';
import { pixel } from '@/lib/pixel';

export function FloatingEnquiry() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
      {/* Permanent Consultation Enquiry Button */}
      <ConsultationButton />

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
              onClick={() => pixel.whatsAppChatClicked()}
              className="group flex items-center gap-3 bg-white border border-[#2c2525]/5 rounded-2xl px-5 py-3 shadow-xl hover:bg-[#2c2525] transition-all duration-500"
            >
              <div className="text-right">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#2c2525]/30 group-hover:text-white/40">WhatsApp</p>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#2c2525] group-hover:text-white">Quick Chat</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:bg-white/10 group-hover:text-white transition-colors">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 16 16"
                >
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                </svg>
              </div>
            </a>

            {/* Email (Gmail Redirect) */}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=management@faceyoguez.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pixel.emailEnquiryClicked()}
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
        onClick={() => {
          if (!isOpen) pixel.contactButtonClicked();
          setIsOpen(!isOpen);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700 ${isOpen ? 'bg-white text-[#2c2525] rotate-90 border border-[#2c2525]/5' : 'bg-[#2c2525] text-white'
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
          className="absolute right-20 top-auto bottom-2 pointer-events-none"
        >
          <div className="bg-[#2c2525] text-white text-[9px] font-jakarta font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full whitespace-nowrap shadow-xl">
            Contact Us
          </div>
        </motion.div>
      )}
    </div>
  );
}
