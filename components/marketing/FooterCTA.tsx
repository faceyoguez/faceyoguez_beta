'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flower2 } from 'lucide-react';
import { trackConversionEvent } from '@/lib/conversionTracking';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const siteLinks = [
  { label: 'Home', href: '/' },
];

const schoolLinks: { label: string; href: string }[] = [];

export function FooterCTA() {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(contentRef.current, { y: 50, opacity: 0 });
      gsap.to(contentRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: footerRef.current, start: 'top 80%' },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} style={{ backgroundColor: 'rgb(252, 244, 235)' }}>
      {/* Contact section */}
      <div className="px-6 md:px-12 py-24 md:py-32">
        <div ref={contentRef} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Left - Logo and tagline */}
            <div className="md:col-span-1 space-y-6">
              <Link href="/" className="flex items-center gap-3 group">
                <div
                  className="h-10 w-10 flex items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(249, 109, 65, 0.1)' }}
                >
                  <Flower2 className="h-5 w-5" strokeWidth={1.5} style={{ color: 'rgb(249, 109, 65)' }} />
                </div>
                <span
                  className="text-2xl font-sooner tracking-tight"
                  style={{ color: 'rgb(44, 37, 37)' }}
                >
                  Faceyoguez
                </span>
              </Link>
              <p
                className="leading-relaxed max-w-xs font-jakarta text-base"
                style={{
                  color: 'rgb(153, 143, 132)',
                }}
              >
                Authentic face yoga techniques designed for natural rejuvenation. Awaken your natural beauty.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[rgb(44,37,37)] hover:text-[rgb(252,244,235)]"
                  style={{ borderColor: 'rgba(44, 37, 37, 0.2)', color: 'rgb(44, 37, 37)' }}
                  aria-label="Instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[rgb(44,37,37)] hover:text-[rgb(252,244,235)]"
                  style={{ borderColor: 'rgba(44, 37, 37, 0.2)', color: 'rgb(44, 37, 37)' }}
                  aria-label="Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Middle - Site links */}
            <div className="space-y-5">
              <h4
                className="text-[11px] font-aktiv tracking-[0.35em] uppercase mb-6"
                style={{ color: 'rgb(153, 143, 132)' }}
              >
                Brand
              </h4>
              {siteLinks.map((link) => (
                 <Link
                  key={link.label}
                  href={link.href}
                  className="block font-jakarta text-[1.05rem] transition-colors duration-200"
                  style={{
                    color: 'rgb(44, 37, 37)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(249, 109, 65)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(44, 37, 37)'; }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* School of Face links - only show if there are links */}
            {schoolLinks.length > 0 && (
              <div className="space-y-5">
                <h4
                  className="text-[11px] font-aktiv tracking-[0.35em] uppercase mb-6"
                  style={{ color: 'rgb(153, 143, 132)' }}
                >
                  School of Face
                </h4>
                {schoolLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block font-jakarta text-[1.05rem] transition-colors duration-200"
                    style={{
                      color: 'rgb(44, 37, 37)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(249, 109, 65)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(44, 37, 37)'; }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            
            <div className="space-y-6">
              <h4
                className="text-[11px] font-aktiv font-bold tracking-[0.35em] uppercase mb-6"
                style={{ color: 'rgb(153, 143, 132)' }}
              >
                Inquiries
              </h4>
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  trackConversionEvent({ event_type: 'contact_form_fill' });
                  // Add actual submission logic here if needed
                  alert('Thank you! We will get back to you soon.');
                }}
              >
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  required
                  className="w-full bg-white/50 border border-black/5 rounded-xl px-4 py-2.5 text-sm font-jakarta focus:outline-none focus:border-pink-300 transition-colors"
                />
                <button 
                  type="submit"
                  className="w-full bg-[#2c2525] text-white text-[11px] font-black font-aktiv uppercase tracking-widest py-3 rounded-xl hover:bg-pink-500 transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-6 md:px-12 py-6 border-t"
        style={{ borderColor: 'rgba(44, 37, 37, 0.1)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="text-[12px] font-jakarta tracking-wide"
            style={{ color: 'rgb(153, 143, 132)' }}
          >
            © 2026 Faceyoguez. All rights reserved.
          </p>
          <Link
            href="#"
            className="text-[12px] font-jakarta tracking-wide transition-colors"
            style={{ color: 'rgb(153, 143, 132)' }}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
