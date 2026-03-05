'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Employee, CalendarEntry } from '@/types';
import { TimeGutter } from './time-gutter';
import { StaffColumn } from './staff-column';
import { useDragEntry } from '@/hooks/useDragEntry';
import {
  PX_PER_MINUTE,
  CALENDAR_START_HOUR,
  CALENDAR_HEIGHT_PX,
  isSameDay,
} from '@/lib/calendar-utils';

interface DragConfirmData {
  entry: CalendarEntry;
  newStartAt: string;
  newEndAt: string;
  newEmployeeId: string;
  newEmployeeName: string;
}

interface DaySchedulerProps {
  selectedDate: Date;
  employees: Employee[];
  entries: CalendarEntry[];
  staffFilter: string | null;
  onEntryClick: (entry: CalendarEntry) => void;
  onEmptySlotClick: (employeeId: string, startAt: Date) => void;
  onDragConfirm: (data: DragConfirmData) => void;
}

export function DayScheduler({
  selectedDate,
  employees,
  entries,
  staffFilter,
  onEntryClick,
  onEmptySlotClick,
  onDragConfirm,
}: DaySchedulerProps) {
  const [optimisticEntries, setOptimisticEntries] = useState<
    CalendarEntry[]
  >([]);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [nowTopPx, setNowTopPx] = useState<number | null>(null);

  const visibleEmployees = staffFilter
    ? employees.filter((e) => e.id === staffFilter)
    : employees.filter((e) => e.isActive);

  const columnWidth =
    visibleEmployees.length > 0
      ? (calendarRef.current?.clientWidth ?? 800) /
        visibleEmployees.length
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
      // Reset optimistic state and pass to parent for confirmation modal
      setOptimisticEntries([]);
      onDragConfirm(data);
    },
    [onDragConfirm],
  );

  const { startDrag, isDragging, justDraggedRef } = useDragEntry({
    selectedDate,
    employees: visibleEmployees,
    columnWidth,
    onOptimisticUpdate: handleOptimisticUpdate,
    onRollback: handleRollback,
    onDragEnd: handleDragEnd,
  });

  // "Now" indicator line
  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      if (isSameDay(now, selectedDate)) {
        const minutes =
          now.getHours() * 60 +
          now.getMinutes() -
          CALENDAR_START_HOUR * 60;
        setNowTopPx(minutes * PX_PER_MINUTE);
      } else {
        setNowTopPx(null);
      }
    };
    updateNow();
    const interval = setInterval(updateNow, 60_000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Clear optimistic state when entries change from server
  useEffect(() => {
    setOptimisticEntries([]);
  }, [entries]);

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <div
        className="flex overflow-auto"
        style={{ maxHeight: '75vh' }}
      >
        {/* Time gutter */}
        <TimeGutter />

        {/* Columns container */}
        <div
          ref={calendarRef}
          className={`flex flex-1 relative ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ minWidth: 0 }}
        >
          {visibleEmployees.map((emp) => (
            <StaffColumn
              key={emp.id}
              employee={emp}
              entries={entries}
              optimisticEntries={optimisticEntries}
              selectedDate={selectedDate}
              justDraggedRef={justDraggedRef}
              onEntryClick={onEntryClick}
              onEmptySlotClick={onEmptySlotClick}
              onDragStart={(entry, e, topPx) =>
                startDrag(entry, e, topPx)
              }
            />
          ))}

          {/* Now indicator */}
          {nowTopPx !== null && nowTopPx > 0 && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
              style={{ top: nowTopPx }}
            >
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full -mt-1 -ml-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { DragConfirmData };
