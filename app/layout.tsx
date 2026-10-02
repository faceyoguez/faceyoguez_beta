import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

// ── Load only the weights actually used to reduce font payload ──
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: true,
});

const aktivGrotesk = localFont({
  src: [
    {
      path: './(dashboard)/assets/Aktiv Grotesk/Aktiv Grotesk/OTF/AktivGrotesk-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './(dashboard)/assets/Aktiv Grotesk/Aktiv Grotesk/OTF/AktivGrotesk-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './(dashboard)/assets/Aktiv Grotesk/Aktiv Grotesk/OTF/AktivGrotesk-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './(dashboard)/assets/Aktiv Grotesk/Aktiv Grotesk/OTF/AktivGrotesk-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './(dashboard)/assets/Aktiv Grotesk/Aktiv Grotesk/OTF/AktivGrotesk-Black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-aktiv',
  display: 'swap',
});

const sooner = localFont({
  src: './(dashboard)/assets/sooner.otf',
  variable: '--font-sooner',
  display: 'swap',
});


import { Toaster } from 'sonner';
import Script from 'next/script';
import { Suspense } from 'react';
import MetaPixel from '@/components/MetaPixel';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '925136517026086';
import MicrosoftClarity from '@/components/MicrosoftClarity';

export const metadata: Metadata = {
  title: {
    default: 'Faceyoguez — Face Yoga & Face Wellness Classes Online',
    template: '%s | Faceyoguez',
  },
  description: 'Join India\'s leading face yoga & face wellness coach Harsimrat. Expert-led online classes for natural face lifting, jawline toning & glowing skin. Results in 21 days. Start free today!',
  keywords: [
    'face yoga', 'face yoga online', 'face yoga classes India', 'face yoga for women',
    'face wellness coach', 'natural face lift', 'face yoga exercises', 'face toning exercises',
    'glowing skin yoga', 'face yoga course online', 'facial muscle training', 'face yoga Harsimrat',
    'face yoga 21 days', 'face lifting exercises', 'jawline toning',
  ],
  authors: [{ name: 'Harsimrat — Faceyoguez' }],
  metadataBase: new URL('https://faceyoguez.com'),
  alternates: {
    canonical: 'https://faceyoguez.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://faceyoguez.com',
    siteName: 'Faceyoguez',
    title: 'Faceyoguez — Face Yoga & Face Wellness Classes Online',
    description: 'Expert-led face yoga & face wellness classes. Natural face lifting, jawline toning & glowing skin — no needles, no surgery. Results in 21 days.',
    images: [{ url: '/assets/thumbnail_img.png', width: 1200, height: 630, alt: 'Faceyoguez — Face Wellness Classes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faceyoguez — Face Yoga & Face Wellness Classes Online',
    description: 'Expert-led face yoga classes. Natural lifting, toning & glowing skin in 21 days.',
    images: ['/assets/thumbnail_img.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  other: {
    google: 'notranslate',
  },
};

// ── Structured Data (JSON-LD) for Google Rich Results ──
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HealthAndBeautyBusiness',
  name: 'Faceyoguez',
  description: 'India\'s leading face yoga and face wellness coaching platform',
  url: 'https://faceyoguez.com',
  image: 'https://faceyoguez.com/assets/thumbnail_img.png',
  priceRange: '₹₹',
  address: { '@type': 'PostalAddress', addressCountry: 'IN' },
  sameAs: ['https://www.instagram.com/faceyoguez'],
  offers: {
    '@type': 'Offer',
    name: 'Free Trial Face Yoga Class',
    price: '0',
    priceCurrency: 'INR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning data-scroll-behavior="smooth" className={`${plusJakartaSans.variable} ${aktivGrotesk.variable} ${sooner.variable}`} style={{ position: 'relative' }}>
      <head>
        {/* ── DNS Prefetch for third-party domains ── */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//tivvuxyitgqaslqfccit.supabase.co" />
 
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tivvuxyitgqaslqfccit.supabase.co" crossOrigin="anonymous" />
 
        {/* ── Meta Pixel base code ──
            A plain inline <script> in <head>, exactly as Meta's own install
            instructions show. next/script (any strategy) wraps the code as an
            escaped string inside Next's own loader (self.__next_s.push(...)),
            which real browsers run fine but Meta's "detect pixel on this URL"
            checker doesn't recognise. Route-change PageViews are handled by
            <MetaPixel /> below. */}
        <script
          id="meta-pixel"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        {/* ── Structured Data ── */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
 
        {/* ── Google Analytics (deferred — non-blocking) ── */}
        <Script
          strategy="afterInteractive"
          src={'https://www.googletagmanager.com/gtag/js?id=G-QFW9HLLC0S'}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QFW9HLLC0S', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body translate="no" suppressHydrationWarning className="antialiased font-sans text-foreground bg-background relative overflow-x-hidden" style={{ position: 'relative' }}>
        <div className="relative z-10">
          {children}
        </div>
        <Toaster
          position="top-right"
          richColors
          duration={4000}
          closeButton
          visibleToasts={3}
        />
        <Suspense fallback={null}>
          <MetaPixel />
          <MicrosoftClarity />
        </Suspense>
      </body>
    </html>
  );
}
