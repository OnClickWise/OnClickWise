'use client';

import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
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

export default function OrgPage({
  params,
}: {
  params: { org: string };
}) {
  return (
    <AuthGuard orgSlug={params.org}>
      <SidebarProvider>
        <AppSidebar org={params.org} />
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
                <BreadcrumbLink href={`/${params.org}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${params.org}/settings`}>
                  Configurações
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Organização</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Informações da Organização</h1>
              <p className="text-gray-600 mb-8">
                Atualize as informações básicas da sua empresa, como nome, endereço e contato.
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-green-900 mb-2">
                    Funcionalidade em desenvolvimento
                  </h2>
                  <p className="text-green-700">
                    Esta página será implementada em breve. Aqui você poderá editar as informações da sua organização.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  );
}
