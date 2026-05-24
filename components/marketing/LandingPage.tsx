'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader } from './Loader';
import { SmoothScroll } from './SmoothScroll';
import { Hero } from './Hero';
import { Philosophy } from './Philosophy';
import { Gallery } from './Gallery';
import { HowItWorks } from './HowItWorks';
import { Testimonials } from './Testimonials';
import { Instructor } from './Instructor';
import { WhyUs } from './WhyUs';
import { Plans } from './Plans';
import { FAQ } from './FAQ';
import { GoogleReview } from './GoogleReview';
import { FooterCTA } from './FooterCTA';
import { VerifiedProofs } from './VerifiedProofs';
import dynamic from 'next/dynamic';

const LuxuryBackground = dynamic(
  () => import('./LuxuryBackground').then(mod => mod.LuxuryBackground),
  { ssr: false }
);
import { FloatingEnquiry } from './FloatingEnquiry';

export function LandingPage() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('faceyoguez_has_loaded');
    if (hasLoaded) {
      setLoaderDone(true);
    }
    setIsInitializing(false);
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setLoaderDone(true);
    sessionStorage.setItem('faceyoguez_has_loaded', 'true');
  }, []);

  if (isInitializing) return null;

  return (
    <>
      {!loaderDone && <Loader onComplete={handleLoaderComplete} />}

      <SmoothScroll>
        <LuxuryBackground />
        <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>
          <Hero visible={loaderDone} />
          {loaderDone && (
            <>
              {/* S3 + S4: Problem → Solution narrative */}
              <Philosophy />

              {/* S5: Real Results — transformation gallery */}
              <Gallery />

              {/* Verified Proofs — interactive transformation carousel */}
              <VerifiedProofs />

              {/* S9: Testimonials — social proof */}
              <Testimonials />

              {/* S7: Plans / Offerings */}
              <Plans />

              {/* S6: About Harsimrat */}
              <Instructor />

              {/* S10: Why Faceyoguez — comparison table */}
              <WhyUs />

              {/* S11: FAQ */}
              <FAQ />

              {/* Google Reviews */}
              <GoogleReview />

              {/* Footer */}
              <FooterCTA />
              <FloatingEnquiry />
            </>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}
