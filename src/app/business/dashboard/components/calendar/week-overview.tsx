'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { CalendarEntry, BookingStatus, BlockReason, Employee } from '@/types';
import {
  isSameDay,
  toLocalDateString,
  pxOffsetToDateTime,
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  BLOCK_REASON_LABELS,
  SNAP_MINUTES,
  groupOverlappingEntries,
} from '@/lib/calendar-utils';
import { useDragEntry } from '@/hooks/useDragEntry';
import { OverlapPopover } from './overlap-popover';
import type { DragConfirmData } from './day-scheduler';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i,
);
const PX_PER_MIN_WEEK = 1.2;
const WEEK_COL_HEIGHT =
  (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60 * PX_PER_MIN_WEEK;

const WEEK_ENTRY_STYLES: Record<BookingStatus, string> = {
  PENDING:
    'border-l-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100',
  ACCEPTED:
    'border-l-emerald-500 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100',
  COMPLETED:
    'border-l-blue-500 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100',
  CANCELED:
    'border-l-stone-300 border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 opacity-60',
  REJECTED:
    'border-l-red-300 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-500 opacity-60',
  NO_SHOW:
    'border-l-orange-400 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100',
};

const WEEK_BLOCK_STYLE =
  'border-l-stone-400 border-stone-400 dark:border-stone-500 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300';

interface WeekOverviewProps {
  weekStart: Date;
  employees: Employee[];
  entries: CalendarEntry[];
  staffFilter: string | null;
  onDayClick: (date: Date) => void;
  onEntryClick?: (entry: CalendarEntry) => void;
  onEmptySlotClick?: (employeeId: string, startAt: Date) => void;
  onDragConfirm?: (data: DragConfirmData) => void;
}

export function WeekOverview({
  weekStart,
  employees,
  entries,
  staffFilter,
  onDayClick,
  onEntryClick,
  onEmptySlotClick,
  onDragConfirm,
}: WeekOverviewProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const [optimisticEntries, setOptimisticEntries] = useState<CalendarEntry[]>([]);
  const columnsRef = useRef<HTMLDivElement>(null);

  const visibleEmployees = staffFilter
    ? employees.filter((e) => e.id === staffFilter)
    : employees.filter((e) => e.isActive);

  // For week drag, column width = one day column width
  const columnWidth = columnsRef.current
    ? (columnsRef.current.clientWidth ?? 800) / 7
    : 200;

  const handleOptimisticUpdate = useCallback(
    (entry: CalendarEntry) => {
      setOptimisticEntries((prev) => [
        ...prev.filter((e) => e.id !== entry.id),
        entry,
      ]);
    },
    [],
  );

  const handleRollback = useCallback(() => {
    setOptimisticEntries([]);
  }, []);

  const handleDragEnd = useCallback(
    (data: DragConfirmData) => {
      setOptimisticEntries([]);
      onDragConfirm?.(data);
    },
    [onDragConfirm],
  );

  const { startDrag, isDragging, justDraggedRef } = useDragEntry({
    selectedDate: weekStart,
    employees: visibleEmployees,
    columnWidth,
    dayColumns: days,
    pxPerMinute: PX_PER_MIN_WEEK,
    onOptimisticUpdate: handleOptimisticUpdate,
    onRollback: handleRollback,
    onDragEnd: handleDragEnd,
  });

  useEffect(() => {
    setOptimisticEntries([]);
  }, [entries]);

  const entriesByDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    if (staffFilter && entry.employeeId !== staffFilter) continue;
    const day = toLocalDateString(new Date(entry.scheduledAt));
    const list = entriesByDay.get(day) || [];
    list.push(entry);
    entriesByDay.set(day, list);
  }

  // Merge optimistic entries
  const optimisticIds = new Set(optimisticEntries.map((e) => e.id));

  const handleColumnClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    if (!onEmptySlotClick || justDraggedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pxOffset = e.clientY - rect.top;
    const rawMinutes = pxOffset / PX_PER_MIN_WEEK;
    const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const totalMinutes = CALENDAR_START_HOUR * 60 + snappedMinutes;
    const startAt = new Date(day);
    startAt.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    // Use first visible employee as default
    const empId = visibleEmployees[0]?.id ?? '';
    onEmptySlotClick(empId, startAt);
  };

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <div
        className={`flex overflow-auto ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ maxHeight: '75vh' }}
      >
        {/* Time gutter */}
        <div
          className="w-14 shrink-0 border-r border-border relative"
          style={{ marginTop: 40 }}
        >
          <div style={{ height: WEEK_COL_HEIGHT }} className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-right pr-2"
                style={{
                  top:
                    (h - CALENDAR_START_HOUR) * 60 * PX_PER_MIN_WEEK - 6,
                }}
              >
                <span className="text-[10px] text-muted-foreground">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div ref={columnsRef} className="flex flex-1">
          {days.map((day, i) => {
            const dateStr = toLocalDateString(day);
            const isToday = isSameDay(day, today);
            const rawDayEntries = entriesByDay.get(dateStr) || [];
            // Merge with optimistic
            const dayEntries = [
              ...rawDayEntries.filter((e) => !optimisticIds.has(e.id)),
              ...optimisticEntries.filter(
                (e) => toLocalDateString(new Date(e.scheduledAt)) === dateStr,
              ),
            ];

            return (
              <div
                key={dateStr}
                className="flex-1 min-w-24 flex flex-col border-l border-border"
              >
                {/* Day header */}
                <button
                  onClick={() => onDayClick(day)}
                  className={`sticky top-0 z-10 px-2 py-2 text-center border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                    isToday
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-surface border-border'
                  }`}
                >
                  <div className="text-[10px] uppercase text-muted-foreground font-medium">
                    {DAY_NAMES[i]}
                  </div>
                  <div
                    className={`text-lg font-bold leading-tight ${
                      isToday ? 'text-primary' : ''
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </button>

                {/* Time grid + entries */}
                <div
                  className="relative cursor-pointer"
                  style={{ height: WEEK_COL_HEIGHT }}
                  onClick={(e) => handleColumnClick(day, e)}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/40"
                      style={{
                        top:
                          (h - CALENDAR_START_HOUR) * 60 * PX_PER_MIN_WEEK,
                      }}
                    />
                  ))}

                  {/* Entries (grouped by overlap) */}
                  {groupOverlappingEntries(dayEntries).map((group) => {
                    const entry = group.primary;
                    const startDate = new Date(entry.scheduledAt);
                    const endDate = new Date(entry.scheduledEndAt);
                    const startMin =
                      startDate.getHours() * 60 +
                      startDate.getMinutes() -
                      CALENDAR_START_HOUR * 60;
                    const durationMin =
                      (endDate.getTime() - startDate.getTime()) / 60000;
                    const top = Math.max(0, startMin * PX_PER_MIN_WEEK);
                    const height = Math.max(
                      durationMin * PX_PER_MIN_WEEK,
                      18,
                    );
                    const isBlock = entry.kind === 'BLOCK';
                    const isOpt = optimisticIds.has(entry.id);
                    const styleClass = isBlock
                      ? WEEK_BLOCK_STYLE
                      : (WEEK_ENTRY_STYLES[entry.status] ??
                        WEEK_ENTRY_STYLES.PENDING);
                    const label = isBlock
                      ? (BLOCK_REASON_LABELS[entry.blockReason as BlockReason] ?? 'Block')
                      : (entry.businessService?.name ?? 'RDV');
                    const time = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
                    const empName = entry.employee
                      ? `${entry.employee.firstName ?? ''} ${entry.employee.lastName ?? ''}`.trim()
                      : '';

                    return (
                      <div
                        key={entry.id}
                        className={`absolute left-0.5 right-0.5 rounded-md border-l-4 border px-1.5 py-0.5 overflow-visible cursor-grab select-none hover:brightness-95 transition-all ${styleClass} ${isOpt ? 'opacity-70 ring-2 ring-primary/40' : ''}`}
                        style={{ top, height, zIndex: 5 + group.overlapCount }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEntryClick?.(entry);
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(entry, e, top);
                        }}
                      >
                        <div className="text-[11px] font-bold truncate leading-tight">
                          {time} {label}
                        </div>
                        {empName && height > 26 && (
                          <div className="text-[10px] truncate font-semibold opacity-75">
                            — {empName}
                          </div>
                        )}

                        {group.overlapCount > 0 && onEntryClick && (
                          <OverlapPopover
                            entries={group.entries}
                            onEntryClick={onEntryClick}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
