export type Locale = 'fr' | 'en' | 'pt';

export const locales: Locale[] = ['fr', 'en', 'pt'];
export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  pt: 'Português',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  pt: '🇧🇷',
};
