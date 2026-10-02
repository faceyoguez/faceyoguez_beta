'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Fires a PageView on client-side route changes. The pixel base code itself
 * (init + the first PageView) lives as a plain inline <script> in the root
 * layout's <head> — see app/layout.tsx for why it isn't loaded via next/script.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // The inline base code already tracked the initial PageView — skip the
    // mount run so the first page isn't counted twice.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}
