'use client';

import type { Employee, CalendarEntry } from '@/types';
import { CalendarEntryBlock } from './calendar-entry-block';
import {
  pxOffsetToDateTime,
  CALENDAR_HEIGHT_PX,
  PX_PER_MINUTE,
} from '@/lib/calendar-utils';

const HOUR_LINES = Array.from({ length: 14 }, (_, i) => i);

interface StaffColumnProps {
  employee: Employee;
  entries: CalendarEntry[];
  optimisticEntries: CalendarEntry[];
  selectedDate: Date;
  justDraggedRef: React.RefObject<boolean>;
  onEntryClick: (entry: CalendarEntry) => void;
  onEmptySlotClick: (employeeId: string, startAt: Date) => void;
  onDragStart: (
    entry: CalendarEntry,
    e: React.PointerEvent,
    topPx: number,
  ) => void;
}

export function StaffColumn({
  employee,
  entries,
  optimisticEntries,
  selectedDate,
  justDraggedRef,
  onEntryClick,
  onEmptySlotClick,
  onDragStart,
}: StaffColumnProps) {
  const optimisticIds = new Set(optimisticEntries.map((e) => e.id));
  const merged = [
    ...entries.filter(
      (e) =>
        !optimisticIds.has(e.id) && e.employeeId === employee.id,
    ),
    ...optimisticEntries.filter(
      (e) => e.employeeId === employee.id,
    ),
  ];

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (justDraggedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pxOffset = e.clientY - rect.top;
    const startAt = pxOffsetToDateTime(pxOffset, selectedDate);
    onEmptySlotClick(employee.id, startAt);
  };

  const empName =
    `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim();

  return (
    <div className="flex-1 min-w-30 flex flex-col border-l border-border">
      {/* Column header */}
      <div className="sticky top-0 z-20 bg-surface border-b border-border px-2 py-1.5 text-center">
        <span className="text-xs font-medium text-muted-foreground truncate block">
          {empName}
        </span>
      </div>

      {/* Column body */}
      <div
        className="relative flex-1"
        style={{ height: CALENDAR_HEIGHT_PX }}
      >
        {/* Hour grid lines */}
        {HOUR_LINES.map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-border/50"
            style={{ top: i * 60 * PX_PER_MINUTE }}
          />
        ))}
        {/* Half-hour dashed lines */}
        {HOUR_LINES.map((i) => (
          <div
            key={`half-${i}`}
            className="absolute left-0 right-0 border-t border-dashed border-border/30"
            style={{ top: (i * 60 + 30) * PX_PER_MINUTE }}
          />
        ))}

        {/* Clickable background */}
        <div className="absolute inset-0" onClick={handleColumnClick} />

        {/* Entries */}
        {merged.map((entry) => (
          <CalendarEntryBlock
            key={entry.id}
            entry={entry}
            isOptimistic={optimisticIds.has(entry.id)}
            onClick={onEntryClick}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}
