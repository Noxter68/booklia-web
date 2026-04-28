'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Building2,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui/spinner';
import { api } from '@/lib/api';

const REFERRALS_LAST_SEEN_KEY = 'admin:referrals:lastSeenAt';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasRedirected = useRef(false);

  // Allow login page without auth (pathname includes locale prefix, e.g. /fr/admin/login)
  const isLoginPage = pathname.endsWith('/admin/login');

  useEffect(() => {
    // Reset redirect flag when on login page
    if (isLoginPage) {
      hasRedirected.current = false;
      return;
    }

    // Only redirect once and only when not loading
    if (!isLoading && !hasRedirected.current) {
      if (!user) {
        hasRedirected.current = true;
        router.replace('/admin/login');
      } else if (!user.isAdmin) {
        hasRedirected.current = true;
        router.replace('/admin/login?error=unauthorized');
      }
    }
  }, [user, isLoading, isLoginPage, router]);

  // Show loader while checking auth (except on login page)
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  // Login page - render without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not authorized - show loader while redirecting
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  // Track when the admin last opened the referrals page so we can highlight
  // only newly submitted ones in the sidebar badge.
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFERRALS_LAST_SEEN_KEY);
  });

  // Reset the badge when the admin navigates to the referrals page.
  useEffect(() => {
    if (pathname.endsWith('/admin/referrals')) {
      const now = new Date().toISOString();
      window.localStorage.setItem(REFERRALS_LAST_SEEN_KEY, now);
      setLastSeenAt(now);
    }
  }, [pathname]);

  const { data: referralsBadge } = useQuery({
    queryKey: ['admin-referrals-pending-count', lastSeenAt],
    queryFn: () => api.adminGetReferralsPendingCount(lastSeenAt ?? undefined),
    enabled: !!user?.isAdmin,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const referralsBadgeCount = referralsBadge?.count ?? 0;

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/businesses', icon: Building2, label: 'Business' },
    {
      href: '/admin/referrals',
      icon: Heart,
      label: 'Parrainages',
      badge: referralsBadgeCount,
    },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 shadow-sm
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Administration</h1>
              <p className="text-xs text-gray-500">Panel de gestion</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const badgeCount = item.badge ?? 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
                {badgeCount > 0 && !isActive && (
                  <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full ring-2 ring-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Deconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
