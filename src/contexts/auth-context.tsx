'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { authClient, AuthUser } from '@/lib/auth';

// QueryKey roots that depend on the authenticated user. We refetch these on
// login/register/logout instead of blasting the entire cache.
const AUTH_SCOPED_QUERY_KEYS = [
  'my-business',
  'my-business-images',
  'my-business-hours',
  'my-business-promotions',
  'my-reservations',
  'business-bookings',
  'notifications',
  'my-referrals',
  'admin-referrals-pending-count',
  'admin-invite-requests-pending-count',
];

function invalidateAuthScopedQueries(client: QueryClient) {
  for (const root of AUTH_SCOPED_QUERY_KEYS) {
    client.invalidateQueries({ queryKey: [root] });
  }
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ user: AuthUser }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthDate: string;
  }) => Promise<{ user: AuthUser }>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  // Incremented on login/register to invalidate any in-flight checkSession
  const authVersion = useRef(0);

  const checkSession = useCallback(async () => {
    const version = authVersion.current;
    setIsLoading(true);
    try {
      const session = await authClient.getSession();
      // Only apply result if no login/register happened while we were fetching
      if (authVersion.current !== version) return;
      setUser(session);
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      setToken(storedToken);
    } catch {
      if (authVersion.current !== version) return;
      setUser(null);
      setToken(null);
    } finally {
      if (authVersion.current === version) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Listen for storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        if (e.newValue === null) {
          // Token was removed (logout)
          setUser(null);
        } else if (e.newValue && !user) {
          // Token was added (login from another tab)
          checkSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, checkSession]);

  const login = async (email: string, password: string) => {
    const result = await authClient.login(email, password);
    // Invalidate any in-flight checkSession so it won't overwrite this state
    authVersion.current++;
    setUser(result.user);
    const storedToken = localStorage.getItem('accessToken');
    setToken(storedToken);
    setIsLoading(false);
    // Only invalidate user-scoped queries that depend on auth state. A blanket
    // invalidateQueries() refetches every cached query (categories, public
    // business pages, etc.) and floods the network on login.
    invalidateAuthScopedQueries(queryClient);
    return result;
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthDate: string;
  }) => {
    const result = await authClient.register(data);
    authVersion.current++;
    setUser(result.user);
    const storedToken = localStorage.getItem('accessToken');
    setToken(storedToken);
    setIsLoading(false);
    invalidateAuthScopedQueries(queryClient);
    return result;
  };

  const logout = useCallback(() => {
    authClient.logout();
    setUser(null);
    setToken(null);
    queryClient.clear();
    router.push('/');
  }, [router, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
