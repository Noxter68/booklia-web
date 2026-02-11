/**
 * Types for the service creation wizard
 */
import { ServiceKind, Urgency, Recurrence, ServiceStatus, WeekDay } from '@/types';

/** Pricing type for services */
export type PricingType = 'HOURLY' | 'FIXED';

/** Step number in the wizard (1-6) */
export type Step = 1 | 2 | 3 | 4 | 5 | 6;

/** Form data structure for service creation */
export interface ServiceFormData {
  kind: ServiceKind | null;
  categoryId: string | null;
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  priceCents: number | null;
  pricingType: PricingType;
  urgency: Urgency;
  isRecurring: boolean;
  recurrence: Recurrence;
  deadlineAt: string | null;
  durationMinutes: number | null;
  availableDays: WeekDay[];
  availableFromTime: string | null;
  availableToTime: string | null;
  availableFromDate: string | null;
  availableToDate: string | null;
  status: ServiceStatus;
}

/** Initial form data values */
export const INITIAL_FORM_DATA: ServiceFormData = {
  kind: null,
  categoryId: null,
  title: '',
  description: '',
  city: '',
  latitude: null,
  longitude: null,
  priceCents: null,
  pricingType: 'HOURLY',
  urgency: 'FLEXIBLE',
  isRecurring: false,
  recurrence: 'ONE_TIME',
  deadlineAt: null,
  durationMinutes: null,
  availableDays: [],
  availableFromTime: null,
  availableToTime: null,
  availableFromDate: null,
  availableToDate: null,
  status: 'DRAFT',
};

/** Step configuration for the wizard stepper */
export const WIZARD_STEPS = [
  { number: 1, title: 'Type', description: 'Offre ou demande' },
  { number: 2, title: 'Catégorie', description: 'Choisir une catégorie' },
  { number: 3, title: 'Détails', description: 'Titre et description' },
  { number: 4, title: 'Tarifs', description: 'Prix et options' },
  { number: 5, title: 'Disponibilités', description: 'Durée et horaires' },
  { number: 6, title: 'Publication', description: 'Publier ou brouillon' },
] as const;

/** Week days configuration */
export const WEEK_DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Lundi', short: 'Lun' },
  { value: 'TUESDAY', label: 'Mardi', short: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
  { value: 'THURSDAY', label: 'Jeudi', short: 'Jeu' },
  { value: 'FRIDAY', label: 'Vendredi', short: 'Ven' },
  { value: 'SATURDAY', label: 'Samedi', short: 'Sam' },
  { value: 'SUNDAY', label: 'Dimanche', short: 'Dim' },
];

/** Duration presets in minutes */
export const DURATION_PRESETS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
];
