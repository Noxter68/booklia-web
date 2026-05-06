import { MetadataRoute } from 'next';

const BASE_URL = 'https://booklia.org';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/fr`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/en`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/pt`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/fr/search`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.7 },
    { url: `${BASE_URL}/en/search`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.6 },
    { url: `${BASE_URL}/fr/about`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/en/about`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/fr/legal/terms`,   lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/fr/legal/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
