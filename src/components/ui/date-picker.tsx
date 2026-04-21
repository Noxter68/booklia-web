'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, isBefore, startOfDay, isAfter, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onChange: (range: { start: Date | undefined; end: Date | undefined }) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  minDate?: Date;
  disabled?: boolean;
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function CalendarGrid({
  month,
  selected,
  rangeStart,
  rangeEnd,
  onSelect,
  minDate,
  maxDate,
}: {
  month: Date;
  selected?: Date;
  rangeStart?: Date;
  rangeEnd?: Date;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  // We want Monday = 0, so adjust
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  // Create empty cells for days before the month starts
  const emptyDays = Array(startDayOfWeek).fill(null);

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isAfter(date, startOfDay(maxDate))) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    return isAfter(date, rangeStart) && isBefore(date, rangeEnd);
  };

  const isRangeStart = (date: Date) => rangeStart && isSameDay(date, rangeStart);
  const isRangeEnd = (date: Date) => rangeEnd && isSameDay(date, rangeEnd);
  const isSelected = (date: Date) => selected && isSameDay(date, selected);
  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}
        {days.map((day) => {
          const disabled = isDateDisabled(day);
          const inRange = isInRange(day);
          const start = isRangeStart(day);
          const end = isRangeEnd(day);
          const sel = isSelected(day);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && onSelect(day)}
              disabled={disabled}
              className={`
                h-10 w-full text-sm font-medium transition-colors cursor-pointer
                ${disabled ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-primary/10'}
                ${today && !sel && !start && !end ? 'text-primary font-bold' : ''}
                ${inRange ? 'bg-primary/10' : ''}
                ${start ? 'bg-primary text-primary-foreground rounded-l-full' : ''}
                ${end ? 'bg-primary text-primary-foreground rounded-r-full' : ''}
                ${sel ? 'bg-primary text-primary-foreground rounded-full' : ''}
                ${start && end ? 'rounded-full' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  minDate,
  maxDate,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(value || new Date());

  const handleSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} bg-surface`}
      >
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? format(value, 'd MMMM yyyy', { locale: fr }) : placeholder}
        </span>
        {value && !disabled && (
          <X
            className="w-4 h-4 ml-auto text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 z-50 bg-surface border border-border rounded-2xl shadow-xl p-5 w-[320px]"
            >
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, -1))}
                  className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold capitalize">
                  {format(month, 'MMMM yyyy', { locale: fr })}
                </span>
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, 1))}
                  className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <CalendarGrid
                month={month}
                selected={value}
                onSelect={handleSelect}
                minDate={minDate}
                maxDate={maxDate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  startPlaceholder = 'Date de début',
  endPlaceholder = 'Date de fin',
  minDate,
  disabled,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(startDate || new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);

  const handleSelect = (date: Date) => {
    if (!selectingEnd || !startDate) {
      // Selecting start date
      onChange({ start: date, end: undefined });
      setSelectingEnd(true);
    } else {
      // Selecting end date
      if (isBefore(date, startDate)) {
        // If end date is before start, swap them
        onChange({ start: date, end: startDate });
      } else {
        onChange({ start: startDate, end: date });
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange({ start: undefined, end: undefined });
    setSelectingEnd(false);
  };

  const nextMonth = addMonths(month, 1);

  return (
    <div className="relative">
      {/* Trigger button */}
      <div className="flex items-stretch rounded-xl border border-border overflow-hidden bg-surface">
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setSelectingEnd(false);
            }
          }}
          disabled={disabled}
          className={`flex-1 flex items-center gap-3 px-4 py-3 transition-all cursor-pointer hover:bg-muted/30 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="text-left">
            <div className="text-xs text-muted-foreground">Début</div>
            <div className={startDate ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {startDate ? format(startDate, 'd MMM yyyy', { locale: fr }) : startPlaceholder}
            </div>
          </div>
        </button>

        <div className="w-px bg-border" />

        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (startDate) setSelectingEnd(true);
            }
          }}
          disabled={disabled}
          className={`flex-1 flex items-center gap-3 px-4 py-3 transition-all cursor-pointer hover:bg-muted/30 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="text-left">
            <div className="text-xs text-muted-foreground">Fin</div>
            <div className={endDate ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {endDate ? format(endDate, 'd MMM yyyy', { locale: fr }) : endPlaceholder}
            </div>
          </div>
        </button>

        {(startDate || endDate) && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="px-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 z-50 bg-surface border border-border rounded-2xl shadow-xl p-6"
            >
              {/* Selection indicator */}
              <div className="text-center mb-4 pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  {!selectingEnd
                    ? 'Sélectionnez la date de début'
                    : 'Sélectionnez la date de fin'}
                </p>
              </div>

              {/* Two month view */}
              <div className="flex gap-8">
                {/* First month */}
                <div className="w-[280px]">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setMonth(addMonths(month, -1))}
                      className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold capitalize">
                      {format(month, 'MMMM yyyy', { locale: fr })}
                    </span>
                    <div className="w-9" /> {/* Spacer */}
                  </div>
                  <CalendarGrid
                    month={month}
                    rangeStart={startDate}
                    rangeEnd={endDate}
                    onSelect={handleSelect}
                    minDate={minDate}
                  />
                </div>

                {/* Second month */}
                <div className="w-[280px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9" /> {/* Spacer */}
                    <span className="font-semibold capitalize">
                      {format(nextMonth, 'MMMM yyyy', { locale: fr })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMonth(addMonths(month, 1))}
                      className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <CalendarGrid
                    month={nextMonth}
                    rangeStart={startDate}
                    rangeEnd={endDate}
                    onSelect={handleSelect}
                    minDate={minDate}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
