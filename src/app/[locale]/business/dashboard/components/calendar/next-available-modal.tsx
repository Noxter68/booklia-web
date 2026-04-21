'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, CalendarPlus } from 'lucide-react';
import type {
  Employee,
  BusinessService,
  CalendarEntry,
} from '@/types';
import { Button } from '@/components/ui/button';
import {
  findNextAvailableSlot,
  type SlotResult,
} from '@/lib/calendar-utils';

type Range = 'today' | 'week';

interface NextAvailableModalProps {
  employees: Employee[];
  services: BusinessService[];
  currentEntries: CalendarEntry[];
  onClose: () => void;
  onSlotSelected: (
    employeeId: string,
    startAt: Date,
    serviceId: string,
  ) => void;
}

export function NextAvailableModal({
  employees,
  services,
  currentEntries,
  onClose,
  onSlotSelected,
}: NextAvailableModalProps) {
  const activeServices = services.filter((s) => s.isActive);
  const [serviceId, setServiceId] = useState(
    activeServices[0]?.id ?? '',
  );
  const [staffId, setStaffId] = useState<string>('');
  const [range, setRange] = useState<Range>('today');
  const [result, setResult] = useState<SlotResult | null>(null);
  const [searched, setSearched] = useState(false);

  const selectedService = activeServices.find(
    (s) => s.id === serviceId,
  );

  const handleSearch = () => {
    if (!selectedService) return;

    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(rangeStart);
    if (range === 'week') {
      rangeEnd.setDate(rangeEnd.getDate() + 7);
    }
    rangeEnd.setHours(23, 59, 59, 999);

    const targetEmployees = staffId
      ? employees.filter((e) => e.id === staffId)
      : employees.filter((e) => e.isActive);

    const slot = findNextAvailableSlot(
      currentEntries,
      targetEmployees,
      selectedService.durationMinutes,
      rangeStart,
      rangeEnd,
    );

    setResult(slot);
    setSearched(true);
  };

  const handleSelectSlot = () => {
    if (!result) return;
    const startAt = new Date(`${result.date}T${result.time}:00`);
    onSlotSelected(result.employeeId, startAt, serviceId);
  };

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
              Prochain créneau disponible
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
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setSearched(false);
                }}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Staff */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Employé
              </label>
              <select
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  setSearched(false);
                }}
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="">Tous les employés</option>
                {employees
                  .filter((e) => e.isActive)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Période
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRange('today');
                    setSearched(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    range === 'today'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Aujourd&apos;hui
                </button>
                <button
                  onClick={() => {
                    setRange('week');
                    setSearched(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    range === 'week'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cette semaine
                </button>
              </div>
            </div>

            {/* Search button */}
            <Button
              className="w-full rounded-xl"
              onClick={handleSearch}
              disabled={!serviceId}
            >
              <Search className="w-4 h-4 mr-2" />
              Trouver
            </Button>

            {/* Result */}
            {searched && (
              <div className="pt-3 border-t border-border/50">
                {result ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                    <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Prochain créneau disponible :
                    </div>
                    <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                      {new Date(
                        `${result.date}T${result.time}`,
                      ).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      à {result.time}
                    </div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">
                      avec {result.employeeName}
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 rounded-xl"
                      onClick={handleSelectSlot}
                    >
                      <CalendarPlus className="w-4 h-4 mr-1.5" />
                      Créer un rendez-vous
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Aucun créneau disponible pour cette période.
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
