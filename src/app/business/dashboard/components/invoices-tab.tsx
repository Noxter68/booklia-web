'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Loader2,
  Download,
  Settings,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { Invoice, InvoiceStatus } from '@/types';
import { InvoiceEditor } from './invoice-editor';
import { BillingSettingsTab } from './billing-settings-tab';

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  FINALIZED: 'Finalisée',
  CANCELLED: 'Annulée',
};

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  FINALIZED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

type InvoicesView = 'list' | 'editor' | 'settings';

export function InvoicesTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [view, setView] = useState<InvoicesView>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const deleteMutation = useMutation({
    mutationFn: (invoiceId: string) => api.deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success('Facture supprimée');
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => api.getInvoices(statusFilter || undefined, 50, 0),
  });

  const invoices = data?.data ?? [];

  if (view === 'settings') {
    return (
      <div>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('list')}
            className="rounded-full text-xs"
          >
            ← Retour aux factures
          </Button>
        </div>
        <BillingSettingsTab />
      </div>
    );
  }

  if (view === 'editor') {
    return (
      <InvoiceEditor
        invoiceId={selectedInvoiceId}
        businessId={businessId}
        onBack={() => {
          setView('list');
          setSelectedInvoiceId(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">Factures</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('settings')}
            className="rounded-full text-xs"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Paramètres
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedInvoiceId(null);
              setView('editor');
            }}
            className="rounded-full text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="overflow-x-auto -mx-4 px-4 mb-6 scrollbar-none">
        <div className="flex p-1 bg-muted/50 rounded-lg w-fit">
          {['', 'DRAFT', 'FINALIZED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === '' ? 'Toutes' : statusLabels[s as InvoiceStatus]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {statusFilter ? 'Aucune facture avec ce statut' : 'Aucune facture pour le moment'}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSelectedInvoiceId(null);
              setView('editor');
            }}
            className="rounded-full mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une facture
          </Button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_150px_120px_120px_100px] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Numéro / Client</span>
            <span>Date</span>
            <span className="text-right">Total TTC</span>
            <span className="text-center">Statut</span>
            <span />
          </div>

          {invoices.map((invoice: Invoice, idx: number) => (
            <div
              key={invoice.id}
              onClick={() => {
                setSelectedInvoiceId(invoice.id);
                setView('editor');
              }}
              className={`w-full text-left cursor-pointer hover:bg-muted/30 transition-colors ${
                idx < invoices.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              {/* Mobile */}
              <div className="md:hidden p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {invoice.invoiceNumber || 'Brouillon'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[invoice.status]}>
                      {statusLabels[invoice.status]}
                    </Badge>
                    {invoice.status === 'CANCELLED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer cette facture annulée ?')) {
                            deleteMutation.mutate(invoice.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{invoice.client?.name || 'Sans client'}</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(invoice.totalTTCCents)}
                  </span>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-[1fr_150px_120px_120px_100px] gap-4 items-center px-4 py-3">
                <div>
                  <p className="font-medium text-sm">
                    {invoice.invoiceNumber || 'Brouillon'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.client?.name || 'Sans client'}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {invoice.issueDate
                    ? new Date(invoice.issueDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : new Date(invoice.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                </span>
                <span className="text-sm font-semibold text-right">
                  {formatPrice(invoice.totalTTCCents)}
                </span>
                <div className="flex justify-center">
                  <Badge className={statusColors[invoice.status]}>
                    {statusLabels[invoice.status]}
                  </Badge>
                </div>
                <div className="flex justify-end">
                  {invoice.status === 'CANCELLED' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer cette facture annulée ?')) {
                          deleteMutation.mutate(invoice.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : invoice.pdfKey ? (
                    <Download className="w-4 h-4 text-muted-foreground" />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
