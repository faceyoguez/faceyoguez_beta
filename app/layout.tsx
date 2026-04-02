import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

import { ThemeProvider } from '@/components/theme-provider';

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${rubik.variable}`}>
      <body className="antialiased font-sans text-foreground bg-background relative overflow-x-hidden">
        {/* Randomized Background Motion (Global) */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="aura-glow"></div>
          <div className="aura-glow-alt"></div>
        </div>
        
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="relative z-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
