"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProjectForm } from "@/components/ProjectForm";
import { useProjectForm } from "@/hooks/useProjectForm";
import { getProjects, Project } from "@/services/projectService";
import { Loader2 } from "lucide-react";

export default function KanbanProjectEditPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const locale = typeof params?.locale === "string" ? params.locale : "pt";
  const router = useRouter();
  const { handleUpdate, handleDelete, loading } = useProjectForm();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    getProjects()
      .then((list: Project[]) => setProject(list.find((p) => p.id === projectId)))
      .finally(() => setFetching(false));
  }, [projectId]);

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
                  <BreadcrumbPage>Editar Projeto</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-col gap-4 p-6 max-w-lg">
            <h1 className="text-2xl font-bold">Editar Projeto</h1>
            {fetching ? (
              <Loader2 className="animate-spin text-muted-foreground" />
            ) : (
              <ProjectForm
                initialData={project}
                onSubmit={async (data) => {
                  await handleUpdate(projectId, data);
                  router.push(`/${locale}/${org}/kanban`);
                }}
                onDelete={async () => {
                  await handleDelete(projectId);
                  router.push(`/${locale}/${org}/kanban`);
                }}
                loading={loading}
              />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
