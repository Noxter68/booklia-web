'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Scissors,
  Clock,
  Euro,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  PricingTiersEditor,
  PricingTierDraft,
  tiersToPayload,
  tiersHaveDuplicates,
} from '@/components/business/pricing-tiers-editor';
import { BusinessCategory, ServicePriceMode } from '@/types';
import { useTranslations } from 'next-intl';

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  description: string;
  detailedDescription: string;
  priceMode: ServicePriceMode;
  priceCents: number | null;
  durationMinutes: number | null;
  businessCategoryId: string | null;
  pricingTiers: PricingTierDraft[];
}

const steps = [
  { number: 1, key: 'stepInfo', icon: FileText },
  { number: 2, key: 'stepPricing', icon: Euro },
  { number: 3, key: 'stepRecap', icon: Check },
] as const;

export default function NewBusinessServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('serviceForm');
  const tc = useTranslations('common');

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    detailedDescription: '',
    priceMode: 'FIXED',
    priceCents: null,
    durationMinutes: null,
    businessCategoryId: searchParams.get('category') || null,
    pricingTiers: [],
  });

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const isFixed = formData.priceMode === 'FIXED';
      const tiers = isFixed ? tiersToPayload(formData.pricingTiers) : [];
      return api.createBusinessService({
        name: formData.name,
        description: formData.description || undefined,
        detailedDescription: formData.detailedDescription || undefined,
        priceMode: formData.priceMode,
        priceCents: isFixed ? formData.priceCents || 0 : 0,
        durationMinutes: formData.durationMinutes || 30,
        businessCategoryId: formData.businessCategoryId || undefined,
        pricingTiers: tiers.length > 0 ? tiers : undefined,
      });
    },
    onSuccess: () => {
      success(t('success'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      router.push('/business/dashboard?tab=services');
    },
    onError: (err: Error) => {
      showError(err.message || t('error'));
    },
  });

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2: {
        const priceOk =
          formData.priceMode !== 'FIXED' ||
          (formData.priceCents !== null && formData.priceCents >= 0);
        return (
          priceOk &&
          formData.durationMinutes !== null &&
          formData.durationMinutes > 0 &&
          !tiersHaveDuplicates(formData.pricingTiers)
        );
      }
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 3 && canProceed()) setStep((s) => (s + 1) as Step);
  };
  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };
  const handleSubmit = () => createMutation.mutate();

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text={tc('loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('loginRequired')}</h1>
        <p className="text-muted-foreground mb-4">{t('loginRequiredDesc')}</p>
        <Link href="/auth/login">
          <Button>{t('loginButton')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/business/dashboard">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step >= s.number ? 'var(--primary)' : 'var(--muted)',
                    color:
                      step >= s.number ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {step > s.number ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </motion.div>
                <span className="text-xs mt-2 font-medium hidden sm:block">
                  {t(s.key)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step > s.number ? 'var(--primary)' : 'var(--border)',
                  }}
                  className="h-0.5 w-12 sm:w-24 mx-2"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <StepInfo
                formData={formData}
                categories={business?.categories || []}
                categoriesLoading={businessLoading}
                onChange={updateForm}
              />
            )}
            {step === 2 && (
              <StepPricing
                priceMode={formData.priceMode}
                priceCents={formData.priceCents}
                durationMinutes={formData.durationMinutes}
                pricingTiers={formData.pricingTiers}
                onChange={updateForm}
              />
            )}
            {step === 3 && (
              <StepRecap formData={formData} categories={business?.categories || []} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2 rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
          {tc('back')}
        </Button>

        {step < 3 ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2 rounded-full">
            {tc('next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createMutation.isPending}
            isLoading={createMutation.isPending}
            className="rounded-full"
          >
            <Check className="w-4 h-4 mr-2" />
            {t('save')}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// STEP 1 — Infos & Category
// ============================================
function StepInfo({
  formData,
  categories,
  categoriesLoading,
  onChange,
}: {
  formData: FormData;
  categories: BusinessCategory[];
  categoriesLoading: boolean;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const t = useTranslations('serviceForm');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('infoTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('infoSubtitle')}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('category')}</label>
        {categoriesLoading ? (
          <p className="text-sm text-muted-foreground">...</p>
        ) : (
          <select
            value={formData.businessCategoryId ?? ''}
            onChange={(e) => onChange({ businessCategoryId: e.target.value || null })}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="">{t('noCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {!categoriesLoading && categories.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">{t('noCategoriesHint')}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('name')} *</label>
        <Input
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('namePlaceholder')}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">{t('nameMinChars')}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('shortDescription')}</label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t('shortDescriptionPlaceholder')}
          maxLength={500}
          rows={2}
          className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('detailedDescription')}</label>
        <p className="text-xs text-muted-foreground mb-2">{t('detailedDescriptionHint')}</p>
        <RichTextEditor
          value={formData.detailedDescription}
          onChange={(value) => onChange({ detailedDescription: value })}
          placeholder={t('detailedDescriptionPlaceholder')}
          minHeight="150px"
        />
      </div>
    </div>
  );
}

// ============================================
// STEP 2 — Pricing & Duration
// ============================================
function StepPricing({
  priceMode,
  priceCents,
  durationMinutes,
  pricingTiers,
  onChange,
}: {
  priceMode: ServicePriceMode;
  priceCents: number | null;
  durationMinutes: number | null;
  pricingTiers: PricingTierDraft[];
  onChange: (updates: Partial<FormData>) => void;
}) {
  const t = useTranslations('serviceForm');
  const durationOptions = [15, 30, 45, 60, 90, 120];
  const isFixed = priceMode === 'FIXED';

  const modes: { value: ServicePriceMode; labelKey: string; hintKey: string }[] = [
    { value: 'FIXED', labelKey: 'priceModeFixed', hintKey: 'priceModeFixedHint' },
    { value: 'QUOTE', labelKey: 'priceModeQuote', hintKey: 'priceModeQuoteHint' },
    { value: 'FREE', labelKey: 'priceModeFree', hintKey: 'priceModeFreeHint' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Euro className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('pricingTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('pricingSubtitle')}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('priceMode')}</label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ priceMode: m.value })}
              className={`p-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                priceMode === m.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {t(m.labelKey)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t(modes.find((m) => m.value === priceMode)!.hintKey)}
        </p>
      </div>

      {isFixed && (
        <div>
          <label className="text-sm font-medium mb-2 block">{t('price')} *</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={priceCents !== null ? priceCents / 100 : ''}
              onChange={(e) =>
                onChange({
                  priceCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null,
                })
              }
              placeholder={t('pricePlaceholder')}
              min={0}
              step={0.5}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-3 block">
          <Clock className="w-4 h-4 inline mr-1" />
          {t('duration')} *
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {durationOptions.map((duration) => (
            <motion.button
              key={duration}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ durationMinutes: duration })}
              className={`p-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                durationMinutes === duration
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {duration >= 60 ? `${duration / 60}h` : `${duration}min`}
            </motion.button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground mb-1 block">{t('customDuration')}</label>
          <Input
            type="number"
            value={durationMinutes || ''}
            onChange={(e) =>
              onChange({ durationMinutes: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder={t('durationPlaceholder')}
            min={5}
            max={480}
          />
        </div>
      </div>

      {isFixed && (
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-3">{t('pricingTiersTitle')}</h3>
          <PricingTiersEditor
            basePriceCents={priceCents}
            tiers={pricingTiers}
            onChange={(next) => onChange({ pricingTiers: next })}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 3 — Recap
// ============================================
function StepRecap({
  formData,
  categories,
}: {
  formData: FormData;
  categories: BusinessCategory[];
}) {
  const t = useTranslations('serviceForm');

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.businessCategoryId) ?? null,
    [categories, formData.businessCategoryId],
  );

  // Options are inherited from the category; shown read-only here for transparency.
  const inheritedOptions = selectedCategory?.options ?? [];

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('recapTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('recapSubtitle')}</p>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border">
        <RecapRow label={t('name')} value={formData.name} />
        {formData.description && (
          <RecapRow label={t('shortDescription')} value={formData.description} />
        )}
        <RecapRow
          label={t('recapCategory')}
          value={selectedCategory?.name ?? t('recapNoCategory')}
        />
        <RecapRow
          label={t('price')}
          value={
            formData.priceMode === 'FIXED'
              ? `${((formData.priceCents ?? 0) / 100).toFixed(2)} €`
              : t(
                  formData.priceMode === 'QUOTE'
                    ? 'priceModeQuote'
                    : 'priceModeFree',
                )
          }
        />
        <RecapRow
          label={t('duration')}
          value={`${formData.durationMinutes ?? 0} min`}
        />

        {formData.priceMode === 'FIXED' && tiersToPayload(formData.pricingTiers).length > 0 && (
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {t('recapPricingTiers')}
            </p>
            <ul className="space-y-1.5">
              {tiersToPayload(formData.pricingTiers)
                .sort((a, b) => a.thresholdWeeks - b.thresholdWeeks)
                .map((tier, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>
                      {t('tierPreview', {
                        weeks: tier.thresholdWeeks,
                        total: (
                          ((formData.priceCents ?? 0) + tier.surchargeCents) /
                          100
                        ).toFixed(2),
                      })}
                    </span>
                    <span className="text-primary font-medium">
                      +{(tier.surchargeCents / 100).toFixed(2)} €
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {selectedCategory && (
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {t('options')}
            </p>
            {inheritedOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('recapNoOptions')}</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{t('inheritedFromCategory')}</p>
                <ul className="space-y-1.5">
                  {inheritedOptions.map((opt) => (
                    <li
                      key={opt.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                        {opt.name}
                        {opt.groupName && (
                          <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                            {opt.groupName}
                          </span>
                        )}
                      </span>
                      <span className="text-primary font-medium">
                        +{(opt.priceCents / 100).toFixed(2)} €
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
