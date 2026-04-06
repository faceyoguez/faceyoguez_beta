'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ImageComparison = ({ beforeImage, afterImage, altBefore = 'Baseline', altAfter = 'Unfolding', disabled = false }: any) => {
    const [sliderPosition, setSliderPosition] = useState(disabled ? 0 : 50);
    const [isDragging, setIsDragging] = useState(false);

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
                <img
                    src={beforeImage}
                    alt={altBefore}
                    className="h-full w-full object-cover grayscale-[0.2] contrast-[1.05]"
                    draggable="false"
                />
                <div className="absolute left-6 top-6 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Baseline</span>
                </div>
            </div>

            {/* Evolution Image (Bottom Layer) */}
            <img
                src={afterImage}
                alt={altAfter}
                className="block h-full w-full object-cover contrast-[1.1]"
                draggable="false"
            />
            <div className="absolute right-6 top-6 z-30 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-primary/5 shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">Evolution</span>
            </div>

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
        </div>
    );
};
