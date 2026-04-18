import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // ── Security: Remove X-Powered-By header ──
  poweredByHeader: false,
  // ── Performance: Enable compression ──
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vdeddkrsumjhzkqaeywl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  transpilePackages: ['razorpay'],
  // ── Security Headers (OWASP Compliant) ──
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Prevent clickjacking
        { key: 'X-Frame-Options', value: 'DENY' },
        // Prevent MIME type sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // Control referrer information
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Enable DNS prefetching for performance
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        // Force HTTPS for 2 years
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        // Restrict browser features
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // Prevent XSS attacks (legacy browser support)
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        // Content Security Policy — whitelist only trusted sources
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://checkout.razorpay.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://checkout.razorpay.com https://api.razorpay.com https://region1.google-analytics.com",
            "frame-src https://checkout.razorpay.com https://*.zoom.us",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ')
        },
      ],
    },
  ],
};

export default nextConfig;
