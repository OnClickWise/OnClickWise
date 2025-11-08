export const locales = ['pt-BR', 'en-US'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'pt-BR'

// Mapeamento de domínios (usado apenas como fallback)
export const domainLocales: Record<string, Locale> = {
  'onclickwise.com.br': 'pt-BR',
  'onclickwise.com': 'en-US',
}

