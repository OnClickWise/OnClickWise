'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import AuthGuard from '@/components/AuthGuard';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ReceivableForm, ReceivableList } from '@/components/financeiro';

export default function ReceivablesPage() {
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Finanças</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Contas a Receber</span>
          </header>
          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Nova Conta a Receber</h2>
              <ReceivableForm onSuccess={() => setRefreshTrigger((n) => n + 1)} />
            </section>
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Listagem de Contas</h2>
              <ReceivableList refreshTrigger={refreshTrigger} />
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
