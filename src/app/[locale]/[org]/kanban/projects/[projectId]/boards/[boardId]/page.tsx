"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, DragStartEvent, DragOverEvent, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, horizontalListSortingStrategy,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, X, MoreHorizontal, ArrowLeft, Star, Filter,
  ChevronDown, Loader2, ChevronsLeftRight, Search, List as ListIcon, LayoutGrid, Check, Pencil,
} from "lucide-react";
import { getBoard, Board } from "@/services/boardService";
import { getLists, createList, updateList, deleteList, List } from "@/services/listService";
import { getCards, createCard, updateCard, Card } from "@/services/cardService";

// ─── Gradientes dos boards (fundo completo) ─────────────────────────
const BOARD_BG: Record<string, string> = {
  ocean:  "linear-gradient(160deg, #a8d8e8 0%, #0079bf 40%, #005f9e 100%)",
  sky:    "linear-gradient(160deg, #b3ecff 0%, #00c2e0 40%, #0079bf 100%)",
  lime:   "linear-gradient(160deg, #c8f5d8 0%, #51e898 40%, #00c2e0 100%)",
  pink:   "linear-gradient(160deg, #ffd6dc 0%, #f7768e 40%, #c378f9 100%)",
  orange: "linear-gradient(160deg, #ffd6a0 0%, #f6a623 40%, #f7768e 100%)",
  purple: "linear-gradient(160deg, #e8d6ff 0%, #c378f9 40%, #7b68ee 100%)",
  green:  "linear-gradient(160deg, #b3f0d0 0%, #00875a 40%, #005a3c 100%)",
  peach:  "linear-gradient(160deg, #ffe8e8 0%, #ffb8b8 40%, #f6a623 100%)",
};

// Padrão geométrico SVG (diagonal stripes, like Trello)
const DIAGONAL_PATTERN = `
<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
  <line x1='0' y1='60' x2='60' y2='0' stroke='rgba(255,255,255,0.08)' stroke-width='12'/>
  <line x1='-30' y1='60' x2='30' y2='0' stroke='rgba(255,255,255,0.06)' stroke-width='8'/>
  <line x1='30' y1='60' x2='90' y2='0' stroke='rgba(255,255,255,0.06)' stroke-width='8'/>
</svg>`;
const PATTERN_URL = `url("data:image/svg+xml,${encodeURIComponent(DIAGONAL_PATTERN)}")`;

const CARD_COVER_COLORS: Record<string, string> = {
  red:    "#f44336",
  orange: "#ff9800",
  yellow: "#ffca28",
  lime:   "#8bc34a",
  green:  "#4caf50",
  teal:   "#009688",
  blue:   "#2196f3",
  purple: "#9c27b0",
  pink:   "#e91e63",
};

