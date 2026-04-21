'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react';
import {
  api,
  CreateExceptionInput,
  EmployeeException,
  TimeRangeInput,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Employee } from '@/types';
import { Plus } from 'lucide-react';

// ============================================================================
// Utilities — all date math stays in local time, YYYY-MM-DD strings as the
// canonical format matching @db.Date on the backend.
// ============================================================================

/** "2026-04-27" from a Date */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse "2026-04-27" → local Date at midnight */
function parseDateKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Backend returns ISO-ish for @db.Date ("2026-04-27T00:00:00.000Z"); extract the day */
function exceptionDateKey(ex: EmployeeException): string {
  return ex.date.slice(0, 10);
}

/** Build the 6-week grid for a given month (always 42 cells starting Monday). */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // Monday-first offset: Sun=0 → 6, Mon=1 → 0, Tue=2 → 1, ...
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ============================================================================
// Main component
// ============================================================================

interface Props {
  employees: Employee[];
}

type Mode = 'closed' | 'hours';

export function ExceptionsManager({ employees }: Props) {
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.isActive),
    [employees],
  );

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | 'all'>(
    activeEmployees.length === 1 ? activeEmployees[0].id : 'all',
  );
  const [anchorMonth, setAnchorMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  // When selecting "all", we load exceptions of the first employee as the
  // reference (overrides from other employees will be applied via batched POSTs).
  // For a single employee, we load that employee's exceptions.
  const referenceEmployeeId =
    selectedEmployeeId === 'all' ? activeEmployees[0]?.id : selectedEmployeeId;

  // Date range covering the two visible months (extra-wide to include the grid edges)
  const { fromKey, toKey } = useMemo(() => {
    const gridStart = buildMonthGrid(anchorMonth.year, anchorMonth.month)[0];
    const nextMonth = new Date(anchorMonth.year, anchorMonth.month + 1, 1);
    const gridEnd = buildMonthGrid(nextMonth.getFullYear(), nextMonth.getMonth())[41];
    return { fromKey: toDateKey(gridStart), toKey: toDateKey(gridEnd) };
  }, [anchorMonth]);

  const { data: exceptions = [] } = useQuery({
    queryKey: ['employee-exceptions', referenceEmployeeId, fromKey, toKey],
    queryFn: () =>
      referenceEmployeeId
        ? api.listEmployeeExceptions(referenceEmployeeId, { from: fromKey, to: toKey })
        : Promise.resolve([]),
    enabled: !!referenceEmployeeId,
  });

  const exceptionsByDate = useMemo(() => {
    const map = new Map<string, EmployeeException>();
    for (const ex of exceptions) map.set(exceptionDateKey(ex), ex);
    return map;
  }, [exceptions]);

  if (activeEmployees.length === 0) {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-300">Aucun employé actif</p>
          <p className="text-amber-700 dark:text-amber-400 mt-1">
            Ajoutez au moins un employé pour gérer les jours de fermeture ou horaires spéciaux.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee selector — hidden when a single employee exists */}
      {activeEmployees.length > 1 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Appliquer à</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">Tous les employés</option>
            {activeEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Calendar navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setAnchorMonth((p) => {
              const d = new Date(p.year, p.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
          className="rounded-full gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setAnchorMonth((p) => {
              const d = new Date(p.year, p.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
          className="rounded-full gap-1"
        >
          Suivant
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Two-month calendar grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <MonthCalendar
          year={anchorMonth.year}
          month={anchorMonth.month}
          exceptionsByDate={exceptionsByDate}
          onPickDay={setDialogDate}
        />
        <MonthCalendar
          year={new Date(anchorMonth.year, anchorMonth.month + 1, 1).getFullYear()}
          month={(anchorMonth.month + 1) % 12}
          exceptionsByDate={exceptionsByDate}
          onPickDay={setDialogDate}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Fermé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500" /> Horaires spéciaux
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-border" /> Défaut
        </span>
      </div>

      {/* Exceptions list (filtered to visible range) */}
      {exceptions.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-3">Exceptions programmées</p>
          <ExceptionsList
            exceptions={exceptions}
            employeeId={referenceEmployeeId!}
          />
        </div>
      )}

      {/* Edit dialog */}
      <AnimatePresence>
        {dialogDate && (
          <ExceptionDialog
            date={dialogDate}
            existing={exceptionsByDate.get(dialogDate) ?? null}
            employeeIds={
              selectedEmployeeId === 'all'
                ? activeEmployees.map((e) => e.id)
                : [selectedEmployeeId]
            }
            onClose={() => setDialogDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Month calendar
// ============================================================================

function MonthCalendar({
  year,
  month,
  exceptionsByDate,
  onPickDay,
}: {
  year: number;
  month: number;
  exceptionsByDate: Map<string, EmployeeException>;
  onPickDay: (dateKey: string) => void;
}) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toDateKey(new Date());

  return (
    <div>
      <div className="text-center font-semibold mb-3">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === month;
          const ex = exceptionsByDate.get(key);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickDay(key)}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                inMonth
                  ? 'hover:bg-muted/50'
                  : 'text-muted-foreground/40 hover:bg-muted/30'
              } ${isToday ? 'ring-1 ring-primary/60' : ''}`}
            >
              <span className={isToday ? 'font-bold text-primary' : ''}>
                {date.getDate()}
              </span>
              {ex && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    ex.isClosed ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Exceptions list (below calendar)
// ============================================================================

function ExceptionsList({
  exceptions,
  employeeId,
}: {
  exceptions: EmployeeException[];
  employeeId: string;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployeeException(id),
    onSuccess: () => {
      success('Exception supprimée');
      queryClient.invalidateQueries({ queryKey: ['employee-exceptions'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  return (
    <div className="space-y-1.5">
      {exceptions.map((ex) => {
        const d = parseDateKey(exceptionDateKey(ex));
        const label = d.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return (
          <div
            key={ex.id}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 text-sm"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                ex.isClosed ? 'bg-red-500' : 'bg-blue-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                {ex.isClosed
                  ? 'Fermé'
                  : ex.slots.length === 0
                    ? 'Aucune plage'
                    : ex.slots
                        .map((s) => `${s.startTime}–${s.endTime}`)
                        .join(' · ')}
                {ex.reason && ` · ${ex.reason}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(ex.id)}
              disabled={deleteMutation.isPending}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Edit dialog (click on a day)
// ============================================================================

function ExceptionDialog({
  date,
  existing,
  employeeIds,
  onClose,
}: {
  date: string;
  existing: EmployeeException | null;
  employeeIds: string[];
  onClose: () => void;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>(
    existing ? (existing.isClosed ? 'closed' : 'hours') : 'closed',
  );
  const [slots, setSlots] = useState<TimeRangeInput[]>(() =>
    existing && !existing.isClosed && existing.slots.length > 0
      ? existing.slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
      : [{ startTime: '09:00', endTime: '18:00' }],
  );
  const [isRange, setIsRange] = useState(false);
  const [rangeEnd, setRangeEnd] = useState(date);
  const [reason, setReason] = useState(existing?.reason ?? '');

  const addSlot = () =>
    setSlots((prev) => [...prev, { startTime: '09:00', endTime: '12:00' }]);
  const updateSlot = (i: number, patch: Partial<TimeRangeInput>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSlot = (i: number) =>
    setSlots((prev) => prev.filter((_, idx) => idx !== i));

  // Validation: each slot needs start < end
  const slotsInvalid =
    mode === 'hours' &&
    (slots.length === 0 || slots.some((s) => s.startTime >= s.endTime));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const base = {
        isClosed: mode === 'closed',
        ...(mode === 'hours' ? { slots } : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      };
      const payload: CreateExceptionInput = isRange
        ? { ...base, dateFrom: date, dateTo: rangeEnd }
        : { ...base, date };
      await Promise.all(
        employeeIds.map((id) => api.createEmployeeException(id, payload)),
      );
    },
    onSuccess: () => {
      success('Exception enregistrée');
      queryClient.invalidateQueries({ queryKey: ['employee-exceptions'] });
      onClose();
    },
    onError: () => showError("Erreur lors de l'enregistrement"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!existing) return Promise.resolve({ success: true });
      return api.deleteEmployeeException(existing.id);
    },
    onSuccess: () => {
      success('Exception supprimée');
      queryClient.invalidateQueries({ queryKey: ['employee-exceptions'] });
      onClose();
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const dateLabel = parseDateKey(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold capitalize">{dateLabel}</p>
              <p className="text-xs text-muted-foreground">
                {existing ? 'Modifier l\'exception' : 'Nouvelle exception'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('closed')}
                className={`p-3 rounded-xl border text-sm transition-colors cursor-pointer ${
                  mode === 'closed'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                Fermé toute la journée
              </button>
              <button
                type="button"
                onClick={() => setMode('hours')}
                className={`p-3 rounded-xl border text-sm transition-colors cursor-pointer ${
                  mode === 'hours'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                Horaires spéciaux
              </button>
            </div>
          </div>

          {/* Time slots (multi) */}
          {mode === 'hours' && (
            <div className="space-y-2">
              <label className="text-xs font-medium block">Plages horaires</label>
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                >
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-foreground focus:ring-1 focus:ring-foreground outline-none"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-foreground focus:ring-1 focus:ring-foreground outline-none"
                  />
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      aria-label="Retirer cette plage"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSlot}
                className="rounded-full gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une plage
              </Button>
              {slotsInvalid && (
                <p className="text-xs text-destructive">
                  Chaque plage doit avoir une heure de début inférieure à l'heure de fin.
                </p>
              )}
            </div>
          )}

          {/* Range toggle */}
          <div className="space-y-2 border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRange}
                onChange={(e) => setIsRange(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">Appliquer sur une plage de dates</span>
            </label>
            {isRange && (
              <div className="pl-6">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Jusqu'au
                </label>
                <Input
                  type="date"
                  value={rangeEnd}
                  min={date}
                  onChange={(e) => setRangeEnd(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium mb-1 block">
              Note (optionnelle)
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Vacances, formation…"
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
          {existing ? (
            <Button
              variant="ghost"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-destructive hover:text-destructive rounded-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full">
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || slotsInvalid}
              isLoading={saveMutation.isPending}
              className="rounded-full"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
