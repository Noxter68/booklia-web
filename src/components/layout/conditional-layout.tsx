'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';

// Strip locale prefix from pathname for route matching
function stripLocale(pathname: string): string {
  // Matches /en/..., /pt/..., /fr/... at the start
  const match = pathname.match(/^\/(fr|en|pt)(\/|$)/);
  if (match) {
    return pathname.slice(match[1].length + 1) || '/';
  }
  return pathname;
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cleanPath = stripLocale(pathname || '');

  // Don't show header/footer on admin pages
  const isAdminPage = cleanPath.startsWith('/admin');
  const isMapPage = cleanPath.startsWith('/search');

  if (isAdminPage) {
    return <>{children}</>;
  }

  if (isMapPage) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
