import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency based on locale
 * @param value - The numeric value to format
 * @param locale - The locale ('pt-BR' for R$, 'en-US' for $)
 * @param options - Intl.NumberFormatOptions for customization
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: string = 'pt-BR',
  options?: Intl.NumberFormatOptions
): string {
  const currency = locale === 'pt-BR' ? 'BRL' : 'USD'
  
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    ...options
  }
  
  return new Intl.NumberFormat(locale, defaultOptions).format(value)
}

/**
 * Gets the currency symbol based on locale
 * @param locale - The locale ('pt-BR' for R$, 'en-US' for $)
 * @returns Currency symbol string
 */
export function getCurrencySymbol(locale: string = 'pt-BR'): string {
  return locale === 'pt-BR' ? 'R$' : '$'
}