import { getRequestConfig } from "next-intl/server";
import { localeMap, defaultLocale } from "./i18n";

export default getRequestConfig(async ({ locale }) => {
  const routeLocale = locale && locale in localeMap ? locale : defaultLocale;
  const fullLocale = localeMap[routeLocale as keyof typeof localeMap];

  try {
    const messages = (await import(`../messages/${fullLocale}.json`)).default;
    return { locale: routeLocale, messages };
  } catch (err) {
    console.error(`Failed to load locale messages for ${fullLocale}`, err);
    // fallback: mensagens vazias
    return { locale: routeLocale, messages: {} };
  }
});