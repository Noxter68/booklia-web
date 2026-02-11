'use client';

/**
 * Step 5: Duration & Availability
 * User sets duration, available days, time slots, and date range
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Helper } from '@/components/ui/helper';
import { DateRangePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-picker';
import { WeekDay } from '@/types';
import { ServiceFormData, WEEK_DAYS, DURATION_PRESETS } from './types';
import { formatDuration } from './utils';

interface StepAvailabilityProps {
  formData: ServiceFormData;
  onChange: (updates: Partial<ServiceFormData>) => void;
}

export function StepAvailability({ formData, onChange }: StepAvailabilityProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Durée et disponibilités</h2>

      <DurationSelector
        duration={formData.durationMinutes}
        onChange={(durationMinutes) => onChange({ durationMinutes })}
      />

      <DaysSelector
        selectedDays={formData.availableDays}
        onChange={(availableDays) => onChange({ availableDays })}
      />

      <TimeSlotSelector
        fromTime={formData.availableFromTime}
        toTime={formData.availableToTime}
        onChange={(fromTime, toTime) =>
          onChange({ availableFromTime: fromTime, availableToTime: toTime })
        }
      />

      <DateRangeSelector
        fromDate={formData.availableFromDate}
        toDate={formData.availableToDate}
        onChange={(fromDate, toDate) =>
          onChange({ availableFromDate: fromDate, availableToDate: toDate })
        }
      />
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function DurationSelector({
  duration,
  onChange,
}: {
  duration: number | null;
  onChange: (v: number | null) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const isPreset = DURATION_PRESETS.some((p) => p.value === duration);

  const handleCustomConfirm = () => {
    const value = parseInt(customInput);
    if (value > 0) {
      onChange(value);
      setShowCustom(false);
      setCustomInput('');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium">Durée de la prestation</label>
        <Helper
          content="Indiquez la durée estimée de votre prestation. Laissez vide si elle est variable."
          position="right"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => {
              onChange(duration === preset.value ? null : preset.value);
              setShowCustom(false);
            }}
            className={`px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
              duration === preset.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {preset.label}
          </button>
        ))}

        {/* Custom duration button or badge */}
        {duration && !isPreset ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setShowCustom(false);
            }}
            className="px-5 py-3 rounded-xl border-2 border-primary bg-primary/10 text-primary text-sm font-medium transition-all cursor-pointer"
          >
            {formatDuration(duration)}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
              showCustom
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 text-muted-foreground'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
              <label className="text-sm font-medium mb-3 block">Durée personnalisée</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Ex: 45, 90, 180..."
                  min={1}
                  className="w-40"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">minutes</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomConfirm}
                  disabled={!customInput || parseInt(customInput) <= 0}
                  className="rounded-lg"
                >
                  Valider
                </Button>
              </div>
              {customInput && parseInt(customInput) > 0 && (
                <p className="text-sm text-primary mt-2">= {formatDuration(parseInt(customInput))}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DaysSelector({
  selectedDays,
  onChange,
}: {
  selectedDays: WeekDay[];
  onChange: (days: WeekDay[]) => void;
}) {
  const toggleDay = (day: WeekDay) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const selectWeekdays = () =>
    onChange(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const selectWeekend = () => onChange(['SATURDAY', 'SUNDAY']);
  const selectAll = () => onChange(WEEK_DAYS.map((d) => d.value));
  const clearAll = () => onChange([]);

  return (
    <div>
      <label className="text-sm font-medium mb-3 block">Jours de disponibilité</label>

      {/* Quick selections */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button type="button" onClick={selectWeekdays} className="text-sm text-primary hover:underline cursor-pointer">
          Semaine
        </button>
        <span className="text-muted-foreground">•</span>
        <button type="button" onClick={selectWeekend} className="text-sm text-primary hover:underline cursor-pointer">
          Week-end
        </button>
        <span className="text-muted-foreground">•</span>
        <button type="button" onClick={selectAll} className="text-sm text-primary hover:underline cursor-pointer">
          Tous
        </button>
        {selectedDays.length > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Effacer
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {WEEK_DAYS.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={`w-14 h-14 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
              selectedDays.includes(day.value)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {day.short}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeSlotSelector({
  fromTime,
  toTime,
  onChange,
}: {
  fromTime: string | null;
  toTime: string | null;
  onChange: (from: string | null, to: string | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">Plage horaire</label>
        <Helper content="Les créneaux pendant lesquels vous êtes disponible pour cette prestation." />
      </div>
      <TimeRangePicker
        startTime={fromTime}
        endTime={toTime}
        onChange={(range) => onChange(range.start, range.end)}
        step={30}
      />
    </div>
  );
}

function DateRangeSelector({
  fromDate,
  toDate,
  onChange,
}: {
  fromDate: string | null;
  toDate: string | null;
  onChange: (from: string | null, to: string | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">Période de disponibilité</label>
        <Helper content="Si votre service n'est disponible que pendant une période limitée, indiquez-la ici." />
      </div>
      <DateRangePicker
        startDate={fromDate ? new Date(fromDate) : undefined}
        endDate={toDate ? new Date(toDate) : undefined}
        onChange={(range) =>
          onChange(
            range.start ? range.start.toISOString().split('T')[0] : null,
            range.end ? range.end.toISOString().split('T')[0] : null
          )
        }
        minDate={new Date()}
        startPlaceholder="Début"
        endPlaceholder="Fin"
      />
      <p className="text-xs text-muted-foreground mt-2">Laissez vide si toujours disponible</p>
    </div>
  );
}
