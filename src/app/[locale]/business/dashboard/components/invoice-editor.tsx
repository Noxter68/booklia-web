'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Download,
  Lock,
  Check,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { Invoice, InvoiceLineKind, BusinessService } from '@/types';
import { ClientSearchSelect } from './client-search-select';
import { ServiceSearchSelect } from './service-search-select';
import { InvoicePreview } from './invoice-preview';

interface InvoiceEditorProps {
  invoiceId: string | null;
  businessId: string;
  onBack: () => void;
}

const vatRateOptions = [
  { label: '0%', value: 0 },
  { label: '5,5%', value: 5.5 },
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
];

const kindLabels: Record<InvoiceLineKind, string> = {
  SERVICE: 'Prestation',
  PRODUCT: 'Produit',
  OTHER: 'Autre',
};

export function InvoiceEditor({ invoiceId, businessId, onBack }: InvoiceEditorProps) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [currentInvoiceId, setCurrentInvoiceId] = useState(invoiceId);
  const [showPreview, setShowPreview] = useState(false);

  // Line form state
  const [newLabel, setNewLabel] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState('');
  const [newVatRate, setNewVatRate] = useState(0);
  const [newKind, setNewKind] = useState<InvoiceLineKind>('SERVICE');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', currentInvoiceId],
    queryFn: () => api.getInvoice(currentInvoiceId!),
    enabled: !!currentInvoiceId,
  });

  const { data: business } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
  });

  const { data: billingSettings } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => api.getBillingSettings(),
  });

  const services: BusinessService[] = business?.services || [];

  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    if (invoice?.clientId) {
      setSelectedClientId(invoice.clientId);
    }
  }, [invoice?.clientId]);

  // Set default VAT rate based on billing settings
  useEffect(() => {
    if (billingSettings?.vatMode === 'FRANCHISE_293B') {
      setNewVatRate(0);
    } else if (billingSettings?.vatMode === 'STANDARD') {
      setNewVatRate(20);
    }
  }, [billingSettings?.vatMode]);

  // Create invoice
  const createMutation = useMutation({
    mutationFn: (data: { clientId?: string }) => api.createInvoice(data),
    onSuccess: (data) => {
      setCurrentInvoiceId(data.id);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success('Facture créée');
    },
    onError: () => showError('Erreur lors de la création'),
  });

  // Add line
  const addLineMutation = useMutation({
    mutationFn: (data: {
      kind: InvoiceLineKind;
      label: string;
      quantity: number;
      unitPriceHTCents: number;
      vatRate: number;
    }) => api.addInvoiceLine(currentInvoiceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', currentInvoiceId] });
      setNewLabel('');
      setNewQuantity(1);
      setNewUnitPrice('');
      setNewKind('SERVICE');
    },
    onError: () => showError('Erreur lors de l\'ajout de la ligne'),
  });

  // Remove line
  const removeLineMutation = useMutation({
    mutationFn: (lineId: string) => api.removeInvoiceLine(currentInvoiceId!, lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', currentInvoiceId] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  // Finalize
  const finalizeMutation = useMutation({
    mutationFn: () => api.finalizeInvoice(currentInvoiceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', currentInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success('Facture finalisée');
    },
    onError: (err: Error) => showError(err.message || 'Erreur lors de la finalisation'),
  });

  // Cancel
  const cancelMutation = useMutation({
    mutationFn: () => api.cancelInvoice(currentInvoiceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', currentInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success('Facture annulée');
    },
    onError: () => showError('Erreur lors de l\'annulation'),
  });

  // Download PDF — direct link to avoid CORS on R2 public bucket
  const handleDownloadPdf = async () => {
    if (!currentInvoiceId) return;
    try {
      const { url } = await api.getInvoicePdfUrl(currentInvoiceId);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      showError('PDF non disponible');
    }
  };

  const handleAddLine = () => {
    const unitPriceCents = Math.round(parseFloat(newUnitPrice || '0') * 100);
    if (!newLabel.trim() || unitPriceCents <= 0) return;

    addLineMutation.mutate({
      kind: newKind,
      label: newLabel,
      quantity: newQuantity,
      unitPriceHTCents: unitPriceCents,
      vatRate: newVatRate,
    });
  };

  const handleServiceSelect = (service: BusinessService) => {
    const priceEuros = (service.priceCents / 100).toFixed(2);
    setNewLabel(service.name);
    setNewUnitPrice(priceEuros);
    setNewKind('SERVICE');
  };

  const handleCreateInvoice = () => {
    createMutation.mutate({
      clientId: selectedClientId || undefined,
    });
  };

  // No invoice yet: creation form
  if (!currentInvoiceId) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={onBack} className="rounded-full h-9 w-9 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold">Nouvelle facture</h2>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 max-w-lg">
          <div className="mb-5">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Client
            </label>
            <ClientSearchSelect
              value={selectedClientId}
              onChange={(clientId) => setSelectedClientId(clientId)}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Optionnel — vous pouvez aussi créer la facture sans client
            </p>
          </div>

          <Button
            onClick={handleCreateInvoice}
            disabled={createMutation.isPending}
            isLoading={createMutation.isPending}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer la facture
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Facture introuvable</p>
        <Button variant="outline" onClick={onBack} className="mt-4 rounded-full">
          Retour
        </Button>
      </div>
    );
  }

  const isDraft = invoice.status === 'DRAFT';
  const isFinalized = invoice.status === 'FINALIZED';

  // Preview mode
  if (showPreview) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowPreview(false)} className="rounded-full h-9 w-9 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">Aperçu de la facture</h2>
          </div>
          <div className="flex items-center gap-2">
            {isFinalized && invoice.pdfKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                className="rounded-full text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Télécharger PDF
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="rounded-full text-xs"
            >
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              Fermer l'aperçu
            </Button>
          </div>
        </div>
        <InvoicePreview invoice={invoice} billingSettings={billingSettings} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="rounded-full h-9 w-9 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {invoice.invoiceNumber || 'Brouillon'}
              {isFinalized && <Lock className="w-4 h-4 text-muted-foreground" />}
            </h2>
            <p className="text-sm text-muted-foreground">
              {invoice.client?.name || 'Sans client'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="rounded-full text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Aperçu
          </Button>
          {isFinalized && invoice.pdfKey && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="rounded-full text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Télécharger PDF
            </Button>
          )}
          {isDraft && (
            <Button
              size="sm"
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending || (invoice.lines?.length ?? 0) === 0}
              isLoading={finalizeMutation.isPending}
              className="rounded-full text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Finaliser
            </Button>
          )}
          {(isDraft || isFinalized) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="rounded-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Finalized warning */}
      {isFinalized && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-400">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Cette facture est finalisée et ne peut plus être modifiée.</span>
        </div>
      )}

      {invoice.status === 'CANCELLED' && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Cette facture a été annulée.</span>
        </div>
      )}

      {/* Lines table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Lignes de facture
          </h3>
        </div>

        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-[80px_1fr_80px_100px_80px_100px_100px_40px] gap-2 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase">
          <span>Type</span>
          <span>Désignation</span>
          <span className="text-center">Qté</span>
          <span className="text-right">PU HT</span>
          <span className="text-center">TVA</span>
          <span className="text-right">Total HT</span>
          <span className="text-right">Total TTC</span>
          <span />
        </div>

        {/* Existing lines */}
        {(invoice.lines || []).map((line) => (
          <div
            key={line.id}
            className="grid grid-cols-[80px_1fr_80px_100px_80px_100px_100px_40px] gap-2 items-center px-4 py-2.5 border-b border-border last:border-b-0"
          >
            <span className="text-xs text-muted-foreground">{kindLabels[line.kind]}</span>
            <span className="text-sm font-medium truncate">{line.label}</span>
            <span className="text-sm text-center">{line.quantity}</span>
            <span className="text-sm text-right">{formatPrice(line.unitPriceHTCents)}</span>
            <span className="text-sm text-center">{line.vatRate}%</span>
            <span className="text-sm text-right">{formatPrice(line.totalHTCents)}</span>
            <span className="text-sm font-semibold text-right">{formatPrice(line.totalTTCCents)}</span>
            <div className="flex justify-center">
              {isDraft && (
                <button
                  onClick={() => removeLineMutation.mutate(line.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {(!invoice.lines || invoice.lines.length === 0) && !isDraft && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune ligne
          </div>
        )}
      </div>

      {/* Add line section (draft only) */}
      {isDraft && (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-sm mb-4">Ajouter une ligne</h3>

          {/* Service quick-add */}
          {services.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Rechercher une prestation existante
              </label>
              <ServiceSearchSelect
                services={services}
                onSelect={handleServiceSelect}
                placeholder="Tapez pour chercher une prestation..."
              />
            </div>
          )}

          {/* Manual form */}
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as InvoiceLineKind)}
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="SERVICE">Prestation</option>
                <option value="PRODUCT">Produit</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Désignation</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom de la prestation ou du produit"
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantité</label>
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix unitaire HT (€)</label>
              <input
                type="number"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">TVA</label>
              <select
                value={newVatRate}
                onChange={(e) => setNewVatRate(parseFloat(e.target.value))}
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {vatRateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Total HT</label>
              <div className="text-sm px-3 py-2 border border-border rounded-lg bg-muted/30 text-right text-muted-foreground">
                {formatPrice(Math.round((parseFloat(newUnitPrice || '0') * 100) * newQuantity))}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleAddLine}
            disabled={!newLabel.trim() || !newUnitPrice || addLineMutation.isPending}
            isLoading={addLineMutation.isPending}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter la ligne
          </Button>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-4">
        <div className="bg-surface border border-border rounded-2xl p-4 w-64">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total HT</span>
              <span>{formatPrice(invoice.totalHTCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatPrice(invoice.totalVATCents)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
              <span>Total TTC</span>
              <span>{formatPrice(invoice.totalTTCCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
