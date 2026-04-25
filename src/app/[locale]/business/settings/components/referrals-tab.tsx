'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Clock,
  Gift,
  Heart,
  Instagram,
  Loader2,
  Mail,
  Phone,
  Send,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import type { Referral, ReferralStatus } from '@/types';

const statusBadgeClass: Record<ReferralStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VALIDATED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const statusIcon: Record<ReferralStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  VALIDATED: Check,
  REJECTED: XCircle,
};

export function ReferralsTab() {
  const t = useTranslations('referrals');
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: () => api.getMyReferrals(),
  });

  const referrals = data?.data ?? [];
  const freeMonthsEarned = data?.freeMonthsEarned ?? 0;
  const validatedTowardNext = data?.validatedTowardNext ?? 0;

  let progressMessage = t('progressZero');
  if (validatedTowardNext === 1) progressMessage = t('progressOneMore');
  else if (validatedTowardNext === 0 && referrals.length > 0)
    progressMessage = t('progressReady');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* How it works */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t('howItWorksTitle')}
        </h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">1.</span>
            {t('howItWorksStep1')}
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">2.</span>
            {t('howItWorksStep2')}
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">3.</span>
            {t('howItWorksStep3')}
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">4.</span>
            {t('howItWorksStep4')}
          </li>
        </ol>
      </div>

      {/* Progression + reward */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            {t('progressTitle')}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            {[0, 1].map((i) => {
              const filled = i < validatedTowardNext;
              return (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    filled ? 'bg-emerald-500' : 'bg-muted'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">{progressMessage}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {t('freeMonthsLabel')}
          </h3>
          <div className="text-3xl font-bold">{freeMonthsEarned}</div>
        </div>
      </div>

      {/* Submit button */}
      <Button
        onClick={() => setModalOpen(true)}
        className="rounded-full"
      >
        <Send className="w-4 h-4 mr-2" />
        {t('submitButton')}
      </Button>

      {/* History */}
      <div>
        <h3 className="font-semibold mb-3">{t('historyTitle')}</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <ReferralRow key={r.id} referral={r} />
            ))}
          </div>
        )}
      </div>

      <ReferralModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
          success(t('submittedToast'));
        }}
        onRateLimit={() => showError(t('rateLimitToast'))}
        onError={() => showError(t('errorToast'))}
      />
    </div>
  );
}

function ReferralRow({ referral }: { referral: Referral }) {
  const t = useTranslations('referrals');
  const Icon = statusIcon[referral.status];
  const statusKey = (
    referral.status === 'PENDING'
      ? 'statusPending'
      : referral.status === 'VALIDATED'
        ? 'statusValidated'
        : 'statusRejected'
  ) as 'statusPending' | 'statusValidated' | 'statusRejected';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface border border-border rounded-xl">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">
            {referral.firstName} {referral.lastName}
          </span>
          <Badge className={statusBadgeClass[referral.status]}>
            <Icon className="w-3 h-3 mr-1" />
            {t(statusKey)}
          </Badge>
          {referral.rewardGrantedAt && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Gift className="w-3 h-3 mr-1" />
              {t('rewardedBadge')}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Instagram className="w-3 h-3" />@{referral.instagram}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {referral.phone}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {t('submittedAt')}{' '}
        {new Date(referral.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}

function ReferralModal({
  open,
  onClose,
  onSuccess,
  onRateLimit,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRateLimit: () => void;
  onError: () => void;
}) {
  const t = useTranslations('referrals');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [phone, setPhone] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.createReferral({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        instagram: instagram.trim().replace(/^@+/, ''),
        phone: phone.trim(),
      }),
    onSuccess: () => {
      setFirstName('');
      setLastName('');
      setInstagram('');
      setPhone('');
      onSuccess();
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 429) onRateLimit();
      else onError();
    },
  });

  if (!open) return null;

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    instagram.trim().length > 0 &&
    phone.trim().length > 0 &&
    !mutation.isPending;

  const handleClose = () => {
    if (mutation.isPending) return;
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
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{t('modalTitle')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('modalSubtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) mutation.mutate();
            }}
            className="p-5 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t('firstName')}
                value={firstName}
                onChange={setFirstName}
                autoFocus
              />
              <Field
                label={t('lastName')}
                value={lastName}
                onChange={setLastName}
              />
            </div>
            <Field
              label={t('instagram')}
              value={instagram}
              onChange={setInstagram}
              icon={<Instagram className="w-4 h-4 text-muted-foreground" />}
              prefix="@"
              placeholder="pseudo"
            />
            <Field
              label={t('phone')}
              value={phone}
              onChange={setPhone}
              icon={<Phone className="w-4 h-4 text-muted-foreground" />}
              placeholder="+33 6 12 34 56 78"
              type="tel"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-full"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="rounded-full"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                {t('send')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  prefix,
  placeholder,
  type = 'text',
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  prefix?: string;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        )}
        {prefix && !icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`w-full ${icon || prefix ? 'pl-9' : 'px-3'} pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
        />
      </div>
    </div>
  );
}
