'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  FileText,
  Save,
  Info,
  Calculator,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { VatMode, LegalForm } from '@/types';

const legalFormLabels: Record<LegalForm, string> = {
  AUTOENTREPRENEUR_BIC_SERVICE: 'Auto-entrepreneur (BIC services)',
  AUTOENTREPRENEUR_BIC_VENTE: 'Auto-entrepreneur (BIC vente)',
  AUTOENTREPRENEUR_BNC: 'Auto-entrepreneur (BNC)',
  EI: 'Entreprise individuelle (EI)',
  EURL: 'EURL',
  SASU: 'SASU',
  SARL: 'SARL',
  OTHER: 'Autre',
};

// Indicative URSSAF rates (subject to change). User can override.
const defaultUrssafRate: Record<LegalForm, number | null> = {
  AUTOENTREPRENEUR_BIC_SERVICE: 0.212,
  AUTOENTREPRENEUR_BIC_VENTE: 0.123,
  AUTOENTREPRENEUR_BNC: 0.211,
  EI: null,
  EURL: null,
  SASU: null,
  SARL: null,
  OTHER: null,
};

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
  const [legalForm, setLegalForm] = useState<LegalForm | ''>('');
  const [urssafRatePct, setUrssafRatePct] = useState(''); // displayed as percent string
  const [incomeTaxRatePct, setIncomeTaxRatePct] = useState('');
  const [acreActive, setAcreActive] = useState(false);
  const [acreEndDate, setAcreEndDate] = useState('');

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
      setLegalForm(settings.legalForm || '');
      setUrssafRatePct(
        settings.urssafRate != null ? (settings.urssafRate * 100).toString() : '',
      );
      setIncomeTaxRatePct(
        settings.incomeTaxRate != null ? (settings.incomeTaxRate * 100).toString() : '',
      );
      setAcreActive(settings.acreActive ?? false);
      setAcreEndDate(settings.acreEndDate ? settings.acreEndDate.slice(0, 10) : '');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const urssafRate = urssafRatePct.trim()
        ? Math.max(0, Math.min(1, parseFloat(urssafRatePct.replace(',', '.')) / 100))
        : null;
      const incomeTaxRate = incomeTaxRatePct.trim()
        ? Math.max(0, Math.min(1, parseFloat(incomeTaxRatePct.replace(',', '.')) / 100))
        : null;
      return api.upsertBillingSettings({
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
        legalForm: legalForm || null,
        urssafRate: !isNaN(urssafRate as number) ? urssafRate : null,
        incomeTaxRate: !isNaN(incomeTaxRate as number) ? incomeTaxRate : null,
        acreActive,
        acreEndDate: acreEndDate ? new Date(acreEndDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      success('Paramètres de facturation enregistrés');
      queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
    },
    onError: () => showError('Erreur lors de l\'enregistrement'),
  });

  // When legalForm changes, suggest the matching default URSSAF rate (only if user hasn't typed one)
  const handleLegalFormChange = (form: LegalForm | '') => {
    setLegalForm(form);
    if (form && !urssafRatePct.trim() && defaultUrssafRate[form] != null) {
      setUrssafRatePct((defaultUrssafRate[form]! * 100).toString());
    }
  };

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

          {/* Paramètres comptables */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5" />
              Paramètres comptables
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Statut juridique
                </label>
                <select
                  value={legalForm}
                  onChange={(e) => handleLegalFormChange(e.target.value as LegalForm | '')}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Non défini —</option>
                  {(Object.keys(legalFormLabels) as LegalForm[]).map((f) => (
                    <option key={f} value={f}>{legalFormLabels[f]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Taux URSSAF (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={urssafRatePct}
                    onChange={(e) => setUrssafRatePct(e.target.value)}
                    placeholder="21,2"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Taux IR estimé (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={incomeTaxRatePct}
                    onChange={(e) => setIncomeTaxRatePct(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <input
                  id="acre-active"
                  type="checkbox"
                  checked={acreActive}
                  onChange={(e) => setAcreActive(e.target.checked)}
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="acre-active" className="text-sm font-medium cursor-pointer">
                    ACRE active
                  </label>
                  <p className="text-xs text-muted-foreground">Réduction de cotisations URSSAF la 1ère année</p>
                  {acreActive && (
                    <input
                      type="date"
                      value={acreEndDate}
                      onChange={(e) => setAcreEndDate(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Ces paramètres sont utilisés pour estimer ton URSSAF et ton net dans l&apos;onglet Comptabilité.</span>
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
