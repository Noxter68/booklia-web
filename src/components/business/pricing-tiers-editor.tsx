'use client';

import { Plus, Trash2, BanknoteArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

export interface PricingTierDraft {
  thresholdWeeks: number | null;
  surchargeCents: number | null;
}

interface Props {
  basePriceCents: number | null;
  tiers: PricingTierDraft[];
  onChange: (next: PricingTierDraft[]) => void;
}

export function PricingTiersEditor({ basePriceCents, tiers, onChange }: Props) {
  const t = useTranslations('serviceForm');

  const addTier = () => {
    onChange([...tiers, { thresholdWeeks: null, surchargeCents: null }]);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, patch: Partial<PricingTierDraft>) => {
    onChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const hasDuplicateThreshold = (() => {
    const seen = new Set<number>();
    for (const tier of tiers) {
      if (tier.thresholdWeeks !== null) {
        if (seen.has(tier.thresholdWeeks)) return true;
        seen.add(tier.thresholdWeeks);
      }
    }
    return false;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <BanknoteArrowUp className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          {t('pricingTiersHint')}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {tiers.map((tier, index) => {
          const previewSurcharge =
            tier.surchargeCents !== null ? tier.surchargeCents / 100 : null;
          const previewTotal =
            previewSurcharge !== null && basePriceCents !== null
              ? (basePriceCents + (tier.surchargeCents ?? 0)) / 100
              : null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-border bg-background p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t('tierThreshold')}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t('tierThresholdPlaceholder')}
                      value={tier.thresholdWeeks ?? ''}
                      onChange={(e) =>
                        updateTier(index, {
                          thresholdWeeks: e.target.value
                            ? parseInt(e.target.value, 10)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t('tierSurcharge')}
                    </label>
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      placeholder="0,00"
                      value={previewSurcharge ?? ''}
                      onChange={(e) =>
                        updateTier(index, {
                          surchargeCents: e.target.value
                            ? Math.round(parseFloat(e.target.value) * 100)
                            : null,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  aria-label={t('tierRemove')}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {previewTotal !== null && tier.thresholdWeeks !== null && (
                <p className="text-xs text-muted-foreground">
                  {t('tierPreview', {
                    weeks: tier.thresholdWeeks,
                    total: previewTotal.toFixed(2),
                  })}
                </p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {hasDuplicateThreshold && (
        <p className="text-xs text-destructive">{t('tierDuplicateWeeks')}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addTier}
        className="rounded-full gap-2"
      >
        <Plus className="w-4 h-4" />
        {t('tierAdd')}
      </Button>
    </div>
  );
}

/**
 * Drops empty drafts and returns the API-ready payload. Returns null when no
 * valid tier remains so callers can decide to omit the field entirely.
 */
export function tiersToPayload(
  tiers: PricingTierDraft[],
): { thresholdWeeks: number; surchargeCents: number }[] {
  return tiers
    .filter(
      (t) =>
        t.thresholdWeeks !== null &&
        t.thresholdWeeks > 0 &&
        t.surchargeCents !== null &&
        t.surchargeCents > 0,
    )
    .map((t) => ({
      thresholdWeeks: t.thresholdWeeks!,
      surchargeCents: t.surchargeCents!,
    }));
}

export function tiersHaveDuplicates(tiers: PricingTierDraft[]): boolean {
  const seen = new Set<number>();
  for (const t of tiers) {
    if (t.thresholdWeeks !== null) {
      if (seen.has(t.thresholdWeeks)) return true;
      seen.add(t.thresholdWeeks);
    }
  }
  return false;
}
