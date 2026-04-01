import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/student/', '/instructor/', '/staff/', '/debug/', '/api/'],
    },
    sitemap: 'https://faceyoguez.com/sitemap.xml',
  };
}
