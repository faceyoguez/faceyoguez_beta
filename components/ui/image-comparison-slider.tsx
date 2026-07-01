'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ImageComparison = ({ beforeImage, afterImage, altBefore = 'Baseline', altAfter = 'Unfolding', beforeLabel, afterLabel, disabled = false }: any) => {
    const [sliderPosition, setSliderPosition] = useState(disabled ? 0 : 50);
    const [isDragging, setIsDragging] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxUrl(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (disabled) {
            setSliderPosition(0);
        } else if (sliderPosition === 0) {
            setSliderPosition(50);
        }
    }, [disabled]);

    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || !containerRef.current || disabled) return;
        const rect = containerRef.current.getBoundingClientRect();
        let newPosition = ((clientX - rect.left) / rect.width) * 100;
        newPosition = Math.max(0, Math.min(100, newPosition));
        setSliderPosition(newPosition);
    }, [isDragging, disabled]);

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const handleTouchStart = () => { if (!disabled) setIsDragging(true) };
    const handleTouchEnd = () => setIsDragging(false);
    const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full select-none overflow-hidden group cursor-ew-resize"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* After Image (Top Layer) */}
            <div
                className="absolute top-0 left-0 h-full w-full overflow-hidden z-10"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <Image
                    src={beforeImage}
                    alt={altBefore}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-full w-full object-contain grayscale-[0.2] contrast-[1.05]"
                    draggable="false"
                />
                {beforeLabel && (
                  <div className="absolute left-6 top-6 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                      <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{beforeLabel}</span>
                  </div>
                )}
            </div>

            {/* Evolution Image (Bottom Layer) */}
            <div className="absolute inset-0">
                <Image
                    src={afterImage}
                    alt={altAfter}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="block h-full w-full object-contain contrast-[1.1]"
                    draggable="false"
                />
            </div>
            {afterLabel && (
              <div className="absolute right-6 top-6 z-30 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-primary/5 shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">{afterLabel}</span>
              </div>
            )}

            {/* Slider Handle */}
            {!disabled && (
                <div
                    className="absolute top-0 bottom-0 w-px bg-white/40 z-20 flex items-center justify-center transition-opacity duration-300 pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div
                        className={cn(
                            "h-14 w-1 flex flex-col items-center justify-between py-1 transition-all duration-500",
                            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                    >
                        <div className="w-1 h-3 bg-white rounded-full" />
                        <div className="w-1 h-3 bg-white rounded-full" />
                        <div className="w-1 h-3 bg-white rounded-full" />
                    </div>
                </div>
            )}

            {/* Interactive Handle Button */}
            {!disabled && (
                <div
                    className="absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-500 p-1 pointer-events-auto cursor-ew-resize"
                    style={{ left: `calc(${sliderPosition}% - 1.5rem)` }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <div
                        className={cn(
                            "h-12 w-12 rounded-[1.2rem] bg-foreground text-background flex items-center justify-center shadow-2xl border border-white/10 transition-transform duration-500",
                            isDragging ? "scale-125 rotate-45" : "scale-100 group-hover:scale-110"
                        )}
                    >
                        <div className={cn("flex gap-0.5 transition-transform duration-500", isDragging ? "-rotate-45" : "")}>
                            <ChevronLeft className="w-4 h-4 opacity-40 shrink-0" />
                            <ChevronRight className="w-4 h-4 shrink-0" />
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay Gradient for depth */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-20" />

            {/* Zoom Buttons Overlay */}
            <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <button
                type="button"
                onClick={() => {
                  setLightboxUrl(beforeImage);
                  setLightboxTitle(beforeLabel ? `Before: ${beforeLabel}` : 'Day 1');
                }}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-[9px] font-black uppercase tracking-wider hover:bg-slate-900 hover:scale-105 transition-all shadow-lg backdrop-blur-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Day 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxUrl(afterImage);
                  setLightboxTitle(afterLabel ? `Now: ${afterLabel}` : 'Unfolding');
                }}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 text-white text-[9px] font-black uppercase tracking-wider hover:bg-slate-900 hover:scale-105 transition-all shadow-lg backdrop-blur-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Now
              </button>
            </div>

            {/* Lightbox Modal Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                  {lightboxUrl && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                      <div className="absolute inset-0" onClick={() => setLightboxUrl(null)} />
                      
                      <div className="relative w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/60 shadow-2xl p-6 flex flex-col z-10 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                          <div className="text-left">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">Visual Progress Tracker</span>
                            <h4 className="text-sm font-bold text-slate-800 capitalize mt-0.5">{lightboxTitle}</h4>
                          </div>
                          <button
                            onClick={() => setLightboxUrl(null)}
                            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                            title="Close Full View"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative w-full aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100/80">
                          <img
                            src={lightboxUrl}
                            alt="Progress View"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
