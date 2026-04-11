'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, CreditCard, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanExpiryPillProps {
    subscriptionStartDate: string;
    totalDays?: number; // default 30
    planName?: string;
}

export function PlanExpiryPill({ subscriptionStartDate, totalDays = 30, planName = 'Standard Plan' }: PlanExpiryPillProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);

    useEffect(() => {
        if (!subscriptionStartDate) return;

        const start = new Date(subscriptionStartDate);
        const now = new Date();
        const diffTime = now.getTime() - start.getTime();
        const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const remaining = totalDays - currentDay;
        setDaysRemaining(remaining);

        // Show starting from t-5
        if (remaining <= 5 && remaining >= 0) {
            setIsVisible(true);
        }
    }, [subscriptionStartDate, totalDays]);

    if (!isVisible) return null;

    return (
        <>
            <motion.button
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="fixed top-20 lg:top-8 right-4 lg:right-8 z-[100] flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl group transition-all duration-500 hover:bg-white/20"
            >
                <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-40" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Plan Ending Soon</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#FFFAF7] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white"
                        >
                            <div className="p-8 sm:p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg">
                                        <Sparkles className="w-7 h-7" />
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-3xl font-serif text-foreground leading-tight">Elevate Your Journey</h3>
                                    <p className="text-sm text-foreground/60 leading-relaxed font-medium">Your <strong>{planName}</strong> is concluding in its final {daysRemaining} days. Renew now to secure your progress and continued guidance.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white border border-[#FF8A75]/10 shadow-sm flex flex-col gap-1.5">
                                        <Clock className="w-4 h-4 text-[#FF8A75]" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Remaining</p>
                                        <p className="text-lg font-bold text-foreground">{daysRemaining} Days</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#FF8A75]/10 shadow-sm flex flex-col gap-1.5">
                                        <CreditCard className="w-4 h-4 text-[#FF8A75]" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Renewal</p>
                                        <p className="text-lg font-bold text-foreground">Pending</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => window.open('/student/plans', '_self')}
                                    className="w-full h-16 rounded-2xl bg-foreground text-background text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                                >
                                    Renew Subscription
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                
                                <p className="text-center text-[9px] font-bold uppercase tracking-widest text-foreground/20 italic">Keep the glow going without interruption</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
