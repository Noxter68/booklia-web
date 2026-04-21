'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  FileStack,
  Download,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { formatPrice } from '@/lib/utils';
import { BatchPreviewResult, BatchProgress, BatchResult } from '@/types';

type Period = 'today' | 'week' | 'month';

function getPeriodDates(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (period) {
    case 'today': {
      const start = new Date(y, m, d, 0, 0, 0);
      const end = new Date(y, m, d, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday start
      const start = new Date(y, m, d - diff, 0, 0, 0);
      const end = new Date(y, m, d, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'month': {
      const start = new Date(y, m, 1, 0, 0, 0);
      const end = new Date(y, m, d, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
  }
}

const periodLabels: Record<Period, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
};

interface BatchInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchInvoiceModal({ isOpen, onClose }: BatchInvoiceModalProps) {
  const queryClient = useQueryClient();
  const { onBatchProgress } = useWebSocket();

  const [period, setPeriod] = useState<Period>('today');
  const [step, setStep] = useState<'select' | 'preview' | 'generating' | 'done'>('select');
  const [preview, setPreview] = useState<BatchPreviewResult | null>(null);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const datesRef = useRef<{ startDate: string; endDate: string } | null>(null);

  // Subscribe to WebSocket batch progress
  useEffect(() => {
    const unsub = onBatchProgress((p) => {
      setProgress(p);
      if (p.phase === 'done') {
        // Will be overridden by mutation onSuccess
      }
    });
    return unsub;
  }, [onBatchProgress]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setPreview(null);
      setProgress(null);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const previewMutation = useMutation({
    mutationFn: () => {
      const dates = getPeriodDates(period);
      datesRef.current = dates;
      return api.batchPreview(dates.startDate, dates.endDate);
    },
    onSuccess: (data) => {
      setPreview(data);
      setStep('preview');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Erreur lors du chargement');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      const dates = datesRef.current!;
      return api.batchGenerate(dates.startDate, dates.endDate);
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['batch-history'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Erreur lors de la génération');
      setStep('preview');
    },
  });

  const handlePreview = () => {
    setError(null);
    previewMutation.mutate();
  };

  const handleGenerate = () => {
    setError(null);
    setStep('generating');
    setProgress(null);
    generateMutation.mutate();
  };

  const handleDownloadZip = () => {
    // Prefer batch ID download if available, fallback to date range
    const url = result?.batchId
      ? api.getBatchDownloadByIdUrl(result.batchId)
      : datesRef.current
        ? api.getBatchDownloadUrl(datesRef.current.startDate, datesRef.current.endDate)
        : null;

    if (!url) return;

    api.downloadBlob(url).then((arrayBuffer) => {
      const blob = new Blob([arrayBuffer], { type: 'application/zip' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const dates = datesRef.current;
      const start = dates ? new Date(dates.startDate) : new Date();
      const monthName = start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      a.download = `factures-${monthName.replace(' ', '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  };

  if (!isOpen) return null;

  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={step !== 'generating' ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileStack className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Génération batch</h2>
              <p className="text-sm text-muted-foreground">
                Créer les factures d'une période
              </p>
            </div>
          </div>
          {step !== 'generating' && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Select period */}
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sélectionnez la période pour laquelle générer les factures.
                Seules les prestations terminées sans facture seront incluses.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {(['today', 'week', 'month'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      period === p
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    }`}
                  >
                    <Calendar className={`w-5 h-5 mx-auto mb-2 ${period === p ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${period === p ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {periodLabels[p]}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                onClick={handlePreview}
                isLoading={previewMutation.isPending}
                className="w-full rounded-xl"
              >
                Voir les prestations
              </Button>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    {preview.count} prestation{preview.count > 1 ? 's' : ''} éligible{preview.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {periodLabels[period]}
                  </p>
                </div>
              </div>

              {preview.count > 0 && (
                <>
                  {/* Booking list */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {preview.bookings.map((b) => (
                      <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{b.clientName}</p>
                          <p className="text-xs text-muted-foreground">{b.serviceName}</p>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(b.priceCents)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    className="w-full rounded-xl"
                  >
                    <FileStack className="w-4 h-4 mr-2" />
                    Générer {preview.count} facture{preview.count > 1 ? 's' : ''}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="w-full rounded-xl"
              >
                ← Changer de période
              </Button>
            </div>
          )}

          {/* Step 3: Generating with progress */}
          {step === 'generating' && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="font-semibold">
                  Génération en cours…
                </p>
                {progress && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {progress.currentClient}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>
                    {progress ? `${progress.current} / ${progress.total}` : 'Démarrage…'}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-bold">Terminé !</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{result.generatedCount}</p>
                  <p className="text-xs text-muted-foreground">Factures créées</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{formatPrice(result.totalTTCCents)}</p>
                  <p className="text-xs text-muted-foreground">CA TTC</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{formatPrice(result.totalHTCents)}</p>
                  <p className="text-xs text-muted-foreground">Total HT</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{formatPrice(result.totalVATCents)}</p>
                  <p className="text-xs text-muted-foreground">TVA</p>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                    {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''}
                  </p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-500">{err}</p>
                  ))}
                </div>
              )}

              {/* Download ZIP */}
              <Button
                onClick={handleDownloadZip}
                className="w-full rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger toutes les factures (.zip)
              </Button>

              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full rounded-xl"
              >
                Fermer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
