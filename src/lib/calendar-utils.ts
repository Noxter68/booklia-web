import type {
  BookingStatus,
  BlockReason,
  CalendarEntry,
  Employee,
} from '@/types';

// Grid constants
export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 20;
export const SNAP_MINUTES = 10;
export const PX_PER_MINUTE = 1.5;
export const CALENDAR_TOTAL_MINUTES =
  (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
export const CALENDAR_HEIGHT_PX = CALENDAR_TOTAL_MINUTES * PX_PER_MINUTE;

// Status labels (French)
export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Confirmé',
  COMPLETED: 'Terminé',
  CANCELED: 'Annulé',
  REJECTED: 'Refusé',
  NO_SHOW: 'Absent',
};

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  BREAK: 'Pause',
  UNAVAILABLE: 'Indisponible',
  PERSONAL: 'Personnel',
  CLOSED: 'Fermé',
};

// Status colors for calendar entry blocks
export const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING:
    'border-l-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100',
  ACCEPTED:
    'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100',
  COMPLETED:
    'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100',
  CANCELED:
    'border-l-stone-300 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 opacity-60',
  REJECTED:
    'border-l-red-300 bg-red-50 dark:bg-red-900/20 text-red-500 opacity-60',
  NO_SHOW:
    'border-l-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100',
};

export const BLOCK_STYLE =
  'border-l-stone-400 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300';

// --- Pure utility functions ---

/** "HH:MM" → total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Total minutes from midnight → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Round minutes to nearest snap interval */
export function roundToSnap(
  minutes: number,
  snap = SNAP_MINUTES,
): number {
  return Math.round(minutes / snap) * snap;
}

/** Top offset in px for a given ISO datetime string */
export function getTopPx(isoDate: string): number {
  const d = new Date(isoDate);
  const minutesSinceStart =
    d.getHours() * 60 + d.getMinutes() - CALENDAR_START_HOUR * 60;
  return Math.max(0, minutesSinceStart * PX_PER_MINUTE);
}

/** Height in px for a duration in minutes (min 20px) */
export function getHeightPx(durationMinutes: number): number {
  return Math.max(durationMinutes * PX_PER_MINUTE, 20);
}

/** Convert a Y pixel offset within the calendar to a Date with snapped time */
export function pxOffsetToDateTime(
  pxOffset: number,
  baseDate: Date,
  snap = SNAP_MINUTES,
): Date {
  const rawMinutes = pxOffset / PX_PER_MINUTE;
  const snappedMinutes = roundToSnap(rawMinutes, snap);
  const totalMinutes = CALENDAR_START_HOUR * 60 + snappedMinutes;
  const result = new Date(baseDate);
  result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return result;
}

/** Local date → "YYYY-MM-DD" */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Check if two dates are the same calendar day (local time) */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Get Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// --- Interval merging & slot finding ---

interface BusyInterval {
  start: number;
  end: number;
}

/** Merge overlapping intervals, sorted by start */
export function mergeIntervals(
  intervals: BusyInterval[],
): BusyInterval[] {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

export interface SlotResult {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  employeeId: string;
  employeeName: string;
}

/** Find the first available slot across days and employees */
export function findNextAvailableSlot(
  entries: CalendarEntry[],
  employees: Employee[],
  durationMin: number,
  rangeStart: Date,
  rangeEnd: Date,
  snap = SNAP_MINUTES,
): SlotResult | null {
  // Build busy map: "employeeId:YYYY-MM-DD" → intervals in minutes
  const busyMap = new Map<string, BusyInterval[]>();
  for (const entry of entries) {
    if (
      entry.status === 'CANCELED' ||
      entry.status === 'REJECTED'
    )
      continue;
    const startDate = new Date(entry.scheduledAt);
    const endDate = new Date(entry.scheduledEndAt);
    const day = toLocalDateString(startDate);
    const key = `${entry.employeeId}:${day}`;
    const startMin = startDate.getHours() * 60 + startDate.getMinutes();
    const endMin = endDate.getHours() * 60 + endDate.getMinutes();
    const existing = busyMap.get(key) || [];
    existing.push({ start: startMin, end: endMin });
    busyMap.set(key, existing);
  }

  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= rangeEnd) {
    const dayOfWeek = cursor.getDay();
    const dateStr = toLocalDateString(cursor);

    for (const emp of employees) {
      if (!emp.isActive) continue;
      const avail = emp.availabilities?.find(
        (a) => a.dayOfWeek === dayOfWeek,
      );
      if (!avail) continue;

      const workStart = timeToMinutes(avail.startTime);
      const workEnd = timeToMinutes(avail.endTime);
      const key = `${emp.id}:${dateStr}`;
      const busy = mergeIntervals(busyMap.get(key) || []);

      let candidate = roundToSnap(workStart, snap);
      while (candidate + durationMin <= workEnd) {
        const candidateEnd = candidate + durationMin;
        const conflicts = busy.some(
          (b) => candidate < b.end && candidateEnd > b.start,
        );
        if (!conflicts) {
          return {
            date: dateStr,
            time: minutesToTime(candidate),
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
          };
        }
        candidate += snap;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

// --- Overlap grouping for week view ---

export interface EntryGroup {
  primary: CalendarEntry;
  entries: CalendarEntry[];
  overlapCount: number;
}

/** Group overlapping calendar entries within a single day */
export function groupOverlappingEntries(
  dayEntries: CalendarEntry[],
): EntryGroup[] {
  if (dayEntries.length === 0) return [];

  const sorted = [...dayEntries].sort((a, b) => {
    const diff =
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    if (diff !== 0) return diff;
    if (a.kind !== b.kind) return a.kind === 'BLOCK' ? 1 : -1;
    return (a.employee?.lastName ?? '').localeCompare(
      b.employee?.lastName ?? '',
    );
  });

  const groups: EntryGroup[] = [];
  let current: CalendarEntry[] = [sorted[0]];
  let clusterEnd = new Date(sorted[0].scheduledEndAt).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i];
    const entryStart = new Date(entry.scheduledAt).getTime();

    if (entryStart < clusterEnd) {
      current.push(entry);
      clusterEnd = Math.max(
        clusterEnd,
        new Date(entry.scheduledEndAt).getTime(),
      );
    } else {
      groups.push({
        primary: current[0],
        entries: current,
        overlapCount: current.length - 1,
      });
      current = [entry];
      clusterEnd = new Date(entry.scheduledEndAt).getTime();
    }
  }

  groups.push({
    primary: current[0],
    entries: current,
    overlapCount: current.length - 1,
  });

  return groups;
}
