'use client';

import { X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Invoice, InvoiceLine } from '@/types';

interface InvoicePreviewProps {
  invoice: Invoice;
  billingSettings?: {
    legalName?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    siret?: string;
    vatNumber?: string;
    vatMode?: string;
    paymentTerms?: string;
  } | null;
  onClose?: () => void;
}

export function InvoicePreview({ invoice, billingSettings, onClose }: InvoicePreviewProps) {
  // Use snapshot data for finalized invoices, live data for drafts
  const snapshot = invoice.snapshot as Record<string, any> | null;
  const isFinalized = invoice.status === 'FINALIZED';

  const seller = isFinalized && snapshot?.seller
    ? snapshot.seller
    : billingSettings || {};

  const buyer = isFinalized && snapshot?.buyer
    ? snapshot.buyer
    : invoice.client || null;

  const lines: InvoiceLine[] = isFinalized && snapshot?.lines
    ? snapshot.lines
    : invoice.lines || [];

  const totals = isFinalized && snapshot?.totals
    ? snapshot.totals
    : {
        totalHTCents: invoice.totalHTCents,
        totalVATCents: invoice.totalVATCents,
        totalTTCCents: invoice.totalTTCCents,
      };

  const metadata = isFinalized && snapshot?.metadata
    ? snapshot.metadata
    : {
        invoiceNumber: invoice.invoiceNumber || 'BROUILLON',
        issueDate: invoice.issueDate || new Date().toISOString(),
        serviceDate: invoice.serviceDate,
        currency: invoice.currency || 'EUR',
      };

  const legalMentions: string[] = isFinalized && snapshot?.legalMentions
    ? snapshot.legalMentions
    : buildLegalMentions(seller.vatMode, seller.paymentTerms);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* A4 paper simulation */}
      <div className="bg-white text-black rounded-lg shadow-lg border border-gray-200 p-8 max-w-[595px] mx-auto text-[11px] leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{seller.legalName || 'Votre entreprise'}</h1>
            {seller.addressLine1 && <p className="text-gray-600">{seller.addressLine1}</p>}
            {seller.addressLine2 && <p className="text-gray-600">{seller.addressLine2}</p>}
            {(seller.postalCode || seller.city) && (
              <p className="text-gray-600">{seller.postalCode} {seller.city}</p>
            )}
            {seller.siret && <p className="text-gray-500 mt-1">SIRET : {seller.siret}</p>}
            {seller.vatNumber && <p className="text-gray-500">TVA : {seller.vatNumber}</p>}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 mb-1">FACTURE</div>
            <div className="text-gray-700 font-semibold">{metadata.invoiceNumber}</div>
            <div className="text-gray-500 mt-2">
              <p>Date : {formatDate(metadata.issueDate)}</p>
              {metadata.serviceDate && <p>Date prestation : {formatDate(metadata.serviceDate)}</p>}
            </div>
            {!isFinalized && (
              <div className="mt-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded uppercase tracking-wide">
                Brouillon
              </div>
            )}
            {invoice.status === 'CANCELLED' && (
              <div className="mt-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded uppercase tracking-wide">
                Annulée
              </div>
            )}
          </div>
        </div>

        {/* Client */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Facturé à</p>
            {buyer ? (
              <>
                <p className="font-semibold text-gray-900">{buyer.name || 'Client'}</p>
                {buyer.email && <p className="text-gray-600">{buyer.email}</p>}
              </>
            ) : (
              <p className="text-gray-400 italic">Aucun client sélectionné</p>
            )}
          </div>
        </div>

        {/* Lines table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">Désignation</th>
              <th className="text-center py-2 font-semibold text-gray-700 w-12">Qté</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-20">PU HT</th>
              <th className="text-center py-2 font-semibold text-gray-700 w-14">TVA</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-20">Total HT</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-20">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400 italic">
                  Aucune ligne
                </td>
              </tr>
            ) : (
              lines.map((line: any, index: number) => (
                <tr key={line.id || index} className="border-b border-gray-100">
                  <td className="py-2 text-gray-900">{line.label}</td>
                  <td className="py-2 text-center text-gray-700">{line.quantity}</td>
                  <td className="py-2 text-right text-gray-700">{formatPrice(line.unitPriceHTCents)}</td>
                  <td className="py-2 text-center text-gray-700">{line.vatRate}%</td>
                  <td className="py-2 text-right text-gray-700">{formatPrice(line.totalHTCents)}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{formatPrice(line.totalTTCCents)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-52">
            <div className="flex justify-between py-1 text-gray-600">
              <span>Total HT</span>
              <span>{formatPrice(totals.totalHTCents)}</span>
            </div>
            <div className="flex justify-between py-1 text-gray-600">
              <span>TVA</span>
              <span>{formatPrice(totals.totalVATCents)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-gray-900 text-sm">
              <span>Total TTC</span>
              <span>{formatPrice(totals.totalTTCCents)}</span>
            </div>
          </div>
        </div>

        {/* Legal mentions */}
        {legalMentions.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            {legalMentions.map((mention: string, i: number) => (
              <p key={i} className="text-[10px] text-gray-500 italic">{mention}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildLegalMentions(vatMode?: string, paymentTerms?: string | null): string[] {
  const mentions: string[] = [];
  if (vatMode === 'FRANCHISE_293B') {
    mentions.push('TVA non applicable, art. 293 B du CGI');
  }
  if (paymentTerms) {
    mentions.push(paymentTerms);
  }
  return mentions;
}
