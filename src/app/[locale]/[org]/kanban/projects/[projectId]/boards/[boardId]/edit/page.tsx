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
import { BoardForm } from "@/components/BoardForm";
import { useBoardForm } from "@/hooks/useBoardForm";
import { getBoards, Board } from "@/services/boardService";
import { Loader2 } from "lucide-react";

export default function KanbanBoardEditPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const boardId = typeof params?.boardId === "string" ? params.boardId : "";
  const locale = typeof params?.locale === "string" ? params.locale : "pt";
  const router = useRouter();
  const { handleUpdate, handleDelete, loading } = useBoardForm();
  const [board, setBoard] = useState<Board | undefined>(undefined);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!projectId || !boardId) return;
    getBoards(projectId)
      .then((list: Board[]) => setBoard(list.find((b) => b.id === boardId)))
      .finally(() => setFetching(false));
  }, [projectId, boardId]);

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
                  <BreadcrumbPage>Editar Quadro</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-col gap-4 p-6 max-w-lg">
            <h1 className="text-2xl font-bold">Editar Quadro</h1>
            {fetching ? (
              <Loader2 className="animate-spin text-muted-foreground" />
            ) : (
              <BoardForm
                initialData={board}
                onSubmit={async (data) => {
                  await handleUpdate(boardId, data);
                  router.push(`/${locale}/${org}/kanban/projects/${projectId}/boards`);
                }}
                onDelete={async () => {
                  await handleDelete(boardId);
                  router.push(`/${locale}/${org}/kanban/projects/${projectId}/boards`);
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
