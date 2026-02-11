import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Get trust level info based on ELO score
 */
export function getTrustLevel(elo: number): {
  level: 'low' | 'medium' | 'high' | 'excellent';
  label: string;
  color: string;
  bgColor: string;
} {
  if (elo >= 1500) {
    return {
      level: 'excellent',
      label: 'Excellent',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    };
  }
  if (elo >= 1200) {
    return {
      level: 'high',
      label: 'Très fiable',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    };
  }
  if (elo >= 800) {
    return {
      level: 'medium',
      label: 'Fiable',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    };
  }
  return {
    level: 'low',
    label: 'Nouveau',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50',
  };
}

/**
 * Format ELO score for display
 */
export function formatElo(elo: number): string {
  return elo.toLocaleString('fr-FR');
}
