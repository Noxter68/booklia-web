'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  weeksSinceLast: number;
  appliedTierWeeks: number;
  basePriceCents: number;
  totalPriceCents: number;
}

export function LoyaltySurchargeModal({
  isOpen,
  onClose,
  weeksSinceLast,
  appliedTierWeeks,
  basePriceCents,
  totalPriceCents,
}: Props) {
  const t = useTranslations('loyaltyModal');

  if (!isOpen) return null;

  const roundedWeeks = Math.floor(weeksSinceLast);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold">{t('title')}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('body', { weeks: roundedWeeks, threshold: appliedTierWeeks })}
            </p>

            <div className="rounded-xl bg-background border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('basePrice')}</span>
                <span className="line-through text-muted-foreground">
                  {formatPrice(basePriceCents)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('newPrice')}</span>
                <span className="font-bold text-primary text-lg">
                  {formatPrice(totalPriceCents)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-5 border-t border-border">
            <Button onClick={onClose} className="rounded-full">
              {t('confirm')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
