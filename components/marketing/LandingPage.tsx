'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { pixel } from '@/lib/pixel';

const LuxuryBackground = dynamic(
  () => import('./LuxuryBackground').then(mod => mod.LuxuryBackground),
  { ssr: false }
);
import { FloatingEnquiry } from './FloatingEnquiry';

/** Section names and their DOM IDs for scroll tracking */
const SCROLL_SECTIONS = [
  { id: 'section-philosophy', name: 'philosophy' },
  { id: 'section-gallery', name: 'gallery' },
  { id: 'section-testimonials', name: 'testimonials' },
  { id: 'section-plans', name: 'plans' },
  { id: 'section-instructor', name: 'instructor' },
  { id: 'section-faq', name: 'faq' },
  { id: 'section-footer', name: 'footer' },
];

export function LandingPage() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const firedSections = useRef<Set<string>>(new Set());

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('faceyoguez_has_loaded');
    if (hasLoaded) {
      setLoaderDone(true);
    }
    setIsInitializing(false);

    // Fire landing page view once
    pixel.landingPageViewed();
  }, []);

  // Scroll section tracking via IntersectionObserver
  useEffect(() => {
    if (!loaderDone) return;

    const observers: IntersectionObserver[] = [];

    SCROLL_SECTIONS.forEach(({ id, name }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !firedSections.current.has(name)) {
            firedSections.current.add(name);
            pixel.scrollSection(name);
          }
        },
        { threshold: 0.25 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [loaderDone]);

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
              <div id="section-philosophy"><Philosophy /></div>

              {/* S5: Real Results — transformation gallery */}
              <div id="section-gallery"><Gallery /></div>

              {/* Verified Proofs — interactive transformation carousel */}
              <VerifiedProofs />

              {/* S9: Testimonials — social proof */}
              <div id="section-testimonials"><Testimonials /></div>

              {/* S7: Plans / Offerings */}
              <div id="section-plans"><Plans /></div>

              {/* S6: About Harsimrat */}
              <div id="section-instructor"><Instructor /></div>

              {/* S10: Why Faceyoguez — comparison table */}
              <WhyUs />

              {/* S11: FAQ */}
              <div id="section-faq"><FAQ /></div>

              {/* Google Reviews */}
              <GoogleReview />

              {/* Footer */}
              <div id="section-footer"><FooterCTA /></div>
              <FloatingEnquiry />
            </>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}

