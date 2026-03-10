'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show header/footer on admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  const isMapPage = pathname?.startsWith('/search');

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
