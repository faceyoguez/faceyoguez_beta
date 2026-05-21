import type { Metadata } from 'next';
import { ThankYouClient } from './ThankYouClient';
import { getWebinarWhatsAppLink } from '@/lib/actions/webinar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thank You for Registering | Faceyoguez',
  description: 'Thank you for registering for the Free Live Face Wellness Webinar. You are being redirected to the WhatsApp community group.',
  robots: {
    index: false,
    follow: false, // Prevents SEO search engines from indexing the conversion page
  },
};

export default async function WebinarThankYouPage() {
  const whatsappLink = await getWebinarWhatsAppLink();

  return <ThankYouClient whatsappLink={whatsappLink || '#'} />;
}
