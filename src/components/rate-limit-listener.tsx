'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

/**
 * Listens for `api:rate-limit` events emitted by the API client when the
 * server responds with 429. Surfaces a single info toast per cooldown
 * window so rapid bursts of failed calls don't produce a wall of toasts.
 */
export function RateLimitListener() {
  const { info } = useToast();
  const t = useTranslations('common');
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ retryAfter: number }>).detail;
      const retryAfter = Math.max(1, detail?.retryAfter ?? 30);
      const now = Date.now();
      // Only notify once per active cooldown window.
      if (now < cooldownUntilRef.current) return;
      cooldownUntilRef.current = now + retryAfter * 1000;
      info(t('rateLimitToast', { seconds: retryAfter }));
    };

    window.addEventListener('api:rate-limit', handler);
    return () => window.removeEventListener('api:rate-limit', handler);
  }, [info, t]);

  return null;
}
