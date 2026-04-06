'use client';

import { useState, useCallback } from 'react';
import { Loader } from './Loader';
import { SmoothScroll } from './SmoothScroll';
import { Hero } from './Hero';
import { Philosophy } from './Philosophy';
import { Gallery } from './Gallery';
import { Instructor } from './Instructor';
import { Testimonials } from './Testimonials';
import { Plans } from './Plans';
import { GoogleReview } from './GoogleReview';
import { FooterCTA } from './FooterCTA';
import { LuxuryBackground } from './LuxuryBackground';

export function LandingPage() {
  const [loaderDone, setLoaderDone] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setLoaderDone(true);
  }, []);

  return (
    <>
      <Loader onComplete={handleLoaderComplete} />

      <SmoothScroll>
        <LuxuryBackground />
        <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>
          <Hero visible={loaderDone} />
          {loaderDone && (
            <>
              <Philosophy />
              <Gallery />
              <Instructor />
              <Testimonials />
              <Plans />
              <GoogleReview />
              <FooterCTA />
            </>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}
