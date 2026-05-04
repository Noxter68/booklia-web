import type { Metadata } from 'next';
import { getBusinessBySlugServer } from '@/lib/server-api';
import BusinessDetailClient from './business-detail-client';

type Params = Promise<{ locale: string; slug: string }>;

// ISR: page is rebuilt at most once per minute per slug. Public endpoint is
// cached at the backend (BUSINESS_PAGE, 120s) so this is cheap.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlugServer(slug);

  if (!business) {
    return {
      title: 'Salon introuvable',
      robots: { index: false, follow: false },
    };
  }

  const title = `${business.name}${business.city ? ` — ${business.city}` : ''}`;
  const description =
    business.description ||
    `Prenez rendez-vous chez ${business.name}${business.city ? ` à ${business.city}` : ''} sur Booklia.`;
  const ogImage = business.coverUrl || business.logoUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: business.acceptsOnlineBooking === false
      ? { index: true, follow: true }
      : { index: true, follow: true },
  };
}

export default function BusinessPublicPage() {
  return <BusinessDetailClient />;
}
