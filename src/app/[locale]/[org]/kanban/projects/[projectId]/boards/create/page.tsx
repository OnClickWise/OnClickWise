"use client";

import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BoardForm } from "@/components/BoardForm";
import { useBoardForm } from "@/hooks/useBoardForm";

export default function KanbanBoardCreatePage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const locale = typeof params?.locale === "string" ? params.locale : "pt";
  const router = useRouter();
  const { handleCreate, loading } = useBoardForm();

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
                  <BreadcrumbLink href={`/${locale}/${org}/kanban`}>Kanban</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${locale}/${org}/kanban/projects/${projectId}/boards`}>Quadros</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Novo Quadro</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-col gap-4 p-6 max-w-lg">
            <h1 className="text-2xl font-bold">Novo Quadro</h1>
            <BoardForm
              onSubmit={async (data) => {
                await handleCreate({ ...data, projectId });
                router.push(`/${locale}/${org}/kanban/projects/${projectId}/boards`);
              }}
              loading={loading}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
