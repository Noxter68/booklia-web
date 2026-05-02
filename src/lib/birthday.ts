import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function isBirthdayToday(birthDate: string | Date | null | undefined): boolean {
  if (!birthDate) return false;
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getUTCDate() === today.getDate() && d.getUTCMonth() === today.getMonth();
}

export function computeAge(birthDate: string | Date): number | null {
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getUTCFullYear();
  const m = today.getMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getUTCDate())) {
    age--;
  }
  return age;
}

export function formatBirthDate(birthDate: string | Date, withAge = true): string {
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(d.getTime())) return '';
  // Use UTC components so the display matches what was stored, regardless of viewer TZ
  const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const formatted = format(utcDate, 'd MMMM yyyy', { locale: fr });
  if (!withAge) return formatted;
  const age = computeAge(d);
  return age !== null ? `${formatted} (${age} ans)` : formatted;
}
