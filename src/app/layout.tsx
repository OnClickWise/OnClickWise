
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins, Roboto } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "./globals.css"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "OnClickWise - CRM & Lead Management",
  description: "Plataforma completa de CRM e gestão de leads",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pega o idioma automaticamente do next-intl em qualquer lugar da aplicação
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${inter.variable}
          ${poppins.variable}
          ${roboto.variable}
          antialiased
          bg-background
          text-foreground
        `}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}