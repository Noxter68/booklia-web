'use client';

import { useState, useCallback, useEffect } from 'react';

export type CalendarView = 'day' | 'week';

export interface CalendarState {
  view: CalendarView;
  selectedDate: Date;
  staffFilter: string | null;
  setView: (v: CalendarView) => void;
  setSelectedDate: (d: Date) => void;
  setStaffFilter: (id: string | null) => void;
  navigateDay: (direction: 'prev' | 'next' | 'today') => void;
}

/** Tailwind sm breakpoint (640px) — below this we default to day view. */
function getDefaultView(): CalendarView {
  if (typeof window === 'undefined') return 'week';
  return window.innerWidth < 640 ? 'day' : 'week';
}

export function useCalendarState(): CalendarState {
  const [view, setView] = useState<CalendarView>(getDefaultView);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [staffFilter, setStaffFilter] = useState<string | null>(null);

  // Force day view when viewport drops below sm breakpoint (toggle is hidden
   // there). Listening to resize keeps the state coherent if the user
   // switches between portrait/landscape or resizes a browser window.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => {
      if (mq.matches) setView('day');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const navigateDay = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      if (direction === 'today') {
        setSelectedDate(new Date());
        return;
      }
      setSelectedDate((prev) => {
        const d = new Date(prev);
        if (view === 'day') {
          d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
        } else {
          d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
        }
        return d;
      });
    },
    [view],
  );

  return {
    view,
    selectedDate,
    staffFilter,
    setView,
    setSelectedDate,
    setStaffFilter,
    navigateDay,
  };
}
