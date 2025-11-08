'use client';

import { use } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import RoleGuard from "@/components/RoleGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function SettingsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = use(params);
  return (
    <AuthGuard orgSlug={org}>
      <RoleGuard allowedRoles={['admin', 'master']} orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/${org}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Configurações</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Configurações</h1>
              <p className="text-gray-600 mb-8">
                Gerencie as configurações da organização:{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {params.org}
                </span>
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-blue-900 mb-2">
                    Navegue pelas configurações
                  </h2>
                  <p className="text-blue-700 mb-4">
                    Use o menu lateral para acessar as diferentes seções de configuração:
                  </p>
                  <ul className="text-left text-blue-700 space-y-2">
                    <li><strong>Organização:</strong> Informações básicas da empresa</li>
                    <li><strong>Usuários:</strong> Gerenciar funcionários e permissões</li>
                    <li><strong>Telegram:</strong> Configurar bot do Telegram</li>
                    <li><strong>Planos & Billing:</strong> Assinatura e pagamentos</li>
                    <li><strong>Branding:</strong> Personalização visual</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </RoleGuard>
    </AuthGuard>
  );
}
