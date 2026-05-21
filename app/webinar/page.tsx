import type { Metadata } from 'next';
import { WebinarPageClient } from './WebinarPageClient';
import { getWebinarWhatsAppLink } from '@/lib/actions/webinar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Free Live Webinar — Face Wellness with Harsimrat | Faceyoguez',
  description: 'Join Harsimrat — India\'s #1 Face Wellness Coach — for a free live session every weekend. Discover the facial muscle techniques that 2,000+ women use to visibly lift, tone, and glow. No creams. No needles. No surgery.',
  keywords: [
    'face yoga webinar', 'free face yoga class', 'face yoga online India', 'face wellness webinar',
    'Harsimrat face yoga', 'facial muscle training', 'natural face lift webinar', 'free live session face yoga',
    'face yoga for women India', 'face yoga Zoom class', 'jawline exercise webinar',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://faceyoguez.com/webinar',
    siteName: 'Faceyoguez',
    title: 'Free Live Webinar — The Real Reason Your Skin Is Ageing Faster Than It Should',
    description: 'Every weekend. Free. Live on Zoom. Discover what 2,000+ Indian women used to visibly lift and tone their face — in just 10 minutes a day.',
    images: [{ url: '/assets/thumbnail_img.png', width: 1200, height: 630, alt: 'Faceyoguez Free Webinar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Live Face Yoga Webinar | Faceyoguez',
    description: 'Every weekend. Free. Live on Zoom. No creams. No needles. Just results.',
    images: ['/assets/thumbnail_img.png'],
  },
  alternates: { canonical: 'https://faceyoguez.com/webinar' },
};

export default async function WebinarPage() {
  const whatsappLink = await getWebinarWhatsAppLink();

  return <WebinarPageClient whatsappLink={whatsappLink} />;
}
