'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  /** Content to render when there is no error. */
  children: ReactNode;
  /** Optional custom fallback UI. Receives error + reset handler. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional descriptive label for the region (used in error badge). */
  label?: string;
  /** If true, renders a compact inline fallback (good for cards / widgets). */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, label, inline } = this.props;

    if (!hasError || !error) return children;

    // Custom fallback
    if (fallback) return fallback(error, this.reset);

    // Inline compact fallback (for cards, widgets, sections)
    if (inline) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[rgba(255,138,117,0.06)] border border-[rgba(255,138,117,0.15)] text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8A75] to-[#FF7051] flex items-center justify-center shadow-[0_6px_16px_rgba(255,138,117,0.25)]">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">
              {label ? `${label} unavailable` : 'Something went wrong'}
            </p>
            <p className="text-xs text-[#aaa] mt-0.5">This section ran into an issue.</p>
          </div>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8A75] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    // Full-page fallback
    return (
      <div className="relative flex min-h-[400px] items-center justify-center px-6 py-12 overflow-hidden rounded-3xl">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-2/3 h-2/3 rounded-full bg-[radial-gradient(circle,rgba(255,138,117,0.12)_0%,transparent_70%)] blur-[60px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm text-center">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[rgba(255,138,117,0.2)] blur-lg scale-125" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF8A75] to-[#FF7051] flex items-center justify-center shadow-[0_12px_32px_rgba(255,138,117,0.3)]">
                <AlertTriangle className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[rgba(255,138,117,0.1)] border border-[rgba(255,138,117,0.2)] rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7051]">
              {label ?? 'Error'}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-[#1a1a1a] mb-2 leading-tight">
            This section needs a moment
          </h2>
          <p className="text-sm text-[#6b6b6b] leading-relaxed mb-6">
            An unexpected error occurred. Your data is safe — try refreshing this section or returning to your dashboard.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              id={`error-boundary-retry-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'default'}`}
              onClick={this.reset}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF8A75] to-[#FF7051] text-white font-bold rounded-xl px-5 py-2.5 text-sm shadow-[0_6px_16px_rgba(255,138,117,0.3)] hover:shadow-[0_10px_24px_rgba(255,138,117,0.45)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>

            <Link
              href="/student/dashboard"
              id="error-boundary-dashboard-link"
              className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md text-[#1a1a1a] font-semibold rounded-xl px-5 py-2.5 text-sm border border-black/8 hover:bg-white hover:-translate-y-0.5 transition-all duration-200"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

// ─── HOC helper ───────────────────────────────────────────────────────────────

/**
 * Wrap any component with an error boundary.
 *
 * @example
 * const SafeWidget = withErrorBoundary(MyWidget, { label: 'Widget', inline: true });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
): React.FC<P> {
  const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}
