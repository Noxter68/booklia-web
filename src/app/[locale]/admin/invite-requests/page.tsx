'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Inbox, Loader2, Mail, Phone, Trash2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

export default function AdminInviteRequestsPage() {
  const t = useTranslations('admin.inviteRequests');
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-invite-requests'],
    queryFn: () => api.adminListInviteRequests(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteInviteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invite-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-invite-requests-pending-count'],
      });
      success(t('deletedToast'));
    },
    onError: () => showError(t('errorToast')),
  });

  const total = data?.length ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-7 h-7 text-rose-500" />
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {total} {total > 1 ? 'demandes' : 'demande'} · {t('subtitle')}
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
                    {t('columnName')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden md:table-cell">
                    {t('columnEmail')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 hidden lg:table-cell">
                    {t('columnPhone')}
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600 hidden sm:table-cell">
                    {t('columnDate')}
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {req.firstName} {req.lastName}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 md:hidden">
                            <a
                              href={`mailto:${req.email}`}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Mail className="w-3 h-3" />
                              {req.email}
                            </a>
                            <a
                              href={`tel:${req.phone}`}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Phone className="w-3 h-3" />
                              {req.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <a
                        href={`mailto:${req.email}`}
                        className="text-sm text-gray-700 hover:text-primary inline-flex items-center gap-1.5"
                      >
                        <Mail className="w-4 h-4 text-gray-400" />
                        {req.email}
                      </a>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <a
                        href={`tel:${req.phone}`}
                        className="text-sm text-gray-700 hover:text-primary inline-flex items-center gap-1.5"
                      >
                        <Phone className="w-4 h-4 text-gray-400" />
                        {req.phone}
                      </a>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            if (window.confirm(t('deleteConfirm'))) {
                              deleteMutation.mutate(req.id);
                            }
                          }}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === req.id
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title={t('delete')}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
