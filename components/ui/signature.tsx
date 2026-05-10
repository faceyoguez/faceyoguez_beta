'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ThumbnailsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = Array.from({ length: 35 }, (_, i) => ({
    src: `/assets/proofs/proof-${i + 1}.jpg`,
    title: `Transformation ${i + 1}`
  }));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = window.innerWidth * 0.6; // Scroll by 60% of screen width
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] py-12">
      
      {/* Scrollable Track */}
      <div 
        ref={scrollRef}
        className="flex gap-8 md:gap-16 overflow-x-auto snap-x snap-mandatory px-[10vw] pb-16 pt-4 items-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((image, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="snap-center shrink-0 relative group rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-[1px] border-black/5 bg-white flex items-center justify-center w-[85vw] md:w-[50vw] h-[60vh] md:h-[80vh]"
          >
            {/* 
                Fixed size container with bg-white. 
                Image is constrained to 80% of the container to ensure 
                it is heavily "zoomed out" and framed perfectly.
            */}
            <img
              src={image.src}
              alt={image.title}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              className="max-w-[85%] max-h-[85%] object-contain transition-transform duration-1000 group-hover:scale-[1.05]"
              draggable={false}
              onError={(e) => {
                console.error("DEBUG: Local image failed to load ->", image.src);
              }}
            />
            
            {/* Verified Badge overlay, appears on hover for cleaner look */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2a2019]">Verified Transformation</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Clean Navigation Controls below the track */}
      <div className="flex justify-center items-center gap-6 mt-4">
        <button 
          onClick={() => scroll('left')}
          className="p-5 rounded-full bg-white border border-[#2a2019]/10 text-[#2a2019] hover:bg-[#e76f51] hover:text-white hover:border-[#e76f51] transition-all duration-500 shadow-sm hover:shadow-[0_10px_30px_rgba(231,111,81,0.3)] hover:-translate-y-1"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="p-5 rounded-full bg-white border border-[#2a2019]/10 text-[#2a2019] hover:bg-[#e76f51] hover:text-white hover:border-[#e76f51] transition-all duration-500 shadow-sm hover:shadow-[0_10px_30px_rgba(231,111,81,0.3)] hover:-translate-y-1"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
