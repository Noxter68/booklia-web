'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

/**
 * Cookie consent categories. "necessary" is always granted (functional auth,
 * preferences). Optional categories require explicit user opt-in via the
 * banner before they may be activated.
 */
export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentContextType {
  consent: CookieConsent | null; // null = no decision yet (banner shown)
  hasDecided: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveCustom: (analytics: boolean, marketing: boolean) => void;
  /** Re-open the customise modal for users to revise their choice. */
  reopen: () => void;
  isCustomising: boolean;
  startCustomising: () => void;
  cancelCustomising: () => void;
}

const STORAGE_KEY = 'booklia.cookieConsent.v1';

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(
  undefined,
);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isCustomising, setIsCustomising] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.analytics === 'boolean' &&
          typeof parsed.marketing === 'boolean'
        ) {
          setConsentState({
            necessary: true,
            analytics: parsed.analytics,
            marketing: parsed.marketing,
          });
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CookieConsent) => {
    setConsentState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ analytics: next.analytics, marketing: next.marketing }),
      );
    }
  }, []);

  const acceptAll = useCallback(() => {
    persist({ necessary: true, analytics: true, marketing: true });
    setIsCustomising(false);
  }, [persist]);

  const rejectAll = useCallback(() => {
    persist({ necessary: true, analytics: false, marketing: false });
    setIsCustomising(false);
  }, [persist]);

  const saveCustom = useCallback(
    (analytics: boolean, marketing: boolean) => {
      persist({ necessary: true, analytics, marketing });
      setIsCustomising(false);
    },
    [persist],
  );

  const reopen = useCallback(() => {
    setConsentState(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo<CookieConsentContextType>(
    () => ({
      consent,
      hasDecided: hydrated && consent !== null,
      acceptAll,
      rejectAll,
      saveCustom,
      reopen,
      isCustomising,
      startCustomising: () => setIsCustomising(true),
      cancelCustomising: () => setIsCustomising(false),
    }),
    [consent, hydrated, acceptAll, rejectAll, saveCustom, reopen, isCustomising],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      'useCookieConsent must be used inside CookieConsentProvider',
    );
  }
  return ctx;
}
