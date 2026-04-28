'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/auth-context';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { api } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  // Set locale synchronously so the very first API calls use it
  api.setLocale(locale);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 2 min stale + 10 min gc is a good fit for a dashboard that
            // receives WebSocket events on mutating state and relies on
            // explicit invalidations after user actions. Longer staleness
            // cuts the refetch storm when tabs mount and remount.
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
            retry: (failureCount, error: unknown) => {
              // Don't retry 4xx (client errors); retry 5xx and network errors up to 2x.
              const status =
                (error as { status?: number } | undefined)?.status ?? 0;
              if (status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        forcedTheme="light"
      >
        <AuthProvider>
          <WebSocketProvider>
            <ToastProvider>{children}</ToastProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
