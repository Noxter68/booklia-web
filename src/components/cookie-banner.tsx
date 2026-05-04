'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/cookie-consent-context';

export function CookieBanner() {
  const t = useTranslations('cookies');
  const {
    consent,
    hasDecided,
    acceptAll,
    rejectAll,
    saveCustom,
    isCustomising,
    startCustomising,
    cancelCustomising,
  } = useCookieConsent();

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [consent]);

  const showBanner = !hasDecided || isCustomising;

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop only when customising (focus on the modal) */}
          {isCustomising && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={cancelCustomising}
            />
          )}

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-md z-[70]"
            role="dialog"
            aria-labelledby="cookie-banner-title"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-xl p-5 sm:p-6">
              {!isCustomising ? (
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Cookie className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 id="cookie-banner-title" className="font-semibold mb-1">
                        {t('title')}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('description')}{' '}
                        <Link
                          href="/legal/privacy"
                          className="underline hover:text-foreground"
                        >
                          {t('learnMore')}
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3">
                    <Button
                      variant="outline"
                      onClick={rejectAll}
                      className="rounded-full w-full text-sm"
                    >
                      {t('rejectAll')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={startCustomising}
                      className="rounded-full w-full text-sm"
                    >
                      {t('customise')}
                    </Button>
                    <Button onClick={acceptAll} className="rounded-full w-full text-sm">
                      {t('acceptAll')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Cookie className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold mb-1">{t('customiseTitle')}</h2>
                        <p className="text-sm text-muted-foreground">
                          {t('customiseDescription')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={cancelCustomising}
                      className="p-1 rounded-full hover:bg-muted transition-colors cursor-pointer shrink-0"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <CategoryRow
                      title={t('categoryNecessary')}
                      description={t('categoryNecessaryDesc')}
                      checked
                      disabled
                      onChange={() => {}}
                    />
                    <CategoryRow
                      title={t('categoryAnalytics')}
                      description={t('categoryAnalyticsDesc')}
                      checked={analytics}
                      onChange={setAnalytics}
                    />
                    <CategoryRow
                      title={t('categoryMarketing')}
                      description={t('categoryMarketingDesc')}
                      checked={marketing}
                      onChange={setMarketing}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={rejectAll}
                      className="rounded-full w-full sm:flex-1 text-sm"
                    >
                      {t('rejectAll')}
                    </Button>
                    <Button
                      onClick={() => saveCustom(analytics, marketing)}
                      className="rounded-full w-full sm:flex-1 text-sm"
                    >
                      {t('savePreferences')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border border-border ${
        disabled ? 'bg-muted/40 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/30'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </label>
  );
}
