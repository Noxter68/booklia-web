'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Ban, AlertTriangle, CheckCircle, StickyNote } from 'lucide-react';
import type { CalendarEntry, BookingStatus, BookingNote } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  STATUS_LABELS,
  BLOCK_REASON_LABELS,
} from '@/lib/calendar-utils';

interface EntryDetailModalProps {
  entry: CalendarEntry | null;
  onClose: () => void;
  onStatusChange: (
    entryId: string,
    status: BookingStatus,
  ) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
  isUpdating: boolean;
}

const statusActions: {
  label: string;
  status: BookingStatus;
  icon: typeof Check;
  variant: 'default' | 'outline' | 'destructive';
  fromStatuses: BookingStatus[];
}[] = [
  {
    label: 'Confirmer',
    status: 'ACCEPTED',
    icon: Check,
    variant: 'default',
    fromStatuses: ['PENDING'],
  },
  {
    label: 'Terminé',
    status: 'COMPLETED',
    icon: CheckCircle,
    variant: 'default',
    fromStatuses: ['ACCEPTED'],
  },
  {
    label: 'Absent',
    status: 'NO_SHOW',
    icon: AlertTriangle,
    variant: 'outline',
    fromStatuses: ['PENDING', 'ACCEPTED'],
  },
  {
    label: 'Annuler',
    status: 'CANCELED',
    icon: Ban,
    variant: 'destructive',
    fromStatuses: ['PENDING', 'ACCEPTED'],
  },
];

export function EntryDetailModal({
  entry,
  onClose,
  onStatusChange,
  onDelete,
  isUpdating,
}: EntryDetailModalProps) {
  const [lastNote, setLastNote] = useState<BookingNote | null>(null);

  useEffect(() => {
    if (!entry || entry.kind === 'BLOCK') {
      setLastNote(null);
      return;
    }
    const clientId = entry.requesterId;
    if (!clientId) return;
    let cancelled = false;
    api.getClientLastNote(clientId)
      .then((note) => { if (!cancelled) setLastNote(note); })
      .catch(() => { if (!cancelled) setLastNote(null); });
    return () => { cancelled = true; };
  }, [entry]);

  if (!entry) return null;

  const isBlock = entry.kind === 'BLOCK';
  const startTime = new Date(entry.scheduledAt).toLocaleTimeString(
    'fr-FR',
    { hour: '2-digit', minute: '2-digit' },
  );
  const endTime = new Date(entry.scheduledEndAt).toLocaleTimeString(
    'fr-FR',
    { hour: '2-digit', minute: '2-digit' },
  );
  const dateStr = new Date(entry.scheduledAt).toLocaleDateString(
    'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  const availableActions = isBlock
    ? []
    : statusActions.filter((a) =>
        a.fromStatuses.includes(entry.status),
      );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {isBlock
                ? (BLOCK_REASON_LABELS[entry.blockReason!] ??
                  'Bloc')
                : (entry.businessService?.name ?? 'Rendez-vous')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Date
              </span>
              <span className="text-sm font-medium capitalize">
                {dateStr}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Horaire
              </span>
              <span className="text-sm font-medium">
                {startTime} — {endTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Employé
              </span>
              <span className="text-sm font-medium">
                {entry.employee.firstName} {entry.employee.lastName}
              </span>
            </div>

            {!isBlock && (
              <>
                {entry.requester?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Client
                    </span>
                    <span className="text-sm font-medium">
                      {entry.requester.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Statut
                  </span>
                  <Badge variant="outline">
                    {STATUS_LABELS[entry.status]}
                  </Badge>
                </div>
              </>
            )}

            {entry.notes && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  Notes
                </span>
                <p className="text-sm mt-1">{entry.notes}</p>
              </div>
            )}

            {lastNote && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Dernière note client
                  </span>
                </div>
                <p className="text-sm bg-muted/50 rounded-lg p-2.5 whitespace-pre-wrap">
                  {lastNote.content}
                </p>
                {lastNote.booking?.businessService?.name && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {lastNote.booking.businessService.name}
                    {lastNote.booking.scheduledAt &&
                      ` — ${new Date(lastNote.booking.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {(availableActions.length > 0 || isBlock) && (
            <div className="p-5 border-t border-border/50 space-y-2">
              {availableActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableActions.map((action) => (
                    <Button
                      key={action.status}
                      variant={action.variant}
                      size="sm"
                      className="rounded-xl"
                      disabled={isUpdating}
                      onClick={() =>
                        onStatusChange(entry.id, action.status)
                      }
                    >
                      <action.icon className="w-4 h-4 mr-1.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
              {isBlock && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl w-full"
                  disabled={isUpdating}
                  onClick={() => onDelete(entry.id)}
                >
                  Supprimer ce bloc
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
