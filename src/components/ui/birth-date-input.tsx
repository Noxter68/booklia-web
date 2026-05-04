'use client';

import { forwardRef, useState, useEffect, useRef, ChangeEvent } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface BirthDateInputProps {
  value: string | null | undefined;
  onChange: (isoDate: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  onBlur?: () => void;
}

function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function displayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);

  const currentYear = new Date().getUTCFullYear();
  if (year < 1900 || year > currentYear) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Build UTC date and verify components round-trip (catches 31/02 etc.)
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  // No future dates
  if (date.getTime() > Date.now()) return null;

  return date.toISOString();
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export const BirthDateInput = forwardRef<HTMLInputElement, BirthDateInputProps>(
  ({ value, onChange, required, disabled, className, id, name, onBlur }, ref) => {
    const [display, setDisplay] = useState(() => isoToDisplay(value));
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isTypingRef = useRef(false);

    // Sync from external value changes only (parent reset, async load).
    // Skip while the user is actively typing to avoid clobbering partial input.
    useEffect(() => {
      if (isTypingRef.current) return;
      if (inputRef.current && document.activeElement === inputRef.current) return;
      setDisplay(isoToDisplay(value));
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      isTypingRef.current = true;
      const masked = applyMask(e.target.value);
      setDisplay(masked);

      if (masked.length === 10) {
        onChange(displayToIso(masked));
      } else {
        onChange(null);
      }
      // Release the typing flag on next tick (after parent state propagates back)
      queueMicrotask(() => {
        isTypingRef.current = false;
      });
    };

    const handleBlur = () => {
      setTouched(true);
      onBlur?.();
    };

    const isInvalid =
      touched && display.length > 0 && display.length < 10
        ? true
        : touched && display.length === 10 && displayToIso(display) === null;

    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    return (
      <div className="space-y-1">
        <Input
          ref={setRefs}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="JJ/MM/AAAA"
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          maxLength={10}
          className={cn(isInvalid && 'border-red-500 focus-visible:ring-red-500', className)}
          aria-invalid={isInvalid || undefined}
        />
        {isInvalid && (
          <p className="text-xs text-red-500">Date invalide (format JJ/MM/AAAA)</p>
        )}
      </div>
    );
  }
);

BirthDateInput.displayName = 'BirthDateInput';
