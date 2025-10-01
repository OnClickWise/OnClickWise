'use client';

import { AppSidebar } from "@/components/app-sidebar"
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

export default function BrandingPage({
  params,
}: {
  params: { org: string };
}) {
  return (
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
                <BreadcrumbPage>Branding</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Branding</h1>
              <p className="text-gray-600 mb-8">
                Personalize a aparência da sua plataforma com sua marca e identidade visual.
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-purple-900 mb-2">
                    Funcionalidade em desenvolvimento
                  </h2>
                  <p className="text-purple-700">
                    Esta página será implementada em breve. Aqui você poderá personalizar cores, logos e temas da sua plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
