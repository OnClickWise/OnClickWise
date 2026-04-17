"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Plus, Star, ChevronRight, Layers, Zap, Map, Bug, Calendar, Layout,
  X, Loader2, FolderPlus, Sparkles, LayoutGrid, MoreHorizontal, Trash2, Pencil, UserPlus, Copy,
} from "lucide-react";
import { getProjects, createProject, deleteProject, updateProject, getAvailableProjectUsers, Project, ProjectAvailableUser } from "@/services/projectService";
import { getBoards, createBoard, duplicateBoard, updateBoard, deleteBoard, Board } from "@/services/boardService";
import { createList } from "@/services/listService";

const BOARD_COLORS = [
  { id: "ocean",   label: "Oceano",       gradient: "linear-gradient(135deg,#0079bf,#00aecc)" },
  { id: "sky",     label: "Ceu",          gradient: "linear-gradient(135deg,#00c2e0,#0079bf)" },
  { id: "lime",    label: "Verde",        gradient: "linear-gradient(135deg,#51e898,#00c2e0)" },
  { id: "pink",    label: "Rosa",         gradient: "linear-gradient(135deg,#f7768e,#c378f9)" },
  { id: "orange",  label: "Laranja",      gradient: "linear-gradient(135deg,#f6a623,#f7768e)" },
  { id: "purple",  label: "Roxo",         gradient: "linear-gradient(135deg,#c378f9,#7b68ee)" },
  { id: "green",   label: "Verde Escuro", gradient: "linear-gradient(135deg,#00875a,#51e898)" },
  { id: "peach",   label: "Pessego",      gradient: "linear-gradient(135deg,#ffb8b8,#f6a623)" },
];

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  kanban:   <Layers className="w-4 h-4" />,
  scrum:    <Zap className="w-4 h-4" />,
  roadmap:  <Map className="w-4 h-4" />,
  bugtrack: <Bug className="w-4 h-4" />,
  weekly:   <Calendar className="w-4 h-4" />,
  blank:    <Layout className="w-4 h-4" />,
};

const TEMPLATES = [
  { id: "kanban",   label: "Kanban",           desc: "A Fazer, Em Andamento e Feito",          color: BOARD_COLORS[0], cols: ["A Fazer","Em Andamento","Feito"] },
  { id: "scrum",    label: "Scrum Sprint",      desc: "Backlog, Sprint, Review e Done",          color: BOARD_COLORS[5], cols: ["Backlog","Sprint","Review","Done"] },
  { id: "roadmap",  label: "Roadmap",           desc: "Visao trimestral do seu produto",         color: BOARD_COLORS[2], cols: ["Ideias","Q1","Q2","Q3","Q4"] },
  { id: "bugtrack", label: "Bug Tracker",       desc: "Rastreie e resolva problemas",            color: BOARD_COLORS[3], cols: ["Reportado","Analisando","Corrigindo","Resolvido"] },
  { id: "weekly",   label: "Reuniao Semanal",   desc: "Pauta, discussoes, decisoes e acoes",     color: BOARD_COLORS[4], cols: ["Pauta","Em Discussao","Decidido","Acao"] },
  { id: "blank",    label: "Em Branco",         desc: "Comece do zero com suas proprias listas", color: BOARD_COLORS[6], cols: [] },
];

type Template = typeof TEMPLATES[0];

const WS_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-sky-400 to-blue-500",
  "from-fuchsia-500 to-purple-600",
];

// ─────────────────────── BOARD CARD ───────────────────────
function BoardCard({
  board,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  board: Board;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const colorObj = BOARD_COLORS.find((c) => c.id === board.color) || BOARD_COLORS[0];
  const [starred, setStarred] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuOpen]);

  return (
    <div
      className="group relative w-full h-[100px]"
    >
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        className="relative h-full rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        style={{ background: colorObj.gradient }}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-200" />
        <span className="absolute bottom-3 left-3.5 text-white text-sm font-bold drop-shadow-sm line-clamp-2 leading-snug pr-8">
          {board.title}
        </span>
      </div>
      <div className="absolute top-2 right-8" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}
          className="p-1 rounded-md text-white opacity-0 group-hover:opacity-100 hover:bg-black/20 transition"
          title="Ações do quadro"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 min-w-[170px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1 z-20 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicar
            </button>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setStarred((s) => !s); }}
        className={`absolute top-2 right-2 p-1 rounded-md transition ${starred ? "opacity-100 text-yellow-300" : "opacity-0 group-hover:opacity-100 text-white hover:bg-black/20"}`}
      >
        <Star className={`w-3.5 h-3.5 ${starred ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}

// ─────────────────────── CREATE BOARD MODAL ───────────────────────
function CreateBoardModal({
  open, onClose, projectId, onCreated, initialTemplate,
}: {
  open: boolean; onClose: () => void; projectId: string;
  onCreated: (b: Board) => void; initialTemplate?: Template;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("ocean");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTemplate?.label || "");
      setDescription("");
      setColor(initialTemplate?.color.id || "ocean");
      setError(null);
    }
  }, [open, initialTemplate]);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const board = await createBoard({ title: title.trim(), description: description.trim() || undefined, projectId, color });
      // Auto-criar listas do template
      if (initialTemplate && initialTemplate.cols.length > 0) {
        await Promise.all(
          initialTemplate.cols.map((col, i) =>
            createList({ title: col, boardId: board.id, position: i })
          )
        );
      }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex">
          {/* Preview lateral */}
          <div className="w-[180px] flex-shrink-0 flex flex-col relative overflow-hidden" style={{ background: colorObj.gradient }}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex flex-col justify-end px-3 pb-4 pt-10 gap-2 h-full">
              {(initialTemplate?.cols.length ? initialTemplate.cols : ["Lista 1", "Lista 2", "Lista 3"]).slice(0, 3).map((col, i) => (
                <div key={i} className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5">
                  <div className="text-white text-[10px] font-bold truncate">{col}</div>
                  <div className="mt-1 space-y-0.5">
                    <div className="h-1.5 bg-white/30 rounded-full w-3/4" />
                    <div className="h-1.5 bg-white/30 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900 dark:text-white">
                {initialTemplate ? `Template: ${initialTemplate.label}` : "Novo quadro"}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Plano de fundo</label>
              <div className="flex gap-1.5 flex-wrap">
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c.id}
                    title={c.label}
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform ${color === c.id ? "border-gray-800 dark:border-white scale-110" : "border-transparent hover:scale-105"}`}
                    style={{ background: c.gradient }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Titulo <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Ex: Sprint 1, Roadmap Q1..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Descreva o objetivo deste quadro..."
              />
            </div>

            {initialTemplate && initialTemplate.cols.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Listas que serao criadas automaticamente
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {initialTemplate.cols.map((col) => (
                    <span key={col} className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-800">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={saving || !title.trim()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200 dark:shadow-none"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Criar quadro</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── EDIT BOARD MODAL ───────────────────────
function EditBoardModal({
  open,
  onClose,
  board,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  board: Board | null;
  onSaved: (b: Board) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("ocean");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !board) return;
    setTitle(board.title || "");
    setDescription(board.description || "");
    setColor(board.color || "ocean");
    setError(null);
  }, [open, board]);

  async function submit() {
    if (!board || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBoard(board.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        color,
      });
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Erro ao editar quadro");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !board) return null;
  const colorObj = BOARD_COLORS.find((c) => c.id === color) || BOARD_COLORS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex">
          <div className="w-[180px] flex-shrink-0 flex flex-col relative overflow-hidden" style={{ background: colorObj.gradient }}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex flex-col justify-end px-3 pb-4 pt-10 gap-2 h-full">
              {["Lista 1", "Lista 2", "Lista 3"].map((col, i) => (
                <div key={i} className="bg-white/20 backdrop-blur rounded-lg px-2.5 py-1.5">
                  <div className="text-white text-[10px] font-bold truncate">{col}</div>
                  <div className="mt-1 space-y-0.5">
                    <div className="h-1.5 bg-white/30 rounded-full w-3/4" />
                    <div className="h-1.5 bg-white/30 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Editar quadro</h2>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Plano de fundo</label>
              <div className="flex gap-1.5 flex-wrap">
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c.id}
                    title={c.label}
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform ${color === c.id ? "border-gray-800 dark:border-white scale-110" : "border-transparent hover:scale-105"}`}
                    style={{ background: c.gradient }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Titulo <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Ex: Sprint 1, Roadmap Q1..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Descreva o objetivo deste quadro..."
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={saving || !title.trim()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200 dark:shadow-none"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Salvar alterações</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── CREATE PROJECT MODAL ───────────────────────
function CreateProjectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setName(""); setDesc(""); setError(null); } }, [open]);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const p = await createProject({ name: name.trim(), description: desc.trim() || undefined });
      onCreated(p);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-[400px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <FolderPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Novo workspace</h2>
              <p className="text-xs text-gray-400">Agrupe seus quadros por projeto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Nome <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="Ex: Time de Produto, Marketing..."
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Descricao</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="Opcional..."
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:text-gray-400 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar workspace"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────── PAGE ───────────────────────
export default function KanbanHomePage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const locale = typeof params?.locale === "string" ? params.locale : "pt";
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [boardsByProject, setBoardsByProject] = useState<Record<string, Board[]>>({});
  const [loading, setLoading] = useState(true);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createBoardFor, setCreateBoardFor] = useState<{ projectId: string; template?: Template } | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [wsMenuOpen, setWsMenuOpen] = useState<string | null>(null);
  const [wsDeleteConfirm, setWsDeleteConfirm] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [inviteProject, setInviteProject] = useState<Project | null>(null);
  const [inviteUsers, setInviteUsers] = useState<ProjectAvailableUser[]>([]);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (!org) return;
    setLoading(true);
    getProjects()
      .then(async (pList) => {
        setProjects(pList);
        if (pList.length > 0) setActiveProjectId(pList[0].id);
        const map: Record<string, Board[]> = {};
        await Promise.all(
          pList.map(async (p) => {
            try { map[p.id] = await getBoards(p.id); } catch { map[p.id] = []; }
          })
        );
        setBoardsByProject(map);
      })
      .finally(() => setLoading(false));
  }, [org]);

  function handleProjectCreated(p: Project) {
    setProjects((prev) => [p, ...prev]);
    setBoardsByProject((prev) => ({ ...prev, [p.id]: [] }));
    setActiveProjectId(p.id);
  }

  async function handleDeleteProject(projectId: string) {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setBoardsByProject((prev) => { const n = { ...prev }; delete n[projectId]; return n; });
      if (activeProjectId === projectId) {
        setActiveProjectId((prev) => projects.find((p) => p.id !== projectId)?.id ?? null);
      }
    } catch (e: any) {
      alert("Erro ao excluir workspace: " + e.message);
    } finally {
      setWsMenuOpen(null);
      setWsDeleteConfirm(null);
    }
  }

  function handleBoardCreated(board: Board) {
    setBoardsByProject((prev) => ({
      ...prev,
      [board.projectId]: [...(prev[board.projectId] || []), board],
    }));
    router.push(`/${locale}/${org}/kanban/projects/${board.projectId}/boards/${board.id}`);
  }

  async function handleDuplicateBoard(boardId: string) {
    try {
      const duplicated = await duplicateBoard(boardId);
      setBoardsByProject((prev) => ({
        ...prev,
        [duplicated.projectId]: [duplicated, ...(prev[duplicated.projectId] || [])],
      }));
    } catch (e: any) {
      alert("Erro ao duplicar quadro: " + (e?.message || "Erro desconhecido"));
    }
  }

  async function handleEditBoard(boardId: string) {
    const board = Object.values(boardsByProject).flat().find((item) => item.id === boardId);
    if (!board) return;
    setEditingBoard(board);
  }

  function handleBoardUpdated(updated: Board) {
    setBoardsByProject((prev) => ({
      ...prev,
      [updated.projectId]: (prev[updated.projectId] || []).map((item) => item.id === updated.id ? updated : item),
    }));
  }

  async function handleDeleteBoard(boardId: string) {
    const ok = window.confirm("Deseja excluir este quadro? Esta ação não pode ser desfeita.");
    if (!ok) return;

    try {
      await deleteBoard(boardId);
      setBoardsByProject((prev) => {
        const next = { ...prev };
        for (const projectId of Object.keys(next)) {
          next[projectId] = next[projectId].filter((item) => item.id !== boardId);
        }
        return next;
      });
    } catch (e: any) {
      alert("Erro ao excluir quadro: " + (e?.message || "Erro desconhecido"));
    }
  }

  async function handleSaveDescription() {
    if (!editingProject) return;
    setSavingDescription(true);
    try {
      const updated = await updateProject(editingProject.id, { description: editingDescription.trim() || "" });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setEditingProject(null);
      setEditingDescription("");
    } catch (e: any) {
      alert("Erro ao atualizar descricao: " + e.message);
    } finally {
      setSavingDescription(false);
    }
  }

  async function openInviteModal(project: Project) {
    setInviteProject(project);
    setInviteSearch("");
    setInviteLoading(true);
    try {
      const users = await getAvailableProjectUsers();
      setInviteUsers(users);
    } catch (e: any) {
      setInviteUsers([]);
      alert("Erro ao carregar usuarios: " + e.message);
    } finally {
      setInviteLoading(false);
    }
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activeBoards = activeProjectId ? (boardsByProject[activeProjectId] || []) : [];

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-[#f5f6fa] dark:bg-gray-950 min-h-screen">

          {/* Topbar */}
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <SidebarTrigger className="-ml-1 text-gray-500" />
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-gray-800 dark:text-white text-sm">Gestao de Projetos</span>
            </div>
          </header>

          <div className="flex h-[calc(100vh-48px)] overflow-hidden">

            {/* ── Workspace sidebar ── */}
            <aside className="w-[220px] flex-shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex flex-col">
              <div className="p-3 flex flex-col gap-1 flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-2">Workspaces</p>

                {loading ? (
                  <div className="flex flex-col gap-1.5">
                    {[1,2,3].map((i) => (
                      <div key={i} className="h-9 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  projects.map((p, idx) => (
                    <div key={p.id} className="relative">
                      <button
                        onClick={() => { setActiveProjectId(p.id); setWsMenuOpen(null); setWsDeleteConfirm(null); }}
                        className={`flex items-center gap-2.5 w-full pl-2.5 pr-8 py-2 rounded-xl text-sm font-medium text-left transition-all ${
                          activeProjectId === p.id
                            ? "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-xl bg-gradient-to-br ${WS_COLORS[idx % WS_COLORS.length]} text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          {p.name[0]?.toUpperCase()}
                        </span>
                        <span className="truncate flex-1">{p.name}</span>
                      </button>

                      {/* 3-dot menu button — sempre visível */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setWsMenuOpen(wsMenuOpen === p.id ? null : p.id); setWsDeleteConfirm(null); }}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 ${wsMenuOpen === p.id ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200" : ""}`}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown — abaixo do item, dentro da sidebar */}
                      {wsMenuOpen === p.id && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {wsDeleteConfirm !== p.id ? (
                            <>
                              <button
                                onClick={() => { setEditingProject(p); setEditingDescription(p.description || ""); setWsMenuOpen(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Editar descricao
                              </button>
                              <button
                                onClick={() => { setWsMenuOpen(null); openInviteModal(p); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Convidar usuario
                              </button>
                              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                              <button
                                onClick={() => setWsDeleteConfirm(p.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir workspace
                              </button>
                            </>
                          ) : (
                            <div className="px-3 py-2 flex flex-col gap-2">
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">Excluir este workspace e todos os quadros?</p>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="flex-1 px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                  Excluir
                                </button>
                                <button
                                  onClick={() => setWsDeleteConfirm(null)}
                                  className="flex-1 px-2 py-1 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                <button
                  onClick={() => setCreateProjectOpen(true)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all mt-2 border border-dashed border-gray-200 dark:border-gray-700"
                >
                  <span className="w-7 h-7 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                  <span>Novo workspace</span>
                </button>
              </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : projects.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center gap-5 mt-24 px-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200 dark:shadow-blue-900">
                    <LayoutGrid className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="font-black text-gray-800 dark:text-white text-xl">Nenhum workspace ainda</h2>
                    <p className="text-gray-500 text-sm mt-1.5 max-w-xs">Crie seu primeiro workspace para organizar seus projetos e quadros</p>
                  </div>
                  <button
                    onClick={() => setCreateProjectOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Criar workspace
                  </button>
                </div>
              ) : activeProject ? (
                <div>
                  {/* ── Hero banner ── */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-8 py-7">
                    <div
                      className="absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
                        backgroundSize: "28px 28px",
                      }}
                    />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur border border-white/30 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                        {activeProject.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="font-black text-white text-xl leading-tight truncate">{activeProject.name}</h1>
                        {activeProject.description && (
                          <p className="text-white/70 text-sm mt-0.5 truncate">{activeProject.description}</p>
                        )}
                        <p className="text-white/50 text-xs mt-1">{activeBoards.length} quadro{activeBoards.length !== 1 ? "s" : ""}</p>
                      </div>
                      <button
                        onClick={() => setCreateBoardFor({ projectId: activeProject.id })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-white/95 transition shadow-lg flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Novo quadro
                      </button>
                    </div>
                  </div>

                  <div className="px-8 py-6 flex flex-col gap-8">

                    {/* ── Boards grid ── */}
                    {activeBoards.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                            <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
                            Seus quadros
                          </h2>
                          <button
                            onClick={() => router.push(`/${locale}/${org}/kanban/projects/${activeProject.id}/boards`)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition hover:underline"
                          >
                            Ver todos <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {activeBoards.map((board) => (
                            <BoardCard
                              key={board.id}
                              board={board}
                              onClick={() => router.push(`/${locale}/${org}/kanban/projects/${activeProject.id}/boards/${board.id}`)}
                              onEdit={() => void handleEditBoard(board.id)}
                              onDuplicate={() => void handleDuplicateBoard(board.id)}
                              onDelete={() => void handleDeleteBoard(board.id)}
                            />
                          ))}
                          <button
                            onClick={() => setCreateBoardFor({ projectId: activeProject.id })}
                            className="h-[100px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition">
                              <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold">Criar quadro</span>
                          </button>
                        </div>
                      </section>
                    )}

                    {/* ── Templates ── */}
                    <section>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-1.5 h-5 rounded-full bg-purple-500 inline-block" />
                        <h2 className="font-bold text-gray-800 dark:text-white text-sm">Comece com um template</h2>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest">
                          {TEMPLATES.length} disponiveis
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => setCreateBoardFor({ projectId: activeProject.id, template: tpl })}
                            className="group flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/60 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left bg-white dark:bg-gray-900 shadow-sm"
                          >
                            {/* Preview com pills dos nomes das colunas */}
                            <div className="relative h-[72px] flex items-end px-2.5 pb-2.5 gap-1 overflow-hidden flex-shrink-0" style={{ background: tpl.color.gradient }}>
                              <div className="absolute inset-0 bg-black/10" />
                              {tpl.cols.length > 0 ? (
                                tpl.cols.slice(0, 3).map((col) => (
                                  <div key={col} className="relative z-10 px-2 py-0.5 rounded-md bg-white/25 backdrop-blur text-white text-[8px] font-black truncate max-w-[50px]">
                                    {col}
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div className="relative z-10 w-10 h-8 rounded-lg bg-white/20 backdrop-blur" />
                                  <div className="relative z-10 w-10 h-5 rounded-lg bg-white/20 backdrop-blur" />
                                  <div className="relative z-10 w-10 h-7 rounded-lg bg-white/20 backdrop-blur" />
                                </>
                              )}
                            </div>
                            <div className="flex items-start gap-2 p-2.5">
                              <span className="mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition">
                                {TEMPLATE_ICONS[tpl.id]}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-white leading-tight truncate">{tpl.label}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{tpl.desc}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* CTA quando sem boards */}
                    {activeBoards.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                          <LayoutGrid className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm">Nenhum quadro ainda</p>
                        <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Escolha um template acima ou crie do zero</p>
                      </div>
                    )}

                  </div>
                </div>
              ) : null}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={handleProjectCreated}
      />
      {createBoardFor && (
        <CreateBoardModal
          open={true}
          onClose={() => setCreateBoardFor(null)}
          projectId={createBoardFor.projectId}
          onCreated={handleBoardCreated}
          initialTemplate={createBoardFor.template}
        />
      )}

      <EditBoardModal
        open={!!editingBoard}
        onClose={() => setEditingBoard(null)}
        board={editingBoard}
        onSaved={handleBoardUpdated}
      />

      {editingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => { if (!savingDescription) setEditingProject(null); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Editar descricao do workspace</h3>
            <p className="text-xs text-gray-500 mt-1 mb-3">Workspace: {editingProject.name}</p>
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o objetivo deste workspace..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingProject(null)}
                disabled={savingDescription}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDescription}
                disabled={savingDescription}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2"
              >
                {savingDescription ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar descricao"}
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setInviteProject(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Convidar usuario</h3>
            <p className="text-xs text-gray-500 mt-1">Workspace: {inviteProject.name}</p>

            <input
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="mt-3 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-3 max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
              {inviteLoading ? (
                <div className="p-4 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Carregando usuarios...</div>
              ) : inviteUsers.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Nenhum usuario encontrado nesta empresa.</div>
              ) : (
                inviteUsers
                  .filter((u) => {
                    const q = inviteSearch.trim().toLowerCase();
                    if (!q) return true;
                    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                  })
                  .map((u) => (
                    <div key={u.id} className="px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <button
                        onClick={() => alert(`Usuario ${u.name} selecionado para convite no workspace ${inviteProject.name}.`)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        Convidar
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setInviteProject(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}