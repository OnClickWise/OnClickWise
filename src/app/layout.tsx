import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins, Roboto } from "next/font/google";
import { ClientLocaleProvider } from "@/components/ClientLocaleProvider";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

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
      { url: "/logo-favicon.png", sizes: "any" },
      { url: "/logo-favicon.png", type: "image/png" },
    ],
    apple: "/logo-favicon.png",
    shortcut: "/logo-favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = "pt";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
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
        <ClientLocaleProvider defaultLocale={locale}>
          <AuthProvider>
            {/* ✅ Envolvendo toda a app */}
            {children}
          </AuthProvider>
        </ClientLocaleProvider>
      </body>
    </html>
  );
}
