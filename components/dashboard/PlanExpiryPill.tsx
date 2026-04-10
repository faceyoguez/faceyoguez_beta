'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowUpRight, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitExitFeedback } from '@/app/actions/feedback';

interface PlanExpiryPillProps {
  daysLeft: number;
  activePlanTypes?: string[];
}

export function PlanExpiryPill({ daysLeft, activePlanTypes = [] }: PlanExpiryPillProps) {
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackState, setFeedbackState] = useState({ rating: 5, comments: '', improvement_suggestions: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-trigger modal once per session
  React.useEffect(() => {
    if (daysLeft > 0 && daysLeft <= 5) {
      const hasSeenSession = sessionStorage.getItem('hasSeenRenewModal');
      if (!hasSeenSession) {
        setShowRenewModal(true);
        sessionStorage.setItem('hasSeenRenewModal', 'true');
      }
    }
  }, [daysLeft]);

  // Appearance condition: 1 to 5 days left (not for lifetime/unlimited)
  if (daysLeft < 0 || daysLeft > 5 || daysLeft === undefined) return null;

  return (
    <>
      {/* ── Liquid Glass Pill ── */}
      <motion.button
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowRenewModal(true)}
        className={cn(
          "fixed top-6 right-6 lg:top-8 lg:right-12 z-[100]",
          "flex items-center gap-3 px-5 py-2.5 rounded-full",
          "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(255,138,117,0.15)]",
          "hover:bg-white/20 hover:border-white/40 transition-all group"
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_#ef4444]"></span>
        </span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-800/80 group-hover:text-slate-900 transition-colors">Plan Ending</span>
          <span className="text-[8px] font-bold text-rose-500 mt-0.5">{daysLeft === 0 ? 'Today' : `${daysLeft} days left`}</span>
        </div>
        <div className="h-6 w-px bg-white/20 mx-1" />
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
      </motion.button>

      {/* ── Renewal Modal & Feedback (Shared Logic) ── */}
      <AnimatePresence>
        {(showRenewModal || showFeedbackForm) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 bg-slate-900/20 backdrop-blur-3xl"
          >
            <div className="absolute inset-0" onClick={() => { setShowRenewModal(false); setShowFeedbackForm(false); }} />
            
            {showRenewModal && !showFeedbackForm && (
              <motion.div
                initial={{ scale: 0.95, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 40 }}
                className="relative bg-[#FFFAF7] w-full sm:max-w-md rounded-t-[3rem] sm:rounded-[3rem] lg:rounded-[4rem] border border-[#FF8A75]/10 shadow-2xl p-8 lg:p-12 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
                <div className="text-center space-y-6 lg:space-y-8">
                  <div className="mx-auto w-16 h-16 lg:w-24 lg:h-24 rounded-[2rem] lg:rounded-[2.5rem] bg-white border border-[#FF8A75]/5 shadow-inner flex items-center justify-center text-[#FF8A75]">
                    <AlertTriangle className="w-8 h-8 lg:w-10 lg:h-10" />
                  </div>
                  <div className="space-y-2 lg:space-y-3">
                    <h3 className="text-2xl lg:text-3xl font-serif text-[#1a1a1a] tracking-tight">Renew Ritual</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      Your sanctuary journey is reaching its current horizon. Continue the evolution?
                    </p>
                  </div>

                  <div className="space-y-4 pt-2 lg:pt-4">
                    <Link 
                      href="/student/plans" 
                      onClick={() => setShowRenewModal(false)}
                      className="w-full h-14 lg:h-16 bg-[#1a1a1a] text-white rounded-full text-[11px] lg:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02]"
                    >
                      Extend Sanctuary
                      <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Link>
                    <button
                      onClick={() => { setShowRenewModal(false); setShowFeedbackForm(true); }}
                      className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-[#FF8A75] transition-all py-2"
                    >
                      I will continue later
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowRenewModal(false)}
                  className="absolute top-6 right-6 lg:top-10 lg:right-10 h-9 w-9 lg:h-10 lg:w-10 bg-white border border-[#FF8A75]/5 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 shadow-sm"
                >
                  <X className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </motion.div>
            )}

            {showFeedbackForm && (
              <motion.div
                initial={{ scale: 0.95, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 40 }}
                className="relative bg-[#FFFAF7] w-full sm:max-w-xl rounded-t-[3rem] sm:rounded-[3rem] lg:rounded-[4rem] border border-[#FF8A75]/10 shadow-2xl p-8 lg:p-12 overflow-hidden max-h-[90dvh] overflow-y-auto no-scrollbar"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FF8A75]" />
                <div className="space-y-6 lg:space-y-8">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-[1.5rem] lg:rounded-[2rem] bg-white border border-[#FF8A75]/5 shadow-sm flex items-center justify-center shrink-0">
                      <Heart className="w-6 h-6 lg:w-8 lg:h-8 text-[#FF8A75]" />
                    </div>
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-serif text-[#1a1a1a] tracking-tight">Sanctuary Reflection</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1 opacity-60">Share your journey</p>
                    </div>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">How was your experience?</label>
                      <textarea
                        value={feedbackState.comments}
                        onChange={(e) => setFeedbackState({ ...feedbackState, comments: e.target.value })}
                        placeholder="Your journey is eternal, but your time here is pausing. Share your reflections so our sanctuary can blossom..."
                        className="w-full h-28 lg:h-32 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-[#FF8A75]/10 bg-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20 text-sm italic font-serif placeholder:opacity-40 resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Suggestions for improvement?</label>
                       <input
                         type="text"
                         value={feedbackState.improvement_suggestions}
                         onChange={(e) => setFeedbackState({ ...feedbackState, improvement_suggestions: e.target.value })}
                         className="w-full h-13 px-5 lg:px-6 py-3.5 rounded-full border border-[#FF8A75]/10 bg-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/20 text-sm"
                         placeholder="What could make your sanctuary even brighter?"
                       />
                    </div>

                    <button
                      disabled={isSubmitting || !feedbackState.comments.trim()}
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          await submitExitFeedback({
                            plan_taken: activePlanTypes.join(', ') || 'General',
                            rating: feedbackState.rating,
                            comments: feedbackState.comments,
                            improvement_suggestions: feedbackState.improvement_suggestions
                          });
                          toast.success('Your reflection has been gracefully received.');
                          setShowFeedbackForm(false);
                        } catch (err) {
                          toast.error('The universe could not receive your reflection. Try again.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full h-14 lg:h-16 bg-[#1a1a1a] text-white rounded-full text-[11px] lg:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF8A75] transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Reflections...' : 'Submit Reflection'}
                      <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="absolute top-6 right-6 lg:top-10 lg:right-10 h-9 w-9 lg:h-10 lg:w-10 bg-white border border-[#FF8A75]/5 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 shadow-sm"
                >
                  <X className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
