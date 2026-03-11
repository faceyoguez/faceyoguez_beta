'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';

// This component takes two image URLs (before and after) and creates a slider to compare them.
export const ImageComparison = ({ beforeImage, afterImage, altBefore = 'Before', altAfter = 'After', disabled = false }: any) => {
    // State to track the slider's position (from 0 to 100)
    const [sliderPosition, setSliderPosition] = useState(disabled ? 0 : 50);
    // State to track if the user is currently dragging the slider
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (disabled) {
            setSliderPosition(0);
        } else if (sliderPosition === 0) {
            setSliderPosition(50);
        }
    }, [disabled]);

    // Ref to the main container element to get its dimensions
    const containerRef = useRef<HTMLDivElement>(null);

    // Function to handle the slider movement (for both mouse and touch)
    const handleMove = useCallback((clientX: number) => {
        // If not dragging or no container ref, do nothing
        if (!isDragging || !containerRef.current || disabled) return;

        // Get the bounding box of the container
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate the new slider position as a percentage
        let newPosition = ((clientX - rect.left) / rect.width) * 100;

        // Clamp the position to be between 0 and 100 to prevent it from going out of bounds
        newPosition = Math.max(0, Math.min(100, newPosition));

        setSliderPosition(newPosition);
    }, [isDragging]);

    // Mouse event handlers
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);

    // Touch event handlers
    const handleTouchStart = () => { if (!disabled) setIsDragging(true) };
    const handleTouchEnd = () => setIsDragging(false);
    const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

    // Effect to add and clean up global event listeners for mouse up/leave
    // This ensures dragging stops even if the cursor leaves the component area
    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video mx-auto select-none rounded-2xl overflow-hidden shadow-sm ring-1 ring-white/60 bg-gray-100"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the container
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* After Image (Top Layer) - Its visibility is controlled by the clip-path */}
            <div
                className="absolute top-0 left-0 h-full w-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={afterImage}
                    alt={altAfter}
                    className="h-full w-full object-cover object-center"
                    draggable="false"
                />
                <div className="absolute left-3 top-3 z-30 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                    DAY 1
                </div>
            </div>

            {/* Before Image (Bottom Layer) */}
            <img
                src={beforeImage}
                alt={altBefore}
                className="block h-full w-full object-cover object-center"
                draggable="false"
            />
            <div className="absolute right-3 top-3 z-30 rounded-lg border border-white/40 bg-white/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                RECENT
            </div>

            {/* Slider Handle */}
            {!disabled && (
                <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white/40 cursor-ew-resize flex items-center justify-center backdrop-blur-sm"
                    style={{ left: `calc(${sliderPosition}% - 0.375rem)` }} // Center the handle on the line
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white/90 text-pink-500 shadow-lg backdrop-blur-md transition-transform duration-200 ease-in-out ${isDragging ? 'scale-110 shadow-xl' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                            <polyline points="9 18 15 12 9 6" style={{ transform: "translate(6px, 0)" }}></polyline>
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};
