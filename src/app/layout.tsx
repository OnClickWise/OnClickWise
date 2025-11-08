import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from 'next-intl/server';
import { ClientLocaleProvider } from '@/components/ClientLocaleProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnClickWise - CRM & Lead Management",
  description: "Plataforma completa de CRM e gestão de leads",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLocaleProvider defaultLocale={locale}>
          {children}
        </ClientLocaleProvider>
      </body>
    </html>
  );
}
