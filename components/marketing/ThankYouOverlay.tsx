'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pixel } from '@/lib/pixel';

interface ThankYouOverlayProps {
    onClose: () => void;
    /** Optional — pass purchase context for richer Pixel events */
    planId?: string;
    amount?: number;
    paymentId?: string;
}

export default function ThankYouOverlay({ onClose, planId, amount, paymentId }: ThankYouOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // ── Load Newsreader + Manrope fonts ─────────────────────────────────
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // ── Meta Pixel: fire events when overlay appears ──────────────────
        pixel.viewContent({
            contentName: 'Thank You Page',
            contentIds: planId ? [planId] : [],
        });
        pixel.thankYouViewed({ planId, amount, paymentId });

        // ── Auto-dismiss after 5 s ───────────────────────────────────────────
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500); // let exit animation finish
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#fcf8f7]"
                >
                    {/* Background decorative blurs */}
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#e76f51]/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f4a261]/10 blur-[120px] rounded-full" />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-[0_20px_40px_rgba(163,61,35,0.06)]"
                    >
                        {/* ── Close Button ───────────────────────────────────── */}
                        <button
                            onClick={handleClose}
                            aria-label="Close"
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/40 hover:bg-white/80 transition-all text-[#a33d23] z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-10 md:p-14 text-center space-y-8">
                            {/* ── Icon ─────────────────────────────────────────── */}
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e76f51] to-[#f4a261] flex items-center justify-center text-white shadow-lg shadow-[#e76f51]/20">
                                        <Sparkles className="w-10 h-10" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full border border-[#e76f51]/20 animate-ping" />
                                </div>
                            </div>

                            {/* ── Headline + Body ───────────────────────────────── */}
                            <div className="space-y-4">
                                <h1
                                    className="text-4xl md:text-5xl text-[#1c1b1b] tracking-tight"
                                    style={{ fontFamily: "'Newsreader', serif" }}
                                >
                                    Thank You
                                </h1>
                                <p
                                    className="text-lg md:text-xl text-[#57423d] leading-relaxed max-w-sm mx-auto"
                                    style={{ fontFamily: "'Manrope', sans-serif" }}
                                >
                                    Your journey to a radiant glow begins here. Thank you for trusting us.
                                </p>
                            </div>

                            {/* ── Divider ───────────────────────────────────────── */}
                            <div className="pt-4">
                                <div className="h-1 w-24 bg-gradient-to-r from-[#e76f51] to-[#f4a261] mx-auto rounded-full opacity-30" />
                            </div>

                            <p
                                className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a33d23]/50"
                                style={{ fontFamily: "'Manrope', sans-serif" }}
                            >
                                Redirecting to details in 5s…
                            </p>
                        </div>

                        {/* ── Bottom gradient strip ────────────────────────────── */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#e76f51] via-[#f4a261] to-[#e76f51]" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
