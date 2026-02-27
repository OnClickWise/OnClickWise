// src/i18n/i18n.ts

export const localeMap = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR'
} as const;

export type RouteLocale = keyof typeof localeMap;

// ✅ Alias para manter compatibilidade
export type Locale = RouteLocale;

export type AppLocale = (typeof localeMap)[RouteLocale];

export const locales: RouteLocale[] = ['pt', 'en', 'es', 'fr'];

export const defaultLocale: RouteLocale = 'pt';