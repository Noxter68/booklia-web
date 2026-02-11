/**
 * Utility functions for service creation wizard
 */
import { Urgency, WeekDay } from '@/types';
import { ServiceFormData, Step, WEEK_DAYS } from './types';

/** Format duration in minutes to human readable string */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
}

/** Format time string (HH:mm) to French format */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}

/** Format date string to French locale */
export function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Get urgency label in French */
export function getUrgencyLabel(urgency: Urgency): string {
  const labels: Record<Urgency, string> = {
    FLEXIBLE: 'Flexible',
    SOON: 'Sous 7 jours',
    URGENT: 'Urgent',
  };
  return labels[urgency];
}

/** Get days label for display */
export function getDaysLabel(days: WeekDay[]): string | null {
  if (days.length === 0) return null;
  if (days.length === 7) return 'Tous les jours';

  const hasWeekdays =
    days.includes('MONDAY') &&
    days.includes('TUESDAY') &&
    days.includes('WEDNESDAY') &&
    days.includes('THURSDAY') &&
    days.includes('FRIDAY');

  if (days.length === 5 && hasWeekdays) return 'Semaine';
  if (days.length === 2 && days.includes('SATURDAY') && days.includes('SUNDAY')) return 'Week-end';

  return days.map((d) => WEEK_DAYS.find((w) => w.value === d)?.short).join(', ');
}

/** Check if user can proceed to next step */
export function canProceed(step: Step, formData: ServiceFormData): boolean {
  switch (step) {
    case 1:
      return formData.kind !== null;
    case 2:
      return formData.categoryId !== null;
    case 3:
      return formData.title.trim().length >= 5 && formData.description.trim().length >= 20;
    case 4:
      return formData.kind === 'OFFER' || (formData.priceCents !== null && formData.priceCents > 0);
    case 5:
      return true; // Availability is optional
    case 6:
      return true; // Publication choice is always valid
    default:
      return false;
  }
}
