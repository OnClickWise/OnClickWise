"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";

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
            <div className="max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Em desenvolvimento
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Novas funcionalidades em breve
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                O módulo de {moduleLabel} está sendo preparado e estará disponível nas próximas atualizações.
              </p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
