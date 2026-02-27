import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales, localeMap } from "@/i18n/i18n";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const fullLocale = localeMap[locale as keyof typeof localeMap];

  const messages = (await import(
    `@/messages/${fullLocale}.json`
  )).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}