"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, Star, ArrowLeft } from "lucide-react";
import { getBoards, createBoard, Board } from "@/services/boardService";
import { getProjectById, getProjects, Project } from "@/services/projectService";

const BOARD_COLORS = [
  { id: "ocean",   gradient: "linear-gradient(135deg,#0079bf,#00aecc)" },
  { id: "sky",     gradient: "linear-gradient(135deg,#00c2e0,#0079bf)" },
  { id: "lime",    gradient: "linear-gradient(135deg,#51e898,#00c2e0)" },
  { id: "pink",    gradient: "linear-gradient(135deg,#f7768e,#c378f9)" },
  { id: "orange",  gradient: "linear-gradient(135deg,#f6a623,#f7768e)" },
  { id: "purple",  gradient: "linear-gradient(135deg,#c378f9,#7b68ee)" },
  { id: "green",   gradient: "linear-gradient(135deg,#00875a,#51e898)" },
  { id: "peach",   gradient: "linear-gradient(135deg,#ffb8b8,#f6a623)" },
];

function CreateBoardModal({ open, onClose, projectId, onCreated }: {
  open: boolean; onClose: () => void; projectId: string; onCreated: (b: Board) => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("ocean");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setTitle(""); setColor("ocean"); setError(null); } }, [open]);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const board = await createBoard({ title: title.trim(), projectId, color });
      onCreated(board);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  const colorObj = BOARD_COLORS.find((c) => c.id === color) || BOARD_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[340px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-24 flex items-end px-5 pb-3" style={{ background: colorObj.gradient }}>
          <div className="flex gap-2">
            {[60,45,55].map((h,i) => (
              <div key={i} className="w-12 rounded-sm bg-white/30 backdrop-blur" style={{ height: h }} />
            ))}
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Criar quadro</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Plano de fundo</label>
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded border-2 transition ${color === c.id ? "border-white scale-110" : "border-transparent"}`}
                  style={{ background: c.gradient }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Titulo <span className="text-red-500">*</span></label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titulo do quadro..."
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold transition"
          >
            {saving ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ board, onClick }: { board: Board; onClick: () => void }) {
  const colorObj = BOARD_COLORS.find((c) => c.id === board.color) || BOARD_COLORS[0];
  return (
    <button
      onClick={onClick}
      className="relative w-full h-[90px] rounded-xl overflow-hidden text-left group hover:opacity-90 transition shadow-sm"
      style={{ background: colorObj.gradient }}
    >
      <span className="absolute bottom-2.5 left-3 text-white text-sm font-semibold drop-shadow line-clamp-2 leading-snug">
        {board.title}
      </span>
      <span className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 text-white hover:bg-black/20 transition">
        <Star className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

export default function ProjectBoardsPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const locale = typeof params?.locale === "string" ? params.locale : "pt";
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      getProjectById(projectId).catch(() => null),
      getBoards(projectId).catch(() => []),
    ])
      .then(([p, bs]) => {
        setProject(p);
        setBoards(bs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  function handleBoardCreated(board: Board) {
    setBoards((prev) => [board, ...prev]);
    router.push(`/${locale}/${org}/kanban/projects/${projectId}/boards/${board.id}`);
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-gray-100 dark:bg-gray-950 min-h-screen">
          {/* Topbar */}
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <SidebarTrigger className="-ml-1" />
            <button
              onClick={() => router.push(`/${locale}/${org}/kanban`)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {project && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  {project.name[0]?.toUpperCase()}
                </div>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">{project.name}</span>
              </div>
            )}
          </header>

          <main className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Carregando...</div>
            ) : error ? (
              <div className="text-red-500 text-sm">Erro: {error}</div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800 dark:text-white text-lg">Seus quadros</h2>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                  >
                    <Plus className="w-4 h-4" /> Criar quadro
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Botão criar */}
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="h-[90px] rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 text-sm font-medium transition"
                  >
                    <Plus className="w-5 h-5" />
                    Criar quadro
                  </button>
                  {boards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onClick={() => router.push(`/${locale}/${org}/kanban/projects/${projectId}/boards/${board.id}`)}
                    />
                  ))}
                </div>

                {boards.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-10">
                    Nenhum quadro encontrado. Crie o primeiro!
                  </div>
                )}
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>

      <CreateBoardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        onCreated={handleBoardCreated}
      />
    </AuthGuard>
  );
}