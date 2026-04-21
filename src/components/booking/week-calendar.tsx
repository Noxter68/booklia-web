'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DaySlots {
  date: string;
  slots: TimeSlot[];
}

interface WeekCalendarProps {
  availableSlots: DaySlots[];
  selectedDate: string;
  selectedTime: string;
  onSelectSlot: (date: string, time: string) => void;
  isLoading?: boolean;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
}

export function WeekCalendar({
  availableSlots,
  selectedDate,
  selectedTime,
  onSelectSlot,
  isLoading = false,
  weekOffset,
  onWeekChange,
}: WeekCalendarProps) {
  const [direction, setDirection] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get the dates for the current week view
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }, [weekOffset]);

  // Scroll to beginning when week changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [weekOffset]);

  // Format day header
  const formatDayHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dayNum = date.getDate();

    if (dateStr === todayStr) {
      return { weekday: "Auj.", dayNum, isSpecial: true };
    }
    if (dateStr === tomorrowStr) {
      return { weekday: "Dem.", dayNum, isSpecial: false };
    }

    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', ''),
      dayNum,
      isSpecial: false
    };
  };

  // Get slots for a specific date
  const getSlotsForDate = (date: string): TimeSlot[] => {
    const daySlots = availableSlots.find(d => d.date === date);
    return daySlots?.slots || [];
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    if (weekOffset > 0) {
      setDirection(-1);
      onWeekChange(weekOffset - 1);
    }
  };

  const goToNextWeek = () => {
    setDirection(1);
    onWeekChange(weekOffset + 1);
  };

  // Get month/year for header
  const headerText = useMemo(() => {
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);

    const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
    const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${year}`;
    }
    return `${startMonth.slice(0, 3)} - ${endMonth.slice(0, 3)} ${year}`;
  }, [weekDates]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPreviousWeek}
          disabled={weekOffset === 0}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            weekOffset === 0
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'bg-muted hover:bg-muted/80 text-foreground cursor-pointer'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm font-medium">
          {headerText}
        </span>

        <button
          onClick={goToNextWeek}
          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={weekOffset}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide -mx-1 px-1"
              >
                <div className="grid grid-cols-7 gap-0.5 min-w-[400px]">
                  {/* Day Headers */}
                  {weekDates.map((date) => {
                    const { weekday, dayNum, isSpecial } = formatDayHeader(date);
                    const today = new Date().toISOString().split('T')[0];
                    const isToday = date === today;
                    const hasAvailableSlots = getSlotsForDate(date).some(s => s.available);

                    return (
                      <div
                        key={`header-${date}`}
                        className="text-center py-2"
                      >
                        <div className={`text-[10px] uppercase tracking-wide mb-0.5 ${
                          isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                        }`}>
                          {weekday}
                        </div>
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : hasAvailableSlots
                            ? 'text-foreground'
                            : 'text-muted-foreground/50'
                        }`}>
                          {dayNum}
                        </div>
                      </div>
                    );
                  })}

                  {/* Time Slots Grid */}
                  {weekDates.map((date) => {
                    const slots = getSlotsForDate(date);
                    const availableSlots = slots.filter(s => s.available);

                    return (
                      <div key={`slots-${date}`} className="min-h-[160px] border-t border-border/50 pt-1">
                        {slots.length === 0 || availableSlots.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground/40 text-center py-6">
                            —
                          </div>
                        ) : (
                          <div className="space-y-0.5 px-0.5">
                            {availableSlots.map((slot) => {
                              const isSelected = selectedDate === date && selectedTime === slot.time;

                              return (
                                <button
                                  key={`${date}-${slot.time}`}
                                  onClick={() => onSelectSlot(date, slot.time)}
                                  className={`w-full text-[11px] py-1.5 rounded-md transition-all font-medium ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground shadow-sm'
                                      : 'bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer'
                                  }`}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile scroll hint */}
      <div className="sm:hidden text-center mt-2">
        <span className="text-[10px] text-muted-foreground/60">
          ← Glissez pour voir plus →
        </span>
      </div>
    </div>
  );
}
