'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Clock,
  Heart,
  Instagram,
  Loader2,
  Phone,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type {
  AdminReferralBusinessRow,
  Referral,
  ReferralStatus,
} from '@/types';

const statusBadgeClass: Record<ReferralStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  VALIDATED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-gray-100 text-gray-700',
};

export default function AdminReferralsPage() {
  const t = useTranslations('admin.referrals');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  if (selectedBusinessId) {
    return (
      <BusinessDetail
        businessId={selectedBusinessId}
        onBack={() => setSelectedBusinessId(null)}
      />
    );
  }

  return <BusinessList onSelect={setSelectedBusinessId} />;
}

function BusinessList({ onSelect }: { onSelect: (id: string) => void }) {
  const t = useTranslations('admin.referrals');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: () => api.adminListReferralsByBusiness(),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500" />
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white rounded-xl p-8 text-center border border-gray-200">
          {t('empty')}
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-[1.5fr_80px_100px_100px_120px_140px] gap-4 px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <span>{t('columnBusiness')}</span>
            <span className="text-center">{t('columnTotal')}</span>
            <span className="text-center">{t('columnPending')}</span>
            <span className="text-center">{t('columnValidated')}</span>
            <span className="text-center">{t('columnFreeMonths')}</span>
            <span>{t('columnLast')}</span>
          </div>
          {data.map((row) => (
            <BusinessRow key={row.businessId} row={row} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessRow({
  row,
  onSelect,
}: {
  row: AdminReferralBusinessRow;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(row.businessId)}
      className="w-full text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
    >
      <div className="md:hidden p-4">
        <div className="font-medium text-sm mb-1">{row.businessName}</div>
        <div className="text-xs text-gray-500 mb-2">{row.ownerEmail}</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            {row.pendingCount} pending
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            {row.validatedCount} validés
          </span>
          <span className="ml-auto font-semibold flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" />
            {row.freeMonthsEarned}
          </span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[1.5fr_80px_100px_100px_120px_140px] gap-4 px-4 py-3 items-center">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{row.businessName}</p>
          <p className="text-xs text-gray-500 truncate">{row.ownerEmail}</p>
        </div>
        <span className="text-center text-sm">{row.totalReferrals}</span>
        <span className="text-center text-sm text-amber-700">
          {row.pendingCount}
        </span>
        <span className="text-center text-sm text-emerald-700">
          {row.validatedCount}
        </span>
        <span className="text-center text-sm font-semibold flex items-center justify-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          {row.freeMonthsEarned}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(row.lastSubmittedAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}

function BusinessDetail({
  businessId,
  onBack,
}: {
  businessId: string;
  onBack: () => void;
}) {
  const t = useTranslations('admin.referrals');
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-referrals-business', businessId],
    queryFn: () => api.adminGetReferralsForBusiness(businessId),
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => api.adminValidateReferral(id),
    onSuccess: (referral) => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-referrals-business', businessId],
      });
      // If reward was just granted, the freeMonthsEarned will increment in the
      // refetch — show the rewarded toast for the second of a pair.
      success(
        referral.rewardGrantedAt ? t('rewardedToast') : t('validatedToast'),
      );
    },
    onError: () => showError(t('errorToast')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.adminRejectReferral(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-referrals-business', businessId],
      });
      success(t('rejectedToast'));
    },
    onError: () => showError(t('errorToast')),
  });

  const handleReject = (referralId: string) => {
    const reason =
      typeof window !== 'undefined' ? window.prompt(t('rejectPrompt')) : null;
    if (reason === null) return;
    rejectMutation.mutate({ id: referralId, reason: reason || undefined });
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('detailBack')}
      </button>

      {isLoading || !data ? (
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white rounded animate-pulse" />
          <div className="h-32 bg-white rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {t('detailTitle', { name: data.business.name })}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <span>{data.business.owner.email}</span>
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                {data.business.freeMonthsEarned} {t('columnFreeMonths').toLowerCase()}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {data.referrals.map((r, i) => (
              <ReferralDetailRow
                key={r.id}
                referral={r}
                isLast={i === data.referrals.length - 1}
                onValidate={() => validateMutation.mutate(r.id)}
                onReject={() => handleReject(r.id)}
                isPending={
                  (validateMutation.isPending && validateMutation.variables === r.id) ||
                  (rejectMutation.isPending && rejectMutation.variables?.id === r.id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReferralDetailRow({
  referral,
  isLast,
  onValidate,
  onReject,
  isPending,
}: {
  referral: Referral;
  isLast: boolean;
  onValidate: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const t = useTranslations('admin.referrals');
  const statusKey = (
    referral.status === 'PENDING'
      ? 'statusPending'
      : referral.status === 'VALIDATED'
        ? 'statusValidated'
        : 'statusRejected'
  ) as 'statusPending' | 'statusValidated' | 'statusRejected';

  return (
    <div
      className={`p-4 ${isLast ? '' : 'border-b border-gray-100'} grid gap-3 md:grid-cols-[1fr_auto] items-start`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {referral.firstName} {referral.lastName}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadgeClass[referral.status]}`}
          >
            {t(statusKey)}
          </span>
          {referral.rewardGrantedAt && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Récompensé
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <a
            href={`https://instagram.com/${referral.instagram}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-primary"
          >
            <Instagram className="w-4 h-4" />@{referral.instagram}
          </a>
          <a
            href={`tel:${referral.phone}`}
            className="flex items-center gap-1 hover:text-primary"
          >
            <Phone className="w-4 h-4" />
            {referral.phone}
          </a>
          <span className="text-xs text-gray-500">
            {t('submittedAt')}{' '}
            {new Date(referral.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {referral.status === 'PENDING' && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onValidate}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t('validate')}
          </button>
          <button
            onClick={onReject}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            <XCircle className="w-4 h-4" />
            {t('reject')}
          </button>
        </div>
      )}
    </div>
  );
}
