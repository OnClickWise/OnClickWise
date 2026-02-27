import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getLocale } from 'next-intl/server';
import { ClientLocaleProvider } from '@/components/ClientLocaleProvider';

export default async function PublicLayout({
  children,
}: {
  
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <main className="min-h-screen w-full">
      {/* botão tema */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <ClientLocaleProvider defaultLocale={locale}>
          {children}
      </ClientLocaleProvider>
    </main>
  );
}
