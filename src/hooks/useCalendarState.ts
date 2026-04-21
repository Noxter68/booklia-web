'use client';

import { useState, useCallback } from 'react';

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

export function useCalendarState(): CalendarState {
  const [view, setView] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [staffFilter, setStaffFilter] = useState<string | null>(null);

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
