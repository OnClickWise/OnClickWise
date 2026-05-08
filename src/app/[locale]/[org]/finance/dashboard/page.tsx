'use client';

import { useParams } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import AuthGuard from '@/components/AuthGuard';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FinanceDashboard } from '@/components/financeiro';

export default function FinanceDashboardPage() {
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Finanças</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Dashboard</span>
          </header>
          <main className="p-6">
            <FinanceDashboard />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
