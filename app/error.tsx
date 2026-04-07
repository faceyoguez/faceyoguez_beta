'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Faceyoguez Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FFFAF7' }}>
        <ErrorUI error={error} reset={reset} />
      </body>
    </html>
  );
}

function ErrorUI({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFAF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, rgba(255,138,117,0.18) 0%, transparent 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          right: '-10%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, rgba(255,112,81,0.12) 0%, transparent 70%)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '520px', textAlign: 'center' }}>
        {/* Petals icon */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF8A75 0%, #FF7051 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 24px 48px rgba(255,138,117,0.3)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Face with closed eyes / zen breathing */}
              <circle cx="24" cy="24" r="20" fill="rgba(255,255,255,0.2)" />
              {/* Left eye */}
              <path d="M16 20 Q18 18 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Right eye */}
              <path d="M28 20 Q30 18 32 20" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Gentle smile */}
              <path d="M19 30 Q24 34 29 30" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Decorative petals / leaves */}
              <path d="M24 8 Q26 4 24 2 Q22 4 24 8Z" fill="rgba(255,255,255,0.5)" />
              <path d="M36 12 Q40 10 40 8 Q36 8 36 12Z" fill="rgba(255,255,255,0.4)" />
              <path d="M12 12 Q8 10 8 8 Q12 8 12 12Z" fill="rgba(255,255,255,0.4)" />
            </svg>
          </div>
        </div>

        {/* Error code badge */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(255,138,117,0.12)',
            border: '1px solid rgba(255,138,117,0.25)',
            borderRadius: '100px',
            padding: '4px 16px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#FF7051',
            marginBottom: '1.25rem',
          }}
        >
          Oops — Something's off
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            color: '#1a1a1a',
            margin: '0 0 1rem',
            letterSpacing: '-0.02em',
          }}
        >
          A ripple in the practice
        </h1>

        {/* Body copy */}
        <p
          style={{
            fontSize: '1rem',
            color: '#6b6b6b',
            lineHeight: '1.7',
            margin: '0 0 2rem',
            maxWidth: '380px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Something unexpected disrupted your session. Take a breath — this moment will pass.
          We&apos;ve noted the disturbance and will restore calm shortly.
        </p>

        {/* Error digest */}
        {error?.digest && (
          <p
            style={{
              fontSize: '11px',
              color: '#aaa',
              fontFamily: 'monospace',
              marginBottom: '2rem',
              letterSpacing: '0.05em',
            }}
          >
            Reference: {error.digest}
          </p>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="error-retry-btn"
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #FF8A75 0%, #FF7051 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '14px 28px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              boxShadow: '0 8px 24px rgba(255,138,117,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(255,138,117,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,138,117,0.35)';
            }}
          >
            Try again
          </button>

          <a
            id="error-home-btn"
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              color: '#1a1a1a',
              border: '1.5px solid rgba(0,0,0,0.08)',
              borderRadius: '14px',
              padding: '14px 28px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.95)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.7)';
            }}
          >
            ← Return home
          </a>
        </div>

        {/* Support link */}
        <p style={{ marginTop: '2.5rem', fontSize: '13px', color: '#aaa' }}>
          Need help?{' '}
          <a
            href="mailto:support@faceyoguez.com"
            style={{ color: '#FF8A75', textDecoration: 'none', fontWeight: '600' }}
          >
            Contact support
          </a>
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 24px 48px rgba(255,138,117,0.3); }
          50% { transform: scale(1.04); box-shadow: 0 28px 56px rgba(255,138,117,0.4); }
        }
      `}</style>
    </div>
  );
}
