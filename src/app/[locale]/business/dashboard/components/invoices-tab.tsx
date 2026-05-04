'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  FileStack,
  Plus,
  Loader2,
  Trash2,
  Search,
  X,
  Filter,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { Invoice, InvoiceStatus } from '@/types';
import { InvoiceEditor } from './invoice-editor';
import { BatchInvoiceModal } from './batch-invoice-modal';
import { BatchHistory } from './batch-history';
import { SendInvoiceButton } from './send-invoice-button';
import { MaskedAmount } from '@/contexts/amounts-visibility-context';

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

type InvoicesView = 'list' | 'editor';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type InvoicesSubTab = 'invoices' | 'batches';

export function InvoicesTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [view, setView] = useState<InvoicesView>('list');
  const [subTab, setSubTab] = useState<InvoicesSubTab>('invoices');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [monthFilterOpen, setMonthFilterOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const monthFilterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Close filter dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (monthFilterRef.current && !monthFilterRef.current.contains(e.target as Node)) {
        setMonthFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (invoiceId: string) => api.deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success('Facture supprimée');
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, debouncedSearch],
    queryFn: () =>
      api.getInvoices(
        statusFilter || undefined,
        debouncedSearch || undefined,
        50,
        0,
      ),
  });

  const allInvoices = data?.data ?? [];

  // Available months from invoice data
  const availableMonths = useMemo(() => {
    const months = new Map<string, string>();
    for (const inv of allInvoices) {
      const date = new Date(inv.issueDate || inv.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!months.has(key)) {
        const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        months.set(key, label.charAt(0).toUpperCase() + label.slice(1));
      }
    }
    return Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allInvoices]);

  // Filter invoices by selected month
  const invoices = useMemo(() => {
    if (!monthFilter) return allInvoices;
    return allInvoices.filter((inv) => {
      const date = new Date(inv.issueDate || inv.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      return key === monthFilter;
    });
  }, [allInvoices, monthFilter]);

  const filterLabel =
    statusFilter === ''
      ? 'Toutes'
      : statusLabels[statusFilter as InvoiceStatus];

  const monthLabel = monthFilter
    ? availableMonths.find(([k]) => k === monthFilter)?.[1] || ''
    : 'Tous les mois';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">Factures</h2>
        <div className="flex items-center gap-2">
          {subTab === 'batches' && (
            <Button
              variant="outline"
              onClick={() => setBatchOpen(true)}
              className="rounded-full"
            >
              <FileStack className="w-4 h-4 mr-2" />
              Facturation groupée
            </Button>
          )}
          {subTab === 'invoices' && (
            <Button
              onClick={() => {
                setSelectedInvoiceId(null);
                setView('editor');
              }}
              className="rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle facture
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setSubTab('invoices')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer ${
            subTab === 'invoices'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Factures
          {subTab === 'invoices' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSubTab('batches')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer ${
            subTab === 'batches'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileStack className="w-4 h-4 inline mr-2" />
          Générations
          {subTab === 'batches' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {subTab === 'batches' && (
        <>
          <BatchHistory />
          <BatchInvoiceModal
            isOpen={batchOpen}
            onClose={() => setBatchOpen(false)}
          />
        </>
      )}

      {subTab === 'invoices' && (<>
      {/* Search + Filter row */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par client ou n° facture…"
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              statusFilter
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filterLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-surface border border-border rounded-lg shadow-lg z-20 py-1">
              {[
                { value: '', label: 'Toutes' },
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'FINALIZED', label: 'Finalisée' },
                { value: 'CANCELLED', label: 'Annulée' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                    statusFilter === opt.value
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Month filter dropdown */}
        <div className="relative" ref={monthFilterRef}>
          <button
            onClick={() => setMonthFilterOpen(!monthFilterOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              monthFilter
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {monthLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${monthFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {monthFilterOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-surface border border-border rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setMonthFilter('');
                  setMonthFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                  monthFilter === ''
                    ? 'bg-primary/10 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                Tous les mois
              </button>
              {availableMonths.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setMonthFilter(key);
                    setMonthFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                    monthFilter === key
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
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
            {debouncedSearch
              ? 'Aucune facture trouvée pour cette recherche'
              : statusFilter
                ? 'Aucune facture avec ce statut'
                : 'Aucune facture pour le moment'}
          </p>
          {!debouncedSearch && !statusFilter && (
            <Button
              onClick={() => {
                setSelectedInvoiceId(null);
                setView('editor');
              }}
              className="rounded-full mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une facture
            </Button>
          )}
        </div>
      ) : (
        <>
          {(() => {
            // Group invoices by month
            const groups: { key: string; label: string; invoices: Invoice[] }[] = [];
            let currentKey = '';

            for (const invoice of invoices) {
              const date = new Date(invoice.issueDate || invoice.createdAt);
              const key = `${date.getFullYear()}-${date.getMonth()}`;
              const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

              if (key !== currentKey) {
                currentKey = key;
                groups.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), invoices: [] });
              }
              groups[groups.length - 1].invoices.push(invoice);
            }

            return groups.map((group) => (
              <div key={group.key} className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
                  {group.label}
                </h3>
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="hidden md:grid md:grid-cols-[1fr_150px_120px_120px_140px] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Numéro / Client</span>
                    <span>Date</span>
                    <span className="text-right">Total TTC</span>
                    <span className="text-center">Statut</span>
                    <span className="text-right">Envoyer au client</span>
                  </div>

                  {group.invoices.map((invoice: Invoice, idx: number) => (
                    <div
                      key={invoice.id}
                      onClick={() => {
                        setSelectedInvoiceId(invoice.id);
                        setView('editor');
                      }}
                      className={`w-full text-left cursor-pointer hover:bg-muted/30 transition-colors ${
                        idx < group.invoices.length - 1 ? 'border-b border-border' : ''
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
                            {invoice.status === 'DRAFT' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Supprimer ce brouillon ?')) {
                                    deleteMutation.mutate(invoice.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {invoice.status === 'FINALIZED' && invoice.pdfKey && (
                              <SendInvoiceButton
                                invoiceId={invoice.id}
                                emailSentAt={invoice.emailSentAt}
                                clientEmail={invoice.client?.email}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{invoice.client?.name || 'Sans client'}</span>
                          <span className="font-semibold text-foreground">
                            <MaskedAmount value={formatPrice(invoice.totalTTCCents)} />
                          </span>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden md:grid md:grid-cols-[1fr_150px_120px_120px_140px] gap-4 items-center px-4 py-3">
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
                          <MaskedAmount value={formatPrice(invoice.totalTTCCents)} />
                        </span>
                        <div className="flex justify-center">
                          <Badge className={statusColors[invoice.status]}>
                            {statusLabels[invoice.status]}
                          </Badge>
                        </div>
                        <div className="flex justify-end items-center gap-1">
                          {invoice.status === 'DRAFT' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Supprimer ce brouillon ?')) {
                                  deleteMutation.mutate(invoice.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : invoice.status === 'FINALIZED' && invoice.pdfKey ? (
                            <SendInvoiceButton
                              invoiceId={invoice.id}
                              emailSentAt={invoice.emailSentAt}
                              clientEmail={invoice.client?.email}
                              variant="label"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </>
      )}

      </>)}
    </div>
  );
}
