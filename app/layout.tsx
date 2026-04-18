import type { Metadata } from 'next';
import { Rubik, Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500'],
});

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import Script from 'next/script';
import { Suspense } from 'react';
import MetaPixel from '@/components/MetaPixel';

export const metadata: Metadata = {
  title: {
    default: 'Faceyoguez — Face Yoga Classes Online for Women',
    template: '%s | Faceyoguez',
  },
  description: 'Join expert-led face yoga classes online. Natural face lifting, toning & glowing skin exercises for women. Live 1-on-1 classes, group batches & video courses. Start free!',
  keywords: ['face yoga', 'face yoga online', 'face yoga classes', 'face yoga for women', 'face yoga India', 'natural face lift', 'face yoga exercises', 'face toning', 'glowing skin yoga', 'face yoga course'],
  authors: [{ name: 'Faceyoguez' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://faceyoguez.com',
    siteName: 'Faceyoguez',
    title: 'Faceyoguez — Face Yoga Classes Online for Women',
    description: 'Expert-led face yoga classes online. Natural face lifting, toning & glowing skin. Live 1-on-1, group classes & video courses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faceyoguez — Face Yoga Classes Online for Women',
    description: 'Expert-led face yoga classes online. Natural face lifting, toning & glowing skin.',
  },
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning data-scroll-behavior="smooth" className={`${rubik.variable} ${cormorant.variable} ${dmSans.variable}`}>
      <head>
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
      <body translate="no" suppressHydrationWarning className="antialiased font-sans text-foreground bg-background relative overflow-x-hidden">
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        
        {/* Abstract Glow (Optimized for performance) */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-rose-100/20 rounded-full blur-[80px] mix-blend-multiply opacity-30 will-change-transform" />
          <div className="absolute top-[10%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/15 rounded-full blur-[70px] mix-blend-multiply opacity-25 will-change-transform" />
        </div>
        
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
