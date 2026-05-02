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
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface AmountsVisibilityContextType {
  visible: boolean;
  requestReveal: () => void;
  hide: () => void;
  toggle: () => void;
}

const AmountsVisibilityContext = createContext<
  AmountsVisibilityContextType | undefined
>(undefined);

const STORAGE_KEY = 'booklia.amountsVisible';

/**
 * Provides a dashboard-wide "hide amounts" toggle. Revealing requires the
 * user's password. Once revealed, the visible state is persisted in
 * localStorage so a refresh keeps the amounts shown until the user explicitly
 * hides them again. Hiding does not require re-auth.
 */
export function AmountsVisibilityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisibleState] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY) === '1') {
      setVisibleState(true);
    }
  }, []);

  const setVisible = useCallback((next: boolean) => {
    setVisibleState(next);
    if (typeof window !== 'undefined') {
      if (next) window.localStorage.setItem(STORAGE_KEY, '1');
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const requestReveal = useCallback(() => {
    if (visible) return;
    setModalOpen(true);
  }, [visible]);

  const hide = useCallback(() => setVisible(false), [setVisible]);

  const toggle = useCallback(() => {
    if (visible) {
      setVisible(false);
    } else {
      setModalOpen(true);
    }
  }, [visible, setVisible]);

  const value = useMemo(
    () => ({ visible, requestReveal, hide, toggle }),
    [visible, requestReveal, hide, toggle],
  );

  return (
    <AmountsVisibilityContext.Provider value={value}>
      {children}
      <RevealPasswordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setVisible(true);
          setModalOpen(false);
        }}
      />
      {/* Cross-tab sync: when another tab toggles, mirror it here */}
      <StorageSync setVisible={setVisible} />
    </AmountsVisibilityContext.Provider>
  );
}

export function useAmountsVisibility() {
  const ctx = useContext(AmountsVisibilityContext);
  if (!ctx) {
    throw new Error(
      'useAmountsVisibility must be used inside AmountsVisibilityProvider',
    );
  }
  return ctx;
}

/**
 * Renders a pre-formatted amount string (e.g. "123,45 €") or a masked
 * placeholder depending on the visibility context. Pass the already-formatted
 * value — this component doesn't format, it just masks.
 */
export function MaskedAmount({
  value,
  className,
  placeholder = '•••',
}: {
  value: string;
  className?: string;
  placeholder?: string;
}) {
  const { visible } = useAmountsVisibility();
  return (
    <span className={className}>{visible ? value : placeholder}</span>
  );
}

/**
 * Eye toggle button for the dashboard header.
 */
export function AmountsVisibilityToggle({ className }: { className?: string }) {
  const { visible, toggle } = useAmountsVisibility();
  return (
    <button
      type="button"
      onClick={toggle}
      title={visible ? 'Masquer les montants' : 'Afficher les montants'}
      className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-muted ${className ?? ''}`}
    >
      {visible ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

function StorageSync({ setVisible }: { setVisible: (next: boolean) => void }) {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      // Mirror without re-writing storage (use the raw setter via a fresh closure
      // would re-write; we read current state via effect-only setter cycle).
      // Calling setVisible here would persist again — that's idempotent so it's fine.
      setVisible(e.newValue === '1');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [setVisible]);
  return null;
}

function RevealPasswordModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { error: showError } = useToast();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;
    setIsLoading(true);
    try {
      await api.verifyPassword(password);
      setPassword('');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mot de passe incorrect';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Afficher les montants
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Saisissez votre mot de passe pour révéler les montants.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!password || isLoading}
                className="rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-1.5" />
                )}
                Afficher
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
