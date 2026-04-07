import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | Faceyoguez',
  description: 'The page you were looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFFAF7] flex flex-col items-center justify-center px-6 py-20">

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(255,138,117,0.18)_0%,transparent_70%)] blur-[90px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(255,112,81,0.10)_0%,transparent_70%)] blur-[110px]" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,rgba(255,200,170,0.12)_0%,transparent_70%)] blur-[70px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">

        {/* Floating petal icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,138,117,0.25)_0%,transparent_70%)] blur-2xl scale-150" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#FF8A75] to-[#FF7051] flex items-center justify-center shadow-[0_24px_56px_rgba(255,138,117,0.35)] animate-[gentleFloat_5s_ease-in-out_infinite]">
              {/* 404 leaf/lotus SVG */}
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Compass / lost petals metaphor */}
                {/* Petal top */}
                <path d="M30 28 Q32 20 30 14 Q28 20 30 28Z" fill="rgba(255,255,255,0.7)" />
                {/* Petal bottom */}
                <path d="M30 32 Q32 40 30 46 Q28 40 30 32Z" fill="rgba(255,255,255,0.5)" />
                {/* Petal left */}
                <path d="M28 30 Q20 32 14 30 Q20 28 28 30Z" fill="rgba(255,255,255,0.6)" />
                {/* Petal right */}
                <path d="M32 30 Q40 32 46 30 Q40 28 32 30Z" fill="rgba(255,255,255,0.4)" />
                {/* Petal top-right */}
                <path d="M32 28 Q38 22 40 16 Q34 20 32 28Z" fill="rgba(255,255,255,0.5)" />
                {/* Petal top-left */}
                <path d="M28 28 Q22 22 20 16 Q26 20 28 28Z" fill="rgba(255,255,255,0.5)" />
                {/* Center */}
                <circle cx="30" cy="30" r="5" fill="white" opacity="0.9" />
                {/* Question dot */}
                <circle cx="30" cy="30" r="2" fill="#FF8A75" />
              </svg>
            </div>
          </div>
        </div>

        {/* 404 number — large, editorial */}
        <div className="relative mb-3">
          <span
            className="block leading-none font-black text-[#1a1a1a] select-none"
            style={{
              fontSize: 'clamp(6rem, 18vw, 11rem)',
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #1a1a1a 20%, #FF8A75 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[rgba(255,138,117,0.1)] border border-[rgba(255,138,117,0.25)] rounded-full px-4 py-1.5 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF7051]">
            Page not found
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] leading-tight tracking-tight mb-4">
          You&apos;ve wandered off the path
        </h1>

        {/* Body */}
        <p className="text-base text-[#6b6b6b] leading-relaxed max-w-sm mx-auto mb-8">
          This page doesn&apos;t exist — or it may have moved. Let&apos;s guide you back to
          your practice and the places you know.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            id="not-found-home-btn"
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF8A75] to-[#FF7051] text-white font-bold rounded-2xl px-7 py-3.5 text-sm shadow-[0_8px_24px_rgba(255,138,117,0.35)] hover:shadow-[0_12px_32px_rgba(255,138,117,0.5)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L8 2L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 2V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Go to homepage
          </Link>

          <Link
            id="not-found-dashboard-btn"
            href="/student/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur-xl text-[#1a1a1a] font-semibold rounded-2xl px-7 py-3.5 text-sm border border-black/8 hover:bg-white hover:-translate-y-0.5 transition-all duration-200"
          >
            My Dashboard
          </Link>
        </div>

        {/* Quick links */}
        <div className="border-t border-black/6 pt-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-4">Quick links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Face Yoga Classes', href: '/#classes' },
              { label: 'Pricing', href: '/#pricing' },
              { label: 'Login', href: '/auth/login' },
              { label: 'Support', href: 'mailto:support@faceyoguez.com' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-[#6b6b6b] hover:text-[#FF8A75] bg-white/60 border border-black/6 rounded-full px-4 py-1.5 transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* keyframe in a style tag — avoids globals.css mutation */}
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(3deg); }
          66% { transform: translateY(-5px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
