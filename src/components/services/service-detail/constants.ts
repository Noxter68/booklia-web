/**
 * Constants for Service Detail Page
 */

/** Day labels for availability display */
export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

/** Urgency badge configuration */
export const URGENCY_CONFIG = {
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  SOON: { label: 'Sous 7 jours', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  FLEXIBLE: { label: 'Flexible', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
} as const;

/** Recurrence labels */
export const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: 'Hebdomadaire',
  BIWEEKLY: 'Bi-hebdomadaire',
  MONTHLY: 'Mensuel',
  ONE_TIME: 'Ponctuel',
};
