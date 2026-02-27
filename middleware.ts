import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true
});

export const config = {
  matcher: [
    '/',
    '/(pt|en|es|fr)/:path*'
  ]
};