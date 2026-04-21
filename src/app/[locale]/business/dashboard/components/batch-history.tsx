'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  FileStack,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { BatchGeneration } from '@/types';

function groupByMonth(batches: BatchGeneration[]) {
  const groups: { key: string; label: string; batches: BatchGeneration[] }[] = [];
  let currentKey = '';

  for (const batch of batches) {
    const date = new Date(batch.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (key !== currentKey) {
      currentKey = key;
      groups.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), batches: [] });
    }
    groups[groups.length - 1].batches.push(batch);
  }

  return groups;
}

export function BatchHistory() {
  const [monthFilter, setMonthFilter] = useState('');
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setMonthOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: batches, isLoading } = useQuery({
    queryKey: ['batch-history'],
    queryFn: () => api.getBatchHistory(),
  });

  const availableMonths = useMemo(() => {
    if (!batches) return [];
    const months = new Map<string, string>();
    for (const batch of batches) {
      const date = new Date(batch.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!months.has(key)) {
        const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        months.set(key, label.charAt(0).toUpperCase() + label.slice(1));
      }
    }
    return Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [batches]);

  const filtered = useMemo(() => {
    if (!batches) return [];
    if (!monthFilter) return batches;
    return batches.filter((b) => {
      const date = new Date(b.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      return key === monthFilter;
    });
  }, [batches, monthFilter]);

  const monthLabel = monthFilter
    ? availableMonths.find(([k]) => k === monthFilter)?.[1] || ''
    : 'Tous les mois';

  const handleDownload = (batch: BatchGeneration) => {
    const url = api.getBatchDownloadByIdUrl(batch.id);
    api.downloadBlob(url).then((arrayBuffer) => {
      const blob = new Blob([arrayBuffer], { type: 'application/zip' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const start = new Date(batch.startDate);
      const end = new Date(batch.endDate);
      a.download = `factures-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileStack className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Aucune génération groupée pour le moment</p>
      </div>
    );
  }

  const groups = groupByMonth(filtered);

  return (
    <div>
      {/* Month filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative" ref={monthRef}>
          <button
            onClick={() => setMonthOpen(!monthOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              monthFilter
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {monthLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
          </button>

          {monthOpen && (
            <div className="absolute left-0 mt-1 w-52 bg-surface border border-border rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setMonthFilter('');
                  setMonthOpen(false);
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
                    setMonthOpen(false);
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

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Aucune génération pour ce mois</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {group.label}
            </h3>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              {group.batches.map((batch: BatchGeneration, idx: number) => {
                const startDate = new Date(batch.startDate);
                const endDate = new Date(batch.endDate);
                const createdAt = new Date(batch.createdAt);

                return (
                  <div
                    key={batch.id}
                    className={`p-4 flex items-center justify-between gap-4 ${
                      idx < group.batches.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {batch.status === 'COMPLETED' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {batch.invoiceCount} facture{batch.invoiceCount > 1 ? 's' : ''} — {formatPrice(batch.totalTTCCents)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Du {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au{' '}
                          {endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{' '}
                          à {createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {batch.invoiceCount > 0 && (
                      <button
                        onClick={() => handleDownload(batch)}
                        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
                        title="Télécharger le ZIP"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
