"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  org: string;
  section: string;
  children: ReactNode;
}

export function InvestmentsModuleShell({ org, section, children }: Props) {
  const locale = useLocale();
  const tSidebar = useTranslations("Sidebar");

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/dashboard`}>{tSidebar("dashboard")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/investments`}>{tSidebar("investments")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{section}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6 bg-muted/40">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
