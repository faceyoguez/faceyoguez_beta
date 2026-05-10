'use client';

import { Carousel } from "@ark-ui/react/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ThumbnailsCarousel() {
  // Dynamically load all 35 images
  const images = Array.from({ length: 35 }, (_, i) => ({
    src: `/assets/proofs/proof-${i + 1}.jpg`,
    title: `Transformation ${i + 1}`
  }));

  return (
    <Carousel.Root
      defaultPage={0}
      slideCount={images.length}
      className="max-w-4xl p-2 mx-auto w-full relative"
    >
      {/* Main Image Container */}
      <Carousel.ItemGroup className="relative overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] mb-8 liquid-glass aspect-[4/3] md:aspect-video border border-black/5 group">
        {images.map((image, index) => (
          <Carousel.Item key={index} index={index} className="relative flex items-center justify-center overflow-hidden">
            
            {/* 
                Main Image: 
                - bg-white provides the white background
                - object-contain ensures ZERO cropping
                - p-4 md:p-8 adds the nice extra white space framing around it
            */}
            <img
              src={image.src}
              alt={image.title}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-contain p-4 md:p-8 transition-transform duration-700 group-hover:scale-[1.02]"
              onError={(e) => {
                console.error("DEBUG: Local image failed to load ->", image.src);
              }}
            />

            {/* Verified Badge */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-[#e76f51]/20">
              <div className="w-2 h-2 rounded-full bg-[#e76f51] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2a2019]">Verified Result</span>
            </div>
          </Carousel.Item>
        ))}
      </Carousel.ItemGroup>

      {/* Thumbnails & Controls */}
      <div className="flex items-center gap-6">
        <Carousel.PrevTrigger className="p-3 bg-white hover:bg-[#e76f51] hover:text-white border border-[#e76f51]/10 rounded-2xl transition-all duration-500 shrink-0 shadow-[0_4px_12px_rgba(231,111,81,0.1)] hover:shadow-[0_8px_20px_rgba(231,111,81,0.2)] hover:-translate-y-0.5">
          <ChevronLeft className="w-5 h-5" />
        </Carousel.PrevTrigger>

        {/* Thumbnail Scroll Track */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide flex-1 px-2 py-2">
          {images.map((image, index) => (
            <Carousel.Indicator
              key={index}
              index={index}
              className="shrink-0 border-2 border-transparent data-[current]:border-[#e76f51] data-[current]:scale-110 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:border-[#e76f51]/30 shadow-lg group"
            >
              <div className="relative w-16 md:w-24 aspect-[4/3] shrink-0 overflow-hidden liquid-glass rounded-md">
                <img
                  src={image.src}
                  alt={`Thumbnail ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[#2a2019]/10 group-data-[current]:bg-transparent transition-colors duration-500" />
              </div>
            </Carousel.Indicator>
          ))}
        </div>

        <Carousel.NextTrigger className="p-3 bg-white hover:bg-[#e76f51] hover:text-white border border-[#e76f51]/10 rounded-2xl transition-all duration-500 shrink-0 shadow-[0_4px_12px_rgba(231,111,81,0.1)] hover:shadow-[0_8px_20px_rgba(231,111,81,0.2)] hover:-translate-y-0.5">
          <ChevronRight className="w-5 h-5" />
        </Carousel.NextTrigger>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Carousel.Root>
  );
}
