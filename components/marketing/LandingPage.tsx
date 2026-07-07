'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { pixel } from '@/lib/pixel';

// ── Eagerly loaded: visible on first paint ──────────────────────────────────
import { Loader } from './Loader';
import { SmoothScroll } from './SmoothScroll';
import { Hero } from './Hero';

// ── Lazily loaded: below the fold — reduces initial JS bundle by ~60-70% ───
// This is the fix for the 5-second mobile tap delay on Login / Get Started.
// Next.js will NOT include these in the first paint bundle; they stream in
// after the user is already looking at the Hero.
const LuxuryBackground = dynamic(
  () => import('./LuxuryBackground').then(mod => mod.LuxuryBackground),
  { ssr: false }
);
const Philosophy = dynamic(() => import('./Philosophy').then(mod => mod.Philosophy));
const Gallery = dynamic(() => import('./Gallery').then(mod => mod.Gallery));
const HowItWorks = dynamic(() => import('./HowItWorks').then(mod => mod.HowItWorks));
const Testimonials = dynamic(() => import('./Testimonials').then(mod => mod.Testimonials));
const Instructor = dynamic(() => import('./Instructor').then(mod => mod.Instructor));
const WhyUs = dynamic(() => import('./WhyUs').then(mod => mod.WhyUs));
const Plans = dynamic(() => import('./Plans').then(mod => mod.Plans));
const FAQ = dynamic(() => import('./FAQ').then(mod => mod.FAQ));
const GoogleReview = dynamic(() => import('./GoogleReview').then(mod => mod.GoogleReview));
const FooterCTA = dynamic(() => import('./FooterCTA').then(mod => mod.FooterCTA));
const VerifiedProofs = dynamic(() => import('./VerifiedProofs').then(mod => mod.VerifiedProofs));
const FloatingEnquiry = dynamic(() => import('./FloatingEnquiry').then(mod => mod.FloatingEnquiry));

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
  const router = useRouter();
  const [loaderDone, setLoaderDone] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const firedSections = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Pre-cache the login and signup pages immediately so tapping the
    // nav buttons is near-instant — no compilation delay on mobile.
    router.prefetch('/auth/login');
    router.prefetch('/auth/signup');

    const hasLoaded = sessionStorage.getItem('faceyoguez_has_loaded');
    if (hasLoaded) {
      setLoaderDone(true);
    }
    setIsInitializing(false);

    // Fire landing page view once
    pixel.landingPageViewed();
  }, [router]);

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

