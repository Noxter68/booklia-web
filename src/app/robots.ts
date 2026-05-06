import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/fr/business/', '/en/business/', '/pt/business/', '/fr/admin/', '/en/admin/', '/pt/admin/'],
      },
    ],
    sitemap: 'https://booklia.org/sitemap.xml',
  };
}
