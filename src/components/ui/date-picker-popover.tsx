'use client';

import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr, enUS, ptBR, type Locale } from 'date-fns/locale';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-day-picker/style.css';

const localeMap: Record<string, Locale> = {
  fr,
  en: enUS,
  pt: ptBR,
};

interface DatePickerPopoverProps {
  /** ISO date string (YYYY-MM-DD) or empty */
  value: string;
  onChange: (isoDate: string) => void;
  locale?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/**
 * Locale-aware date picker built on react-day-picker.
 * Renders a button showing the formatted date and a popover calendar on click.
 * Outputs ISO YYYY-MM-DD strings for easy <input type="date"> compatibility.
 */
export function DatePickerPopover({
  value,
  onChange,
  locale = 'fr',
  minDate,
  maxDate,
  placeholder,
  className,
  required,
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dateLocale = localeMap[locale] ?? fr;
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const isValidSelected = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayLabel = isValidSelected
    ? format(isValidSelected, 'PPP', { locale: dateLocale })
    : placeholder ?? '—';

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-left transition-colors',
          'hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring',
          !isValidSelected && 'text-muted-foreground',
        )}
        aria-required={required}
      >
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate">{displayLabel}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-border bg-surface p-3 shadow-xl">
          <DayPicker
            mode="single"
            selected={isValidSelected}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, 'yyyy-MM-dd'));
                setOpen(false);
              }
            }}
            locale={dateLocale}
            weekStartsOn={1}
            disabled={
              minDate || maxDate
                ? [
                    ...(minDate ? [{ before: minDate }] : []),
                    ...(maxDate ? [{ after: maxDate }] : []),
                  ]
                : undefined
            }
            defaultMonth={isValidSelected ?? maxDate}
            showOutsideDays
            components={{
              Chevron: (props) => {
                if (props.orientation === 'left') return <ChevronLeft className="w-4 h-4" />;
                return <ChevronRight className="w-4 h-4" />;
              },
            }}
            classNames={{
              root: 'rdp-root',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex items-center justify-center pt-1 pb-2 text-sm font-semibold',
              caption_label: 'capitalize',
              nav: 'absolute right-3 top-3 flex items-center gap-1',
              button_previous: 'h-7 w-7 rounded-md hover:bg-muted/50 flex items-center justify-center cursor-pointer transition-colors',
              button_next: 'h-7 w-7 rounded-md hover:bg-muted/50 flex items-center justify-center cursor-pointer transition-colors',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 text-center text-[11px] font-medium text-muted-foreground py-1 uppercase',
              week: 'flex w-full mt-1',
              day: 'h-9 w-9 p-0 text-sm',
              day_button:
                'h-9 w-9 rounded-md hover:bg-muted/60 cursor-pointer transition-colors flex items-center justify-center font-normal',
              selected:
                '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:font-semibold',
              today: '[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-primary/30',
              outside: '[&>button]:text-muted-foreground/40',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
            }}
          />
        </div>
      )}
    </div>
  );
}
