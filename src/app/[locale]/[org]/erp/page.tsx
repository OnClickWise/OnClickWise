"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BookOpen, Sparkles } from "lucide-react";

export default function ErpComingSoonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const org = typeof params?.org === "string" ? params.org : "";

  const moduleLabel = useMemo(() => {
    const moduleParam = (searchParams.get("module") || "").toLowerCase();
    if (moduleParam === "marketing") return "Marketing";
    if (moduleParam === "contabilidade") return "Contabilidade";
    return "ERP";
  }, [searchParams]);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-gray-100 dark:bg-gray-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <SidebarTrigger className="-ml-1" />
            <span className="font-semibold text-gray-800 dark:text-white text-sm">ERP</span>
          </header>

          <main className="p-6">
            <div className="max-w-4xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Base do ERP
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Módulo de Contabilidade
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                O ERP agora começa pela contabilidade: plano de contas, lançamentos e a base que sustenta os módulos financeiros.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Link
                  href={`/${typeof params?.locale === 'string' ? params.locale : 'pt'}/${org}/erp/contabilidade`}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-indigo-400 hover:shadow-md transition bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-gray-950"
                >
                  <BookOpen className="h-5 w-5 text-indigo-600 mb-3" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Plano de Contas</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Estruture contas, natureza contábil e hierarquia antes de liberar Finanças.
                  </p>
                </Link>

                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/60">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lançamentos Contábeis</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Partidas dobradas, validação de débitos e créditos e integração com os demais módulos.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
