import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // ── Performance: Optimize package imports ──
    optimizePackageImports: ['framer-motion', 'lucide-react', 'gsap'],
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
    // ── 1-year cache for static assets (images, fonts, JS, CSS) ──
    {
      source: '/assets/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    // ── Security headers for all routes ──
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://checkout.razorpay.com https://cdn.razorpay.com https://www.youtube.com https://s.ytimg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://i.ytimg.com https://*.razorpay.com https://www.facebook.com https://*.googleusercontent.com https://drive.google.com https://*.google.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://region1.google-analytics.com",
            "frame-src https://checkout.razorpay.com https://api.razorpay.com https://*.zoom.us https://www.youtube.com",
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

