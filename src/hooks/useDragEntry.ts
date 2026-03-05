'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import type { CalendarEntry } from '@/types';
import { pxOffsetToDateTime, toLocalDateString, SNAP_MINUTES } from '@/lib/calendar-utils';

interface DragState {
  entryId: string;
  originalEntry: CalendarEntry;
  dragStartY: number;
  dragStartX: number;
  entryTopPx: number;
  entryDate: Date;
  originalDayIndex: number;
  pendingEmployeeId: string | null;
  pendingDate: Date | null;
  abortController: AbortController;
}

interface DragEndData {
  entry: CalendarEntry;
  newStartAt: string;
  newEndAt: string;
  newEmployeeId: string;
  newEmployeeName: string;
}

interface UseDragEntryOptions {
  selectedDate: Date;
  employees: { id: string; firstName?: string; lastName?: string }[];
  columnWidth: number;
  /** When set, horizontal drag changes the day instead of the employee (week view) */
  dayColumns?: Date[];
  onOptimisticUpdate: (entry: CalendarEntry) => void;
  onRollback: () => void;
  onDragEnd: (data: DragEndData) => void;
}

const DRAG_THRESHOLD = 4;

export function useDragEntry(options: UseDragEntryOptions) {
  const optionsRef = useRef(options);
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const didDragRef = useRef(false);
  const justDraggedRef = useRef(false);

  useEffect(() => {
    optionsRef.current = options;
  });

  const startDrag = useCallback(
    (
      entry: CalendarEntry,
      event: React.PointerEvent,
      entryTopPx: number,
    ) => {
      event.preventDefault();
      didDragRef.current = false;

      const ac = new AbortController();
      const entryDate = new Date(entry.scheduledAt);
      entryDate.setHours(0, 0, 0, 0);

      const { dayColumns } = optionsRef.current;
      let originalDayIndex = -1;
      if (dayColumns) {
        const entryDateStr = toLocalDateString(entryDate);
        originalDayIndex = dayColumns.findIndex(
          (d) => toLocalDateString(d) === entryDateStr,
        );
      }

      dragRef.current = {
        entryId: entry.id,
        originalEntry: entry,
        dragStartY: event.clientY,
        dragStartX: event.clientX,
        entryTopPx,
        entryDate,
        originalDayIndex,
        pendingEmployeeId: null,
        pendingDate: null,
        abortController: ac,
      };
      setIsDragging(true);

      window.addEventListener(
        'pointermove',
        (e: PointerEvent) => {
          if (!dragRef.current) return;
          const state = dragRef.current;
          const { columnWidth, employees, dayColumns, onOptimisticUpdate } =
            optionsRef.current;

          const deltaY = e.clientY - state.dragStartY;
          const deltaX = e.clientX - state.dragStartX;

          if (!didDragRef.current) {
            if (
              Math.abs(deltaX) < DRAG_THRESHOLD &&
              Math.abs(deltaY) < DRAG_THRESHOLD
            )
              return;
            didDragRef.current = true;
          }

          // Compute new date based on mode
          let baseDate = state.entryDate;
          let newEmployeeId = state.originalEntry.employeeId;

          if (dayColumns && state.originalDayIndex >= 0) {
            // Week mode: horizontal = change day
            const columnDelta = Math.round(deltaX / columnWidth);
            const newDayIndex = Math.max(
              0,
              Math.min(dayColumns.length - 1, state.originalDayIndex + columnDelta),
            );
            baseDate = dayColumns[newDayIndex];
            state.pendingDate = baseDate;
          } else {
            // Day mode: horizontal = change employee
            const columnDelta = Math.round(deltaX / columnWidth);
            const currentColIndex = employees.findIndex(
              (emp) => emp.id === state.originalEntry.employeeId,
            );
            const newColIndex = Math.max(
              0,
              Math.min(employees.length - 1, currentColIndex + columnDelta),
            );
            newEmployeeId =
              employees[newColIndex]?.id ?? state.originalEntry.employeeId;
          }

          state.pendingEmployeeId = newEmployeeId;

          const newTopPx = state.entryTopPx + deltaY;
          const newStart = pxOffsetToDateTime(newTopPx, baseDate, SNAP_MINUTES);

          const durationMs =
            new Date(state.originalEntry.scheduledEndAt).getTime() -
            new Date(state.originalEntry.scheduledAt).getTime();
          const newEnd = new Date(newStart.getTime() + durationMs);

          onOptimisticUpdate({
            ...state.originalEntry,
            scheduledAt: newStart.toISOString(),
            scheduledEndAt: newEnd.toISOString(),
            employeeId: newEmployeeId,
          });
        },
        { signal: ac.signal },
      );

      window.addEventListener(
        'pointerup',
        (e: PointerEvent) => {
          ac.abort();
          setIsDragging(false);

          if (!dragRef.current) return;
          const state = dragRef.current;
          const wasDrag = didDragRef.current;
          dragRef.current = null;
          didDragRef.current = false;

          if (!wasDrag) return;

          // Flag to suppress click events that fire right after pointerup
          justDraggedRef.current = true;
          requestAnimationFrame(() => { justDraggedRef.current = false; });

          const { employees, dayColumns, columnWidth, onRollback, onDragEnd } =
            optionsRef.current;

          const deltaY = e.clientY - state.dragStartY;
          const deltaX = e.clientX - state.dragStartX;

          let baseDate = state.entryDate;
          let newEmployeeId = state.originalEntry.employeeId;

          if (dayColumns && state.originalDayIndex >= 0) {
            const columnDelta = Math.round(deltaX / columnWidth);
            const newDayIndex = Math.max(
              0,
              Math.min(dayColumns.length - 1, state.originalDayIndex + columnDelta),
            );
            baseDate = dayColumns[newDayIndex];
          } else {
            const columnDelta = Math.round(deltaX / columnWidth);
            const currentColIndex = employees.findIndex(
              (emp) => emp.id === state.originalEntry.employeeId,
            );
            const newColIndex = Math.max(
              0,
              Math.min(employees.length - 1, currentColIndex + columnDelta),
            );
            newEmployeeId =
              employees[newColIndex]?.id ?? state.originalEntry.employeeId;
          }

          const newTopPx = state.entryTopPx + deltaY;
          const newStart = pxOffsetToDateTime(newTopPx, baseDate, SNAP_MINUTES);
          const durationMs =
            new Date(state.originalEntry.scheduledEndAt).getTime() -
            new Date(state.originalEntry.scheduledAt).getTime();
          const newEnd = new Date(newStart.getTime() + durationMs);

          if (
            newStart.toISOString() === state.originalEntry.scheduledAt &&
            newEmployeeId === state.originalEntry.employeeId
          ) {
            onRollback();
            return;
          }

          const newEmp = employees.find((emp) => emp.id === newEmployeeId);

          onDragEnd({
            entry: state.originalEntry,
            newStartAt: newStart.toISOString(),
            newEndAt: newEnd.toISOString(),
            newEmployeeId,
            newEmployeeName: newEmp
              ? `${newEmp.firstName ?? ''} ${newEmp.lastName ?? ''}`.trim()
              : '',
          });
        },
        { signal: ac.signal },
      );
    },
    [],
  );

  return { startDrag, isDragging, justDraggedRef };
}
