'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Check,
  Heart,
  Instagram,
  Loader2,
  Mail,
  Phone,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';
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

  const total = data?.length ?? 0;
  const totalPending = (data ?? []).reduce((sum, r) => sum + r.pendingCount, 0);

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500" />
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {total} {total > 1 ? 'salons' : 'salon'} · {totalPending} en attente
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader text="Chargement..." />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-20 text-gray-400">{t('empty')}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">
                    {t('columnBusiness')}
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 hidden sm:table-cell">
                    {t('columnTotal')}
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">
                    {t('columnPending')}
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">
                    {t('columnValidated')}
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 hidden md:table-cell">
                    {t('columnFreeMonths')}
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600 hidden lg:table-cell">
                    {t('columnLast')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <BusinessRow
                    key={row.businessId}
                    row={row}
                    onSelect={onSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
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
    <tr
      onClick={() => onSelect(row.businessId)}
      className="hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{row.businessName}</p>
            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {row.ownerEmail || '—'}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4 text-center hidden sm:table-cell">
        <span className="text-gray-900 font-medium">{row.totalReferrals}</span>
      </td>
      <td className="p-4 text-center">
        {row.pendingCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
            {row.pendingCount}
          </span>
        ) : (
          <span className="text-gray-300">0</span>
        )}
      </td>
      <td className="p-4 text-center">
        {row.validatedCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            {row.validatedCount}
          </span>
        ) : (
          <span className="text-gray-300">0</span>
        )}
      </td>
      <td className="p-4 text-center hidden md:table-cell">
        <span className="inline-flex items-center gap-1 text-gray-900 font-medium">
          <Trophy className="w-4 h-4 text-amber-500" />
          {row.freeMonthsEarned}
        </span>
      </td>
      <td className="p-4 text-right hidden lg:table-cell">
        <span className="text-sm text-gray-500">
          {new Date(row.lastSubmittedAt).toLocaleDateString()}
        </span>
      </td>
    </tr>
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
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('detailBack')}
        </button>

        {isLoading || !data ? (
          <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
        ) : (
          <>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {t('detailTitle', { name: data.business.name })}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {data.business.owner.email}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                {data.business.freeMonthsEarned} {t('columnFreeMonths').toLowerCase()}
              </span>
            </div>
          </>
        )}
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader text="Chargement..." />
        </div>
      ) : !data || data.referrals.length === 0 ? (
        <div className="text-center py-20 text-gray-400">{t('empty')}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">
                    {t('firstName')} / {t('lastName')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden md:table-cell">
                    {t('instagram')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden lg:table-cell">
                    {t('phone')}
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">
                    {t('status')}
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600 hidden sm:table-cell">
                    {t('submittedAt')}
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.referrals.map((r) => (
                  <ReferralRow
                    key={r.id}
                    referral={r}
                    onValidate={() => validateMutation.mutate(r.id)}
                    onReject={() => handleReject(r.id)}
                    isValidating={
                      validateMutation.isPending &&
                      validateMutation.variables === r.id
                    }
                    isRejecting={
                      rejectMutation.isPending &&
                      rejectMutation.variables?.id === r.id
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ReferralRow({
  referral,
  onValidate,
  onReject,
  isValidating,
  isRejecting,
}: {
  referral: Referral;
  onValidate: () => void;
  onReject: () => void;
  isValidating: boolean;
  isRejecting: boolean;
}) {
  const t = useTranslations('admin.referrals');
  const statusKey = (
    referral.status === 'PENDING'
      ? 'statusPending'
      : referral.status === 'VALIDATED'
        ? 'statusValidated'
        : 'statusRejected'
  ) as 'statusPending' | 'statusValidated' | 'statusRejected';
  const isPending = isValidating || isRejecting;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">
            {referral.firstName} {referral.lastName}
          </span>
          {referral.rewardGrantedAt && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
              <Trophy className="w-3 h-3" />
              Récompensé
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 md:hidden">
          <a
            href={`https://instagram.com/${referral.instagram}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-primary"
          >
            <Instagram className="w-3 h-3" />@{referral.instagram}
          </a>
          <a
            href={`tel:${referral.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-primary"
          >
            <Phone className="w-3 h-3" />
            {referral.phone}
          </a>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <a
          href={`https://instagram.com/${referral.instagram}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-gray-700 hover:text-primary inline-flex items-center gap-1"
        >
          <Instagram className="w-4 h-4 text-gray-400" />@{referral.instagram}
        </a>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <a
          href={`tel:${referral.phone}`}
          className="text-sm text-gray-700 hover:text-primary inline-flex items-center gap-1"
        >
          <Phone className="w-4 h-4 text-gray-400" />
          {referral.phone}
        </a>
      </td>
      <td className="p-4 text-center">
        <span
          className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${statusBadgeClass[referral.status]}`}
        >
          {t(statusKey)}
        </span>
      </td>
      <td className="p-4 text-right text-sm text-gray-500 hidden sm:table-cell whitespace-nowrap">
        {new Date(referral.createdAt).toLocaleDateString()}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-1">
          {referral.status === 'PENDING' ? (
            <>
              <button
                onClick={onValidate}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title={t('validate')}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onReject}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title={t('reject')}
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}
