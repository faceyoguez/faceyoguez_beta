'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-16 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(255,138,117,0.14)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(255,112,81,0.08)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-[rgba(255,138,117,0.2)] blur-xl scale-125" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF8A75] to-[#FF7051] flex items-center justify-center shadow-[0_16px_40px_rgba(255,138,117,0.3)]">
              <AlertTriangle className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[rgba(255,138,117,0.1)] border border-[rgba(255,138,117,0.2)] rounded-full px-4 py-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7051]">
            Session interrupted
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a1a] leading-snug tracking-tight mb-3">
          Something disrupted<br />your session
        </h1>

        {/* Body */}
        <p className="text-sm text-[#6b6b6b] leading-relaxed max-w-sm mx-auto mb-2">
          An unexpected error occurred in this part of your dashboard. Your data is safe — 
          this is just a temporary disturbance in the practice.
        </p>

        {/* Digest */}
        {error?.digest && (
          <p className="text-[11px] text-[#bbb] font-mono tracking-wider mt-2 mb-5">
            ref: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 mb-8">
          <button
            id="dashboard-error-retry-btn"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF8A75] to-[#FF7051] text-white font-bold rounded-2xl px-6 py-3 text-sm shadow-[0_8px_20px_rgba(255,138,117,0.35)] hover:shadow-[0_12px_28px_rgba(255,138,117,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>

          <Link
            id="dashboard-error-home-btn"
            href="/student/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur-xl text-[#1a1a1a] font-semibold rounded-2xl px-6 py-3 text-sm border border-black/8 hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Support */}
        <div className="border-t border-black/6 pt-6 flex items-center justify-center gap-2 text-sm text-[#aaa]">
          <MessageCircle className="w-4 h-4 text-[#FF8A75]" />
          <span>
            Need help?{' '}
            <a
              href="mailto:support@faceyoguez.com"
              className="text-[#FF8A75] font-semibold hover:underline"
            >
              support@faceyoguez.com
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
