'use client';

import type { CalendarEntry } from '@/types';
import {
  getTopPx,
  getHeightPx,
  STATUS_STYLES,
  BLOCK_STYLE,
  BLOCK_REASON_LABELS,
} from '@/lib/calendar-utils';

interface CalendarEntryBlockProps {
  entry: CalendarEntry;
  isOptimistic?: boolean;
  onClick: (entry: CalendarEntry) => void;
  onDragStart: (
    entry: CalendarEntry,
    event: React.PointerEvent,
    topPx: number,
  ) => void;
}

export function CalendarEntryBlock({
  entry,
  isOptimistic,
  onClick,
  onDragStart,
}: CalendarEntryBlockProps) {
  const topPx = getTopPx(entry.scheduledAt);
  const durationMin =
    (new Date(entry.scheduledEndAt).getTime() -
      new Date(entry.scheduledAt).getTime()) /
    60000;
  const heightPx = getHeightPx(durationMin);

  const isBlock = entry.kind === 'BLOCK';
  const styleClass = isBlock
    ? BLOCK_STYLE
    : (STATUS_STYLES[entry.status] ?? STATUS_STYLES.PENDING);

  const startTime = entry.scheduledAt.slice(11, 16);
  const title = isBlock
    ? (BLOCK_REASON_LABELS[entry.blockReason!] ?? 'Indisponible')
    : (entry.businessService?.name ?? 'Rendez-vous');
  const clientName =
    !isBlock ? (entry.requester?.name ?? '') : '';
  const employeeName = entry.employee
    ? `${entry.employee.firstName ?? ''} ${entry.employee.lastName ?? ''}`.trim()
    : '';

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-4 px-1.5 py-0.5 overflow-hidden cursor-grab select-none transition-opacity ${styleClass} ${isOptimistic ? 'opacity-70 ring-2 ring-primary/40' : ''}`}
      style={{ top: topPx, height: heightPx, zIndex: 10 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(entry);
      }}
      onPointerDown={(e) => onDragStart(entry, e, topPx)}
    >
      <div className="text-[11px] font-semibold truncate leading-tight">
        {startTime} {title}
      </div>
      {employeeName && heightPx > 28 && (
        <div className="text-[10px] truncate opacity-70 font-medium">
          {employeeName}
        </div>
      )}
      {clientName && heightPx > 46 && (
        <div className="text-[10px] truncate opacity-60">
          {clientName}
        </div>
      )}
    </div>
  );
}
