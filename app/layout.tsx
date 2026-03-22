import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Faceyoguez',
  description: 'Face Yoga & Wellness Platform',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans text-foreground bg-background relative overflow-x-hidden">
        {/* Randomized Background Motion (Global) */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="aura-glow"></div>
          <div className="aura-glow-alt"></div>
        </div>
        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative z-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
