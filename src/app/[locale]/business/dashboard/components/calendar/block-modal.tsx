'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Employee, BlockReason } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import {
  toLocalDateString,
  minutesToTime,
  BLOCK_REASON_LABELS,
} from '@/lib/calendar-utils';

interface BlockModalProps {
  prefillEmployeeId: string;
  prefillStartAt: Date;
  employees: Employee[];
  onClose: () => void;
  onCreated: () => void;
}

const BLOCK_REASONS: BlockReason[] = [
  'BREAK',
  'UNAVAILABLE',
  'PERSONAL',
  'CLOSED',
];

export function BlockModal({
  prefillEmployeeId,
  prefillStartAt,
  employees,
  onClose,
  onCreated,
}: BlockModalProps) {
  const [employeeId, setEmployeeId] = useState(prefillEmployeeId);
  const [date, setDate] = useState(toLocalDateString(prefillStartAt));
  const [startTime, setStartTime] = useState(
    minutesToTime(
      prefillStartAt.getHours() * 60 + prefillStartAt.getMinutes(),
    ),
  );
  const endDefault = new Date(
    prefillStartAt.getTime() + 60 * 60_000,
  );
  const [endTime, setEndTime] = useState(
    minutesToTime(
      endDefault.getHours() * 60 + endDefault.getMinutes(),
    ),
  );
  const [blockReason, setBlockReason] =
    useState<BlockReason>('BREAK');
  const [notes, setNotes] = useState('');

  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => {
      const startAt = new Date(`${date}T${startTime}:00`);
      const endAt = new Date(`${date}T${endTime}:00`);
      return api.createCalendarBlock({
        employeeId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        blockReason,
        ...(notes && { notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['calendar-entries'],
      });
      success('Bloc créé');
      onCreated();
    },
    onError: (err: Error) => {
      if (err.message?.includes('Conflit')) {
        showError('Créneau indisponible — conflit horaire');
      } else {
        showError('Erreur lors de la création');
      }
    },
  });

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
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-bold">Bloquer un créneau</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Employee */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Employé
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                {employees
                  .filter((e) => e.isActive)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>

            {/* Start + End */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Début
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={600}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  step={600}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Block reason */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Raison
              </label>
              <select
                value={blockReason}
                onChange={(e) =>
                  setBlockReason(e.target.value as BlockReason)
                }
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                {BLOCK_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {BLOCK_REASON_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes..."
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/50 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={
                !employeeId || createMutation.isPending
              }
              isLoading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Bloquer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