// ─── CARD ITEM ───────────────────────────────────────────────────────
function CardItem({ card, listeners, attributes, isDragging, onRename }: {
  card: Card; listeners?: any; attributes?: any; isDragging?: boolean;
  onRename?: (id: string, newTitle: string) => void;
}) {
  const coverHex = card.cover ? CARD_COVER_COLORS[card.cover] : null;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) { setEditTitle(card.title); inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);

  function commitRename() {
    const t = editTitle.trim();
    if (t && t !== card.title) onRename?.(card.id, t);
    setEditing(false);
  }

  return (
    <div
      className={`group/card relative bg-white rounded-lg shadow-sm select-none transition-all duration-150 ${
        isDragging ? "opacity-0" : "hover:shadow-md hover:-translate-y-px"
      } ${editing ? "cursor-default ring-2 ring-blue-400" : "cursor-grab active:cursor-grabbing"}`}
      {...(editing ? {} : listeners)}
      {...attributes}
    >
      {coverHex && (
        <div className="h-8 w-full rounded-t-lg" style={{ background: coverHex }} />
      )}
      <div className={`px-3 py-2 ${coverHex ? "" : "pt-2.5"}`}>
        {editing ? (
          <>
            <textarea
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitRename(); }
                if (e.key === "Escape") setEditing(false);
              }}
              rows={2}
              className="w-full resize-none text-[#172b4d] text-sm leading-snug border border-blue-400 rounded-md px-2 py-1 focus:outline-none bg-white"
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={commitRename}
                className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setEditing(false)}
                className="px-2.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[#172b4d] text-sm leading-snug break-words pr-5">{card.title}</p>
            {card.description && (
              <p className="text-[#626f86] text-xs mt-1 line-clamp-2 leading-snug">{card.description}</p>
            )}
          </>
        )}
      </div>

      {/* Card menu */}
      {!editing && (
        <div className="absolute top-1.5 right-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="p-0.5 rounded opacity-0 group-hover/card:opacity-100 hover:bg-[#091e4224] transition text-[#44546f]"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-36"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setMenuOpen(false); setEditing(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Renomear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SORTABLE CARD ───────────────────────────────────────────────────
function SortableCard({ card, onRename }: { card: Card; onRename: (id: string, t: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: "card", card },
  });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <CardItem card={card} listeners={listeners} attributes={attributes} isDragging={isDragging} onRename={onRename} />
    </div>
  );
}

// ─── ADD CARD FORM ───────────────────────────────────────────────────
function AddCardForm({ onAdd, onClose }: { onAdd: (title: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="flex flex-col gap-2 pt-1">
      <textarea
        ref={ref}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (title.trim()) onAdd(title.trim()); }
          if (e.key === "Escape") onClose();
        }}
        placeholder="Insira um título para o cartão..."
        rows={2}
        className="w-full resize-none rounded-lg border border-[#388bff] bg-white text-[#172b4d] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (title.trim()) onAdd(title.trim()); }}
          className="px-3 py-1.5 rounded-md bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm font-semibold transition"
        >
          Adicionar cartão
        </button>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-black/10 text-[#626f86] transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── COLUMN ──────────────────────────────────────────────────────────
function Column({ list, cards, onAddCard, onDeleteList, onRenameCard, isAddingCard, setAddingCard }: {
  list: List; cards: Card[];
  onAddCard: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameCard: (id: string, newTitle: string) => void;
  isAddingCard: boolean;
  setAddingCard: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id, data: { type: "list", list },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, background: "rgba(241,242,244,0.97)" }}
      className={`flex-shrink-0 w-[272px] flex flex-col rounded-xl shadow-md transition-all duration-150 ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <h3 className="flex-1 font-bold text-sm text-[#172b4d] leading-tight truncate">{list.title}</h3>
        <span className="text-xs text-[#626f86] font-semibold tabular-nums">{cards.length}</span>
        <div className="relative">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="p-1 rounded-md hover:bg-[#091e4224] transition text-[#44546f]"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-48"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Excluir lista
                </button>
              ) : (
                <div className="px-3 py-2 flex flex-col gap-2">
                  <p className="text-xs text-gray-600 leading-snug">Excluir lista e todos os cartões?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmDelete(false); onDeleteList(list.id); }}
                      className="flex-1 px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards list */}
      <div className="px-2 pb-1 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => <SortableCard key={card.id} card={card} onRename={onRenameCard} />)}
        </SortableContext>
        {isAddingCard && (
          <AddCardForm
            onAdd={(title) => { onAddCard(list.id, title); setAddingCard(false); }}
            onClose={() => setAddingCard(false)}
          />
        )}
      </div>

      {/* Add card bottom button */}
      {!isAddingCard && (
        <button
          onClick={() => setAddingCard(true)}
          className="flex items-center gap-2 mx-2 mb-2 mt-1 px-2 py-1.5 rounded-md text-[#44546f] hover:bg-[#091e4214] hover:text-[#172b4d] transition text-sm font-medium"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          Adicionar um cartão
        </button>
      )}
    </div>
  );
}

// ─── ADD LIST FORM ───────────────────────────────────────────────────
function AddListForm({ onAdd, onClose }: { onAdd: (title: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="flex-shrink-0 w-[272px] rounded-xl p-2 flex flex-col gap-2 shadow-md" style={{ background: "rgba(241,242,244,0.97)" }}>
      <input
        ref={ref}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) onAdd(title.trim());
          if (e.key === "Escape") onClose();
        }}
        placeholder="Insira o título da lista..."
        className="w-full rounded-lg border border-[#388bff] bg-white text-[#172b4d] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (title.trim()) onAdd(title.trim()); }}
          className="px-3 py-1.5 rounded-md bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm font-semibold transition"
        >
          Adicionar lista
        </button>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-black/10 text-[#626f86] transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── BOARD PAGE ──────────────────────────────────────────────────────
export default function BoardPage() {
  const params = useParams();
  const org       = typeof params?.org       === "string" ? params.org       : "";
  const boardId   = typeof params?.boardId   === "string" ? params.boardId   : "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";
  const locale    = typeof params?.locale    === "string" ? params.locale    : "pt";
  const router = useRouter();

  const [board, setBoard]     = useState<Board | null>(null);
  const [lists, setLists]     = useState<List[]>([]);
  const [cards, setCards]     = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCardId, setFilterCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const [activeType, setActiveType] = useState<"card" | "list" | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    Promise.all([getBoard(boardId), getLists(boardId)])
      .then(async ([b, ls]) => {
        setBoard(b);
        const sorted = ls.sort((a, b) => a.position - b.position);
        setLists(sorted);
        const all = (await Promise.all(sorted.map((l) => getCards(l.id).catch(() => [] as Card[])))).flat();
        setCards(all.sort((a, b) => a.position - b.position));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [boardId]);

  const cardsForList = useCallback((id: string) => cards.filter((c) => c.listId === id), [cards]);
  const filteredCardsForList = useCallback((id: string) => {
    const listCards = cards.filter((c) => c.listId === id);
    if (!filterCardId) return listCards;
    return listCards.filter((c) => c.id === filterCardId);
  }, [cards, filterCardId]);

  async function handleAddList(title: string) {
    try {
      const l = await createList({ title, boardId, position: lists.length });
      setLists((p) => [...p, l]);
      setAddingList(false);
    } catch (e: any) { alert("Erro ao criar lista: " + e.message); }
  }

  async function handleAddCard(listId: string, title: string) {
    try {
      const c = await createCard({ title, listId, position: cardsForList(listId).length });
      setCards((p) => [...p, c]);
    } catch (e: any) { alert("Erro ao criar cartão: " + e.message); }
  }

  async function handleRenameCard(cardId: string, newTitle: string) {
    try {
      const updated = await updateCard(cardId, { title: newTitle });
      setCards((p) => p.map((c) => c.id === cardId ? { ...c, title: updated.title } : c));
    } catch (e: any) { alert("Erro ao renomear card: " + e.message); }
  }

  async function handleDeleteList(listId: string) {
    try {
      await deleteList(listId);
      setLists((p) => p.filter((l) => l.id !== listId));
      setCards((p) => p.filter((c) => c.listId !== listId));
    } catch (e: any) { alert("Erro ao excluir lista: " + e.message); }
  }

  function onDragStart(event: DragStartEvent) {
    const { type, card, list } = event.active.data.current ?? {};
    if (type === "card") { setActiveType("card"); setActiveCard(card); }
    if (type === "list") { setActiveType("list"); setActiveList(list); }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const aType = active.data.current?.type;
    const oType = over.data.current?.type;
    if (aType === "card" && oType === "card") {
      const from = active.data.current?.card as Card;
      const to   = over.data.current?.card as Card;
      if (from.listId !== to.listId)
        setCards((p) => p.map((c) => c.id === from.id ? { ...c, listId: to.listId } : c));
    }
    if (aType === "card" && oType === "list") {
      const from = active.data.current?.card as Card;
      const to   = over.data.current?.list as List;
      if (from.listId !== to.id)
        setCards((p) => p.map((c) => c.id === from.id ? { ...c, listId: to.id } : c));
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveType(null); setActiveCard(null); setActiveList(null);
    if (!over || active.id === over.id) return;
    const aType = active.data.current?.type;

    if (aType === "list") {
      const oi = lists.findIndex((l) => l.id === active.id);
      const ni = lists.findIndex((l) => l.id === over.id);
      const nl = arrayMove(lists, oi, ni).map((l, i) => ({ ...l, position: i }));
      setLists(nl);
      nl.forEach((l) => updateList(l.id, { position: l.position }).catch(() => {}));
    }
    if (aType === "card") {
      const aC = active.data.current?.card as Card;
      const lc = cardsForList(aC.listId);
      const oi = lc.findIndex((c) => c.id === active.id);
      const ni = lc.findIndex((c) => c.id === over.id);
      if (oi === -1 || ni === -1) return;
      const re = arrayMove(lc, oi, ni).map((c, i) => ({ ...c, position: i }));
      setCards((p) => [...p.filter((c) => c.listId !== aC.listId), ...re]);
      re.forEach((c) => updateCard(c.id, { position: c.position }).catch(() => {}));
    }
  }

  const bgGradient = board ? (BOARD_BG[board.color] || BOARD_BG.ocean) : BOARD_BG.ocean;

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="overflow-hidden p-0">
          <div className="flex flex-col h-screen select-none" style={{ background: bgGradient }}>

            {/* Geometric overlay pattern */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PATTERN_URL, backgroundSize: "60px 60px" }} />

            {/* ── Board Header ── */}
            <header className="relative z-10 flex items-center gap-2 h-12 px-3 flex-shrink-0" style={{ background: "rgba(0,0,0,0.22)", backdropFilter: "blur(4px)" }}>
              <SidebarTrigger className="text-white/80 hover:text-white hover:bg-white/10 rounded-md p-1 transition" />
              <button
                onClick={() => router.push(`/${locale}/${org}/kanban/projects/${projectId}/boards`)}
                className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {board ? (
                <>
                  <span className="font-bold text-white text-sm tracking-tight ml-1">{board.title}</span>
                  <div className="w-px h-5 bg-white/20 mx-1" />
                  <button
                    onClick={() => setStarred((s) => !s)}
                    className={`p-1.5 rounded-md transition hover:bg-white/15 ${starred ? "text-yellow-300" : "text-white/70 hover:text-white"}`}
                  >
                    <Star className={`w-4 h-4 ${starred ? "fill-current" : ""}`} />
                  </button>
                </>
              ) : loading ? (
                <Loader2 className="w-4 h-4 text-white/50 animate-spin ml-2" />
              ) : null}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right actions */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs font-semibold ${
                    filterOpen || filterCardId ? "bg-white/30 text-white" : "text-white/80 hover:text-white hover:bg-white/15"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filtrar
                  {filterCardId && <span className="w-4 h-4 rounded-full bg-white text-blue-700 text-[9px] font-black flex items-center justify-center">1</span>}
                </button>
                {filterOpen && (
                  <div
                    className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden w-56"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">Filtrar por cartão</span>
                      {filterCardId && (
                        <button onClick={() => { setFilterCardId(null); setFilterOpen(false); }} className="text-xs text-blue-600 font-semibold hover:underline">
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <button
                        onClick={() => { setFilterCardId(null); setFilterOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition text-left ${
                          !filterCardId ? "text-blue-600 bg-blue-50 font-semibold" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Todos os cartões
                      </button>
                      {lists.map((list) => {
                        const listCards = cardsForList(list.id);
                        if (listCards.length === 0) return null;
                        return (
                          <div key={list.id}>
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-y border-gray-100">
                              {list.title}
                            </div>
                            {listCards.map((card) => (
                              <button
                                key={card.id}
                                onClick={() => { setFilterCardId(card.id === filterCardId ? null : card.id); setFilterOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition text-left ${
                                  filterCardId === card.id ? "text-blue-600 bg-blue-50 font-semibold" : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {card.cover && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CARD_COVER_COLORS[card.cover] }} />}
                                <span className="truncate">{card.title}</span>
                                {filterCardId === card.id && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative mr-10">
                <button
                  onClick={() => setViewMenuOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs font-semibold ${
                    viewMenuOpen ? "bg-white/30 text-white" : "text-white/80 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {viewMode === "board" ? <LayoutGrid className="w-3.5 h-3.5" /> : <ListIcon className="w-3.5 h-3.5" />}
                  {viewMode === "board" ? "Quadro" : "Lista"}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {viewMenuOpen && (
                  <div
                    className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-36"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {(["board", "list"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setViewMode(m); setViewMenuOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                          viewMode === m ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {m === "board" ? <LayoutGrid className="w-3.5 h-3.5" /> : <ListIcon className="w-3.5 h-3.5" />}
                        {m === "board" ? "Quadro" : "Lista"}
                        {viewMode === m && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* ── Board Content ── */}
            {loading ? (
              <div className="relative z-10 flex-1 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-semibold">Carregando quadro...</span>
                </div>
              </div>
            ) : error ? (
              <div className="relative z-10 flex-1 flex items-center justify-center">
                <div className="bg-white/90 rounded-2xl px-6 py-4 text-red-600 text-sm font-semibold shadow-xl">
                  Erro: {error}
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
              >
                <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden">
                  {viewMode === "list" ? (
                    /* ─ LIST VIEW ─ */
                    <div className="p-4 overflow-y-auto h-full">
                      {lists.map((list) => {
                        const filtered = filteredCardsForList(list.id);
                        return (
                          <div key={list.id} className="mb-4 bg-white/90 backdrop-blur rounded-xl shadow overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
                              <span className="font-bold text-[#172b4d] text-sm">{list.title}</span>
                              <span className="text-xs text-[#626f86] font-semibold tabular-nums">{filtered.length}</span>
                            </div>
                            {filtered.length === 0 ? (
                              <p className="text-xs text-[#626f86] px-4 py-3">Nenhum cartão</p>
                            ) : (
                              filtered.map((card) => (
                                <div key={card.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 group/row">
                                  {card.cover && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CARD_COVER_COLORS[card.cover] }} />}
                                  <span className="text-sm text-[#172b4d] flex-1">{card.title}</span>
                                  <button
                                    onClick={() => { const t = window.prompt("Novo nome:", card.title); if (t?.trim()) handleRenameCard(card.id, t.trim()); }}
                                    className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-gray-200 transition text-gray-400"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-3 h-full px-4 py-3 items-start min-w-max">
                      <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
                        {lists.map((list) => (
                          <Column
                            key={list.id}
                            list={list}
                            cards={filteredCardsForList(list.id)}
                            onAddCard={handleAddCard}
                            onDeleteList={handleDeleteList}
                            onRenameCard={handleRenameCard}
                            isAddingCard={addingCardListId === list.id}
                            setAddingCard={(v) => setAddingCardListId(v ? list.id : null)}
                          />
                        ))}
                      </SortableContext>

                      {/* Add list button */}
                      {addingList ? (
                        <AddListForm onAdd={handleAddList} onClose={() => setAddingList(false)} />
                      ) : (
                        <button
                          onClick={() => setAddingList(true)}
                          className="flex-shrink-0 w-[272px] flex items-center gap-2.5 px-4 py-3 rounded-xl text-white/90 hover:text-white text-sm font-semibold transition-all hover:bg-white/15"
                          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                        >
                          <Plus className="w-4 h-4 flex-shrink-0" />
                          Adicionar uma lista
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
                  {activeType === "card" && activeCard && (
                    <div className="rotate-2 w-[260px] opacity-95 shadow-2xl">
                      <CardItem card={activeCard} />
                    </div>
                  )}
                  {activeType === "list" && activeList && (
                    <div className="rotate-1 w-[272px] rounded-xl px-3 py-2.5 text-[#172b4d] font-bold text-sm shadow-2xl opacity-95"
                      style={{ background: "rgba(241,242,244,0.97)" }}>
                      {activeList.title}
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}