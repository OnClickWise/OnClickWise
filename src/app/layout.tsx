import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins, Roboto } from "next/font/google";
import { getLocale } from 'next-intl/server';
import { ClientLocaleProvider } from '@/components/ClientLocaleProvider';
import { AppGuard } from '@/components/AppGuard';
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
  icons: {
    icon: [
      { url: '/logo-favicon.png', sizes: 'any' },
      { url: '/logo-favicon.png', type: 'image/png' },
    ],
    apple: '/logo-favicon.png',
    shortcut: '/logo-favicon.png',
  },
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${roboto.variable} antialiased`}
      >
        <ClientLocaleProvider defaultLocale={locale}>
          <AppGuard>
            {children}
          </AppGuard>
        </ClientLocaleProvider>
      </body>
    </html>
  );
}
