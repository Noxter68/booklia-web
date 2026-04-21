'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DragConfirmData } from './day-scheduler';

interface DragConfirmModalProps {
  data: DragConfirmData;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DragConfirmModal({
  data,
  isLoading,
  onConfirm,
  onCancel,
}: DragConfirmModalProps) {
  const oldStart = new Date(data.entry.scheduledAt);
  const newStart = new Date(data.newStartAt);
  const employeeChanged =
    data.newEmployeeId !== data.entry.employeeId;
  const timeChanged =
    data.newStartAt !== data.entry.scheduledAt;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  const oldEmployeeName = data.entry.employee
    ? `${data.entry.employee.firstName ?? ''} ${data.entry.employee.lastName ?? ''}`.trim()
    : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-bold">
              Confirmer le déplacement
            </h2>
          </div>

          <div className="p-5 space-y-3">
            <div className="text-sm font-medium">
              {data.entry.businessService?.name ?? 'Rendez-vous'}
            </div>

            {timeChanged && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {formatDate(oldStart)} {formatTime(oldStart)}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatDate(newStart)} {formatTime(newStart)}
                </span>
              </div>
            )}

            {employeeChanged && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {oldEmployeeName}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {data.newEmployeeName}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-border/50 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Appliquer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
