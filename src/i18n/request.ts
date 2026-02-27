import { getRequestConfig } from "next-intl/server";
import { localeMap, defaultLocale } from "./i18n";

export default getRequestConfig(async ({ locale }) => {
  const routeLocale = locale && locale in localeMap
    ? locale
    : defaultLocale;

  const fullLocale = localeMap[routeLocale as keyof typeof localeMap];

  return {
    locale: routeLocale,
    messages: (await import(`../messages/${fullLocale}.json`)).default
  };
});