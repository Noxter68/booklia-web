'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  FileText,
  Save,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { VatMode } from '@/types';

export function BillingSettingsTab() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [legalName, setLegalName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [siret, setSiret] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [vatMode, setVatMode] = useState<VatMode>('FRANCHISE_293B');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => api.getBillingSettings(),
  });

  useEffect(() => {
    if (settings) {
      setLegalName(settings.legalName || '');
      setAddressLine1(settings.addressLine1 || '');
      setAddressLine2(settings.addressLine2 || '');
      setPostalCode(settings.postalCode || '');
      setCity(settings.city || '');
      setSiret(settings.siret || '');
      setVatNumber(settings.vatNumber || '');
      setVatMode(settings.vatMode || 'FRANCHISE_293B');
      setInvoicePrefix(settings.invoicePrefix || '');
      setPaymentTerms(settings.paymentTerms || '');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.upsertBillingSettings({
        legalName,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        postalCode,
        city,
        siret,
        vatNumber: vatNumber || undefined,
        vatMode,
        invoicePrefix,
        paymentTerms: paymentTerms || undefined,
      }),
    onSuccess: () => {
      success('Paramètres de facturation enregistrés');
      queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
    },
    onError: () => showError('Erreur lors de l\'enregistrement'),
  });

  const formatSiret = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 14)];
    return parts.filter(Boolean).join(' ');
  };

  const formatVatNumber = (value: string) => {
    const raw = value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 13);
    if (raw.length <= 4) return raw;
    return raw.slice(0, 4) + ' ' + raw.slice(4);
  };

  const canSave = legalName && addressLine1 && postalCode && city && siret && invoicePrefix;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Paramètres de facturation</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Informations légales */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5" />
              Informations légales
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Raison sociale *
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    SIRET *
                  </label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(formatSiret(e.target.value))}
                    placeholder="123 456 789 00012"
                    maxLength={17}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    N° TVA intracommunautaire
                  </label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(formatVatNumber(e.target.value))}
                    placeholder="FR12 345678901"
                    maxLength={14}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" />
              Adresse
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Adresse ligne 1 *
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="12 rue de la Paix"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Adresse ligne 2
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Bâtiment A, 2ème étage"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Facturation */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              Facturation
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Régime TVA *
                </label>
                <select
                  value={vatMode}
                  onChange={(e) => setVatMode(e.target.value as VatMode)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="FRANCHISE_293B">Franchise en base de TVA (art. 293 B)</option>
                  <option value="STANDARD">Assujetti TVA</option>
                </select>
              </div>
              {vatMode === 'FRANCHISE_293B' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>La mention &quot;TVA non applicable, art. 293 B du CGI&quot; sera automatiquement ajoutée sur vos factures.</span>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Préfixe des factures *
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  placeholder="DALVA"
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Exemple de numéro : {invoicePrefix || 'PREFIX'}-{new Date().getFullYear()}-0001
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Conditions de paiement
                </label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Paiement à réception, espèces ou carte bancaire"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="mt-6">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!canSave || saveMutation.isPending}
          isLoading={saveMutation.isPending}
          className="rounded-full"
        >
          <Save className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
