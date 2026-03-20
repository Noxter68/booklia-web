'use client';

import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  PX_PER_MINUTE,
  CALENDAR_HEIGHT_PX,
} from '@/lib/calendar-utils';

const hours = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
  (_, i) => CALENDAR_START_HOUR + i,
);

export function TimeGutter() {
  return (
    <div
      className="relative flex-shrink-0 w-14 select-none"
      style={{ height: CALENDAR_HEIGHT_PX }}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute right-2 text-xs text-muted-foreground leading-none"
          style={{
            top: (hour - CALENDAR_START_HOUR) * 60 * PX_PER_MINUTE - 6,
          }}
        >
          {String(hour).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
}
