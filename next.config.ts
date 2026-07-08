import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // ── Performance: Optimize package imports ──
    optimizePackageImports: ['framer-motion', 'lucide-react', 'gsap'],
  },
  // ── @zoom/meetingsdk's UMD bundle references an AMD-only branch for
  // '@zoom/download-manager', a module that doesn't exist on npm and is never
  // actually reached at runtime — stub it so Turbopack's static analysis doesn't
  // fail the build trying to resolve it.
  turbopack: {
    resolveAlias: {
      '@zoom/download-manager': './lib/stubs/empty-module.js',
    },
  },
  // ── Security: Remove X-Powered-By header ──
  poweredByHeader: false,
  // ── Performance: Enable gzip/brotli compression ──
  compress: true,
  // ── Performance: Next.js Image Optimization ──
  images: {
    // Serve modern WebP/AVIF formats automatically
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 60 days
    minimumCacheTTL: 5184000,
    // Responsive image sizes for landing page
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 320],
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
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  transpilePackages: ['razorpay'],
  // ── Security & Performance Headers ──
  headers: async () => [
    // ── Never cache the Zoom embed bridge page — it's actively being iterated on ──
    {
      source: '/zoom-embed.html',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
    // ── 1-year cache for static assets (images, fonts, JS, CSS) ──
    {
      source: '/assets/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    // Next.js handles /_next/static caching automatically with content hashes in production.
    // Manually setting it here breaks local development caching.
    // ── Security headers for all routes ──
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://connect.facebook.net https://checkout.razorpay.com https://cdn.razorpay.com https://www.youtube.com https://s.ytimg.com https://www.clarity.ms https://*.clarity.ms https://zoom.us https://*.zoom.us",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://zoom.us https://*.zoom.us",
            "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://i.ytimg.com https://*.razorpay.com https://www.facebook.com https://*.googleusercontent.com https://drive.google.com https://*.google.com https://*.clarity.ms https://c.bing.com https://zoom.us https://*.zoom.us",
            "font-src 'self' https://fonts.gstatic.com data: https://zoom.us https://*.zoom.us",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://region1.google-analytics.com https://www.facebook.com https://*.facebook.com https://*.clarity.ms https://c.bing.com https://zoom.us https://*.zoom.us wss://zoom.us wss://*.zoom.us https://*.cloudfront.net",
            "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://zoom.us https://*.zoom.us https://www.youtube.com",
            "media-src 'self' https://*.public.blob.vercel-storage.com blob: data: https://zoom.us https://*.zoom.us",
            "worker-src 'self' blob: https://zoom.us https://*.zoom.us",
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

