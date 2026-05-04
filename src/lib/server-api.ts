// Server-side data fetching helpers. Used by Server Components and route
// handlers for the public-facing pages (business profile, search) so that
// Googlebot receives a fully-rendered HTML response and Open Graph tags.
//
// These calls do NOT carry auth tokens — they hit only public endpoints.
// Next.js fetch caching (`next: { revalidate }`) gives us ISR for free.

import type { Business } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type FetchOpts = { revalidate?: number };

async function serverFetch<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: opts.revalidate ?? 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getBusinessBySlugServer(slug: string) {
  return serverFetch<Business>(`/business/${slug}`, { revalidate: 60 });
}
