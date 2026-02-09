'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  step?: number; // minutes step (15, 30, 60)
}

interface TimeRangePickerProps {
  startTime: string | null;
  endTime: string | null;
  onChange: (range: { start: string | null; end: string | null }) => void;
  disabled?: boolean;
  step?: number;
}

const generateTimeSlots = (step: number = 30): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += step) {
      slots.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  return slots;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
};

export function TimePicker({
  value,
  onChange,
  placeholder = 'Sélectionner',
  disabled,
  step = 30,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(value ? parseInt(value.split(':')[0]) : 9);
  const [minutes, setMinutes] = useState(value ? parseInt(value.split(':')[1]) : 0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setHours(parseInt(value.split(':')[0]));
      setMinutes(parseInt(value.split(':')[1]));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adjustHours = (delta: number) => {
    const newHours = (hours + delta + 24) % 24;
    setHours(newHours);
    onChange(`${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const adjustMinutes = (delta: number) => {
    let newMinutes = minutes + delta;
    let newHours = hours;

    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = (hours + 1) % 24;
    } else if (newMinutes < 0) {
      newMinutes = 60 - step;
      newHours = (hours - 1 + 24) % 24;
    }

    setMinutes(newMinutes);
    setHours(newHours);
    onChange(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
  };

  return (
    <div ref={containerRef} className="relative">
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
        <Clock className="w-5 h-5 text-muted-foreground" />
        <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {value ? formatTime(value) : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-surface border border-border rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustHours(1)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 flex items-center justify-center text-3xl font-semibold bg-muted/50 rounded-xl">
                  {hours.toString().padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => adjustHours(-1)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <span className="text-xs text-muted-foreground mt-1">Heures</span>
              </div>

              <span className="text-3xl font-semibold text-muted-foreground">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustMinutes(step)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 flex items-center justify-center text-3xl font-semibold bg-muted/50 rounded-xl">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => adjustMinutes(-step)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <span className="text-xs text-muted-foreground mt-1">Minutes</span>
              </div>
            </div>

            {/* Quick select */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Sélection rapide</div>
              <div className="flex flex-wrap gap-2">
                {['08:00', '09:00', '10:00', '12:00', '14:00', '17:00', '18:00', '20:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      onChange(time);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      value === time
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TimeRangePicker({
  startTime,
  endTime,
  onChange,
  disabled,
  step = 30,
}: TimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeSlots = generateTimeSlots(step);

  const handleTimeSelect = (time: string) => {
    if (activeField === 'start') {
      onChange({ start: time, end: endTime });
      setActiveField('end');
    } else {
      onChange({ start: startTime, end: time });
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-stretch rounded-xl border overflow-hidden bg-surface transition-all ${
        isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}>
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setActiveField('start');
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          className={`flex-1 flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
            isOpen && activeField === 'start' ? 'bg-primary/5' : 'hover:bg-muted/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div className="text-left">
            <div className="text-xs text-muted-foreground">Début</div>
            <div className={startTime ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {startTime ? formatTime(startTime) : '--:--'}
            </div>
          </div>
        </button>

        <div className="w-px bg-border" />

        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setActiveField('end');
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          className={`flex-1 flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
            isOpen && activeField === 'end' ? 'bg-primary/5' : 'hover:bg-muted/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div className="text-left">
            <div className="text-xs text-muted-foreground">Fin</div>
            <div className={endTime ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {endTime ? formatTime(endTime) : '--:--'}
            </div>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface border border-border rounded-2xl shadow-xl p-4"
          >
            <div className="text-sm font-medium mb-3">
              {activeField === 'start' ? 'Heure de début' : 'Heure de fin'}
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((time) => {
                const isDisabled = !!(activeField === 'end' && startTime && time <= startTime);
                const isSelected = (activeField === 'start' && time === startTime) ||
                                   (activeField === 'end' && time === endTime);

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => !isDisabled && handleTimeSelect(time)}
                    disabled={isDisabled}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isDisabled
                        ? 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onChange({ start: null, end: null });
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
