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
      <body translate="no" suppressHydrationWarning className="antialiased font-sans text-foreground bg-background relative overflow-x-hidden">
        {/* Abstract Glow (Simplified to reduce lag) */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-rose-100/30 rounded-full blur-[120px] mix-blend-multiply opacity-50" />
          <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-orange-100/20 rounded-full blur-[100px] mix-blend-multiply opacity-40" />
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
