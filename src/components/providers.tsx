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
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <WebSocketProvider>
            <ToastProvider>{children}</ToastProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
