'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CalendarEntry } from '@/types';

interface UseCalendarEntriesOptions {
  start: string;
  end: string;
  staffId?: string | null;
  enabled?: boolean;
}

export function useCalendarEntries({
  start,
  end,
  staffId,
  enabled = true,
}: UseCalendarEntriesOptions) {
  return useQuery<CalendarEntry[]>({
    queryKey: ['calendar-entries', start, end, staffId ?? 'all'],
    queryFn: () =>
      api.getCalendarEntries(start, end, staffId ?? undefined),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
