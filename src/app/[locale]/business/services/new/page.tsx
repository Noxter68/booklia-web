'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Category, BusinessCategory } from '@/types';
import { useTranslations } from 'next-intl';

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  description: string;
  detailedDescription: string;
  priceCents: number | null;
  durationMinutes: number | null;
  businessCategoryId: string | null;
}

const steps = [
  { number: 1, titleKey: 'stepInfo' as const, icon: FileText },
  { number: 2, titleKey: 'stepPricing' as const, icon: Euro },
  { number: 3, titleKey: 'stepCategory' as const, icon: Scissors },
];

export default function NewBusinessServicePage() {
  const router = useRouter();
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
    priceCents: null,
    durationMinutes: null,
    businessCategoryId: null,
  });

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createBusinessService({
        name: formData.name,
        description: formData.description || undefined,
        detailedDescription: formData.detailedDescription || undefined,
        priceCents: formData.priceCents || 0,
        durationMinutes: formData.durationMinutes || 30,
        businessCategoryId: formData.businessCategoryId || undefined,
      }),
    onSuccess: () => {
      success(t('success'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      router.push('/business/dashboard');
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
      case 2:
        return formData.priceCents !== null && formData.priceCents >= 0 && formData.durationMinutes !== null && formData.durationMinutes > 0;
      case 3:
        return true; // Categorie optionnelle
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 3 && canProceed()) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

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
        <p className="text-muted-foreground mb-4">
          {t('loginRequiredDesc')}
        </p>
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
          <p className="text-muted-foreground text-sm">
            {t('subtitle')}
          </p>
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
                    color: step >= s.number ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {step > s.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </motion.div>
                <span className="text-xs mt-2 font-medium hidden sm:block">
                  {s.titleKey === 'stepInfo' ? t('name') : s.titleKey === 'stepPricing' ? t('price') : t('category')}
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
                name={formData.name}
                description={formData.description}
                detailedDescription={formData.detailedDescription}
                onChange={(updates) => updateForm(updates)}
              />
            )}
            {step === 2 && (
              <StepPricing
                priceCents={formData.priceCents}
                durationMinutes={formData.durationMinutes}
                onChange={(updates) => updateForm(updates)}
              />
            )}
            {step === 3 && (
              <StepCategory
                categories={business?.categories || []}
                loading={businessLoading}
                selectedId={formData.businessCategoryId}
                onChange={(businessCategoryId) => updateForm({ businessCategoryId })}
              />
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

// Step 1: Basic Info
function StepInfo({
  name,
  description,
  detailedDescription,
  onChange,
}: {
  name: string;
  description: string;
  detailedDescription: string;
  onChange: (updates: { name?: string; description?: string; detailedDescription?: string }) => void;
}) {
  const t = useTranslations('serviceForm');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('infoTitle')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('infoSubtitle')}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {t('name')} *
        </label>
        <Input
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('namePlaceholder')}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('nameMinChars')}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {t('shortDescription')}
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t('shortDescriptionPlaceholder')}
          maxLength={500}
          rows={2}
          className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {t('detailedDescription')}
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          {t('detailedDescriptionHint')}
        </p>
        <RichTextEditor
          value={detailedDescription}
          onChange={(value) => onChange({ detailedDescription: value })}
          placeholder={t('detailedDescriptionPlaceholder')}
          minHeight="150px"
        />
      </div>
    </div>
  );
}

// Step 2: Pricing & Duration
function StepPricing({
  priceCents,
  durationMinutes,
  onChange,
}: {
  priceCents: number | null;
  durationMinutes: number | null;
  onChange: (updates: { priceCents?: number | null; durationMinutes?: number | null }) => void;
}) {
  const t = useTranslations('serviceForm');
  const durationOptions = [15, 30, 45, 60, 90, 120];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Euro className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('pricingTitle')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('pricingSubtitle')}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {t('price')} *
        </label>
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
          <label className="text-xs text-muted-foreground mb-1 block">
            {t('customDuration')}
          </label>
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
    </div>
  );
}

// Step 3: Category Selection
function StepCategory({
  categories,
  loading,
  selectedId,
  onChange,
}: {
  categories: BusinessCategory[];
  loading: boolean;
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useTranslations('serviceForm');
  const tc = useTranslations('common');

  if (loading) {
    return <PageLoader text={tc('loading')} />;
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('category')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('categoryOptional')}
        </p>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {/* Option: No category */}
        <motion.button
          onClick={() => onChange(null)}
          className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            selectedId === null
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <span className="font-medium text-muted-foreground">{t('noCategory')}</span>
        </motion.button>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noCategoriesHint')}
          </p>
        ) : (
          categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => onChange(category.id)}
              className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedId === category.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="font-medium">{category.name}</span>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
