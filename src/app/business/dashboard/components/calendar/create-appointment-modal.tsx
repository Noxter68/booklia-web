'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Employee, BusinessService } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { toLocalDateString, minutesToTime } from '@/lib/calendar-utils';
import { ClientSearchSelect } from '../client-search-select';

interface CreateAppointmentModalProps {
  prefillEmployeeId: string;
  prefillStartAt: Date;
  employees: Employee[];
  services: BusinessService[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAppointmentModal({
  prefillEmployeeId,
  prefillStartAt,
  employees,
  services,
  onClose,
  onCreated,
}: CreateAppointmentModalProps) {
  const [employeeId, setEmployeeId] = useState(prefillEmployeeId);
  const [serviceId, setServiceId] = useState(
    services[0]?.id ?? '',
  );
  const [date, setDate] = useState(toLocalDateString(prefillStartAt));
  const [time, setTime] = useState(
    minutesToTime(
      prefillStartAt.getHours() * 60 + prefillStartAt.getMinutes(),
    ),
  );
  const [clientUserId, setClientUserId] = useState('');
  const [notes, setNotes] = useState('');

  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const selectedService = services.find((s) => s.id === serviceId);

  const createMutation = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${date}T${time}:00`);
      return api.createCalendarAppointment({
        employeeId,
        businessServiceId: serviceId,
        scheduledAt: scheduledAt.toISOString(),
        ...(clientUserId && { clientUserId }),
        ...(notes && { notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['calendar-entries'],
      });
      success('Rendez-vous créé');
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
            <h2 className="text-lg font-bold">
              Nouveau rendez-vous
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Service */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Prestation
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                {services
                  .filter((s) => s.isActive)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min)
                    </option>
                  ))}
              </select>
            </div>

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

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Heure
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  step={600}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Duration info */}
            {selectedService && (
              <div className="text-xs text-muted-foreground">
                Durée : {selectedService.durationMinutes} min —
                Fin prévue à{' '}
                {minutesToTime(
                  (parseInt(time.split(':')[0]) * 60 +
                    parseInt(time.split(':')[1]) +
                    selectedService.durationMinutes),
                )}
              </div>
            )}

            {/* Client */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Client (optionnel)
              </label>
              <ClientSearchSelect
                value={clientUserId}
                onChange={(id) => setClientUserId(id)}
                placeholder="Rechercher un client..."
              />
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
                placeholder="Notes internes..."
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
                !serviceId ||
                !employeeId ||
                createMutation.isPending
              }
              isLoading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Créer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
