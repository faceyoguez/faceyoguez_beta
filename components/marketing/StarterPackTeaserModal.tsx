'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Backpack, X, ArrowRight } from 'lucide-react';

interface StarterPackTeaserModalProps {
  onClose: () => void;
  onGoToStarterPack: () => void;
}

/**
 * Small popup shown right after ThankYouOverlay closes — points the new
 * subscriber at the Starter Pack section on their dashboard.
 */
export default function StarterPackTeaserModal({ onClose, onGoToStarterPack }: StarterPackTeaserModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-gradient-to-br from-[#1a1a1a] to-[#2a2320] rounded-[1.75rem] shadow-2xl overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#e76f51]/20 blur-3xl" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8 pt-10 space-y-5 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-[#e76f51] flex items-center justify-center shadow-lg shadow-[#e76f51]/30">
              <Backpack className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-aktiv font-bold text-white tracking-tight">Before you dive in…</h2>
              <p className="text-sm text-white/50 font-medium leading-relaxed">
                We've packed a Starter Pack for you — your welcome guide, setup tips, and practice essentials, all in one place on your dashboard.
              </p>
            </div>

            <button
              onClick={onGoToStarterPack}
              className="w-full h-12 bg-[#e76f51] hover:bg-white hover:text-[#1a1a1a] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#e76f51]/20"
            >
              Take Me There <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
