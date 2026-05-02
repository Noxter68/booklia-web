'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  Search,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  Business,
  Employee,
  BusinessService,
  CalendarEntry,
  BookingStatus,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useCalendarState } from '@/hooks/useCalendarState';
import { useCalendarEntries } from '@/hooks/useCalendarEntries';
import { api } from '@/lib/api';
import {
  toLocalDateString,
  getWeekStart,
  isSameDay,
} from '@/lib/calendar-utils';
import { DayScheduler } from './day-scheduler';
import type { DragConfirmData } from './day-scheduler';
import { WeekOverview } from './week-overview';
import { EntryDetailModal } from './entry-detail-modal';
import { CreateAppointmentModal } from './create-appointment-modal';
import { BlockModal } from './block-modal';
import { NextAvailableModal } from './next-available-modal';
import { DragConfirmModal } from './drag-confirm-modal';

interface AgendaTabProps {
  business: Business;
  employees: Employee[];
  services: BusinessService[];
}

export function AgendaTab({
  business,
  employees,
  services,
}: AgendaTabProps) {
  const {
    view,
    selectedDate,
    staffFilter,
    setView,
    setSelectedDate,
    setStaffFilter,
    navigateDay,
  } = useCalendarState();

  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { onBookingStatus, onCalendarUpdate } = useWebSocket();

  // Compute query range
  const { start, end } = useMemo(() => {
    if (view === 'day') {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      return {
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
      };
    }
    const weekStart = getWeekStart(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
    };
  }, [view, selectedDate]);

  const {
    data: entries = [],
    isLoading,
  } = useCalendarEntries({
    start,
    end,
    staffId: staffFilter,
  });

  // WebSocket real-time updates
  useEffect(() => {
    const unsubStatus = onBookingStatus(() => {
      queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
    });
    const unsubCalendar = onCalendarUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
    });
    return () => {
      unsubStatus();
      unsubCalendar();
    };
  }, [onBookingStatus, onCalendarUpdate, queryClient]);

  // Modal states
  const [selectedEntry, setSelectedEntry] =
    useState<CalendarEntry | null>(null);
  const [createModal, setCreateModal] = useState<{
    employeeId: string;
    startAt: Date;
  } | null>(null);
  const [blockModal, setBlockModal] = useState<{
    employeeId: string;
    startAt: Date;
  } | null>(null);
  const [nextAvailableOpen, setNextAvailableOpen] = useState(false);
  const [dragConfirm, setDragConfirm] =
    useState<DragConfirmData | null>(null);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: BookingStatus;
    }) => api.updateCalendarEntry(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['calendar-entries'],
      });
      setSelectedEntry(null);
      success('Statut mis à jour');
    },
    onError: () => showError('Erreur lors de la mise à jour'),
  });

  const dragMutation = useMutation({
    mutationFn: (data: DragConfirmData) =>
      api.updateCalendarEntry(data.entry.id, {
        startAt: data.newStartAt,
        endAt: data.newEndAt,
        employeeId: data.newEmployeeId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['calendar-entries'],
      });
      setDragConfirm(null);
      success('Rendez-vous déplacé');
    },
    onError: (err: Error) => {
      setDragConfirm(null);
      if (err.message?.includes('Conflit')) {
        showError('Créneau indisponible — conflit horaire');
      } else {
        showError('Erreur lors du déplacement');
      }
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => api.deleteCalendarBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['calendar-entries'],
      });
      setSelectedEntry(null);
      success('Bloc supprimé');
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const handleEmptySlotClick = (
    employeeId: string,
    startAt: Date,
  ) => {
    setCreateModal({ employeeId, startAt });
  };

  const handleSlotFromFinder = (
    employeeId: string,
    startAt: Date,
    serviceId: string,
  ) => {
    setNextAvailableOpen(false);
    setCreateModal({ employeeId, startAt });
  };

  const dateLabel = useMemo(() => {
    if (view === 'day') {
      const isToday = isSameDay(selectedDate, new Date());
      const formatted = selectedDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return isToday ? `Aujourd'hui — ${formatted}` : formatted;
    }
    const ws = getWeekStart(selectedDate);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    return `${ws.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${we.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [view, selectedDate]);

  return (
    <div className="space-y-4">
      {/* Toolbar
          Mobile: stacked rows (nav+label / view+staff / actions grid 2 cols)
          Desktop: single flex-wrap row */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {/* Row 1: Date navigation + label */}
        <div className="flex items-center justify-between sm:contents">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDay('prev')}
              className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateDay('today')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => navigateDay('next')}
              className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-medium capitalize shrink-0 truncate ml-2 sm:ml-0">
            {dateLabel}
          </span>
        </div>

        <div className="hidden sm:block sm:flex-1" />

        {/* Row 2: View toggle + staff filter
            Toggle "Semaine" hidden on mobile (day view only) */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          <div className="hidden sm:flex bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                view === 'day'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                view === 'week'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semaine
            </button>
          </div>

          <select
            value={staffFilter ?? ''}
            onChange={(e) => setStaffFilter(e.target.value || null)}
            className="col-span-2 h-10 sm:h-9 rounded-lg border border-border bg-surface px-3 text-sm"
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

        {/* Row 3: Action buttons
            Mobile: grid 2 cols, Nouveau RDV full-width below
            Desktop: inline */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg w-full sm:w-auto"
            onClick={() =>
              setBlockModal({
                employeeId: employees[0]?.id ?? '',
                startAt: new Date(),
              })
            }
          >
            <Ban className="w-4 h-4 mr-1.5" />
            Bloquer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg w-full sm:w-auto"
            onClick={() => setNextAvailableOpen(true)}
          >
            <Search className="w-4 h-4 mr-1.5" />
            Trouver un créneau
          </Button>
          <Button
            size="sm"
            className="rounded-lg col-span-2 w-full sm:w-auto sm:col-span-1"
            onClick={() =>
              setCreateModal({
                employeeId: employees[0]?.id ?? '',
                startAt: new Date(),
              })
            }
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'day' ? (
            <motion.div
              key="day"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DayScheduler
                selectedDate={selectedDate}
                employees={employees}
                entries={entries}
                staffFilter={staffFilter}
                onEntryClick={setSelectedEntry}
                onEmptySlotClick={handleEmptySlotClick}
                onDragConfirm={setDragConfirm}
              />
            </motion.div>
          ) : (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WeekOverview
                weekStart={getWeekStart(selectedDate)}
                employees={employees}
                entries={entries}
                staffFilter={staffFilter}
                onDayClick={(date) => {
                  setSelectedDate(date);
                  setView('day');
                }}
                onEntryClick={setSelectedEntry}
                onEmptySlotClick={handleEmptySlotClick}
                onDragConfirm={setDragConfirm}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modals */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onStatusChange={async (id, status) => {
            await updateStatusMutation.mutateAsync({
              id,
              status,
            });
          }}
          onDelete={async (id) => {
            await deleteBlockMutation.mutateAsync(id);
          }}
          isUpdating={
            updateStatusMutation.isPending ||
            deleteBlockMutation.isPending
          }
        />
      )}

      {createModal && (
        <CreateAppointmentModal
          prefillEmployeeId={createModal.employeeId}
          prefillStartAt={createModal.startAt}
          employees={employees}
          services={services}
          onClose={() => setCreateModal(null)}
          onCreated={() => setCreateModal(null)}
        />
      )}

      {blockModal && (
        <BlockModal
          prefillEmployeeId={blockModal.employeeId}
          prefillStartAt={blockModal.startAt}
          employees={employees}
          onClose={() => setBlockModal(null)}
          onCreated={() => setBlockModal(null)}
        />
      )}

      {dragConfirm && (
        <DragConfirmModal
          data={dragConfirm}
          isLoading={dragMutation.isPending}
          onConfirm={() => dragMutation.mutate(dragConfirm)}
          onCancel={() => setDragConfirm(null)}
        />
      )}

      {nextAvailableOpen && (
        <NextAvailableModal
          employees={employees}
          services={services}
          currentEntries={entries}
          onClose={() => setNextAvailableOpen(false)}
          onSlotSelected={handleSlotFromFinder}
        />
      )}
    </div>
  );
}
