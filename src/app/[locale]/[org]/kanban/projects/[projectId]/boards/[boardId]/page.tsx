"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  ChevronDown, Loader2, List as ListIcon, LayoutGrid, Check, Pencil, CheckCircle2, Circle, MessageSquare, Trash2, Copy, Link2, Archive, Palette, Move,
} from "lucide-react";
import { getBoard, Board } from "@/services/boardService";
import { getLists, createList, updateList, deleteList, List } from "@/services/listService";
import { getCards, getCardsByBoard, createCard, updateCard, Card, deleteCard, getCardById, duplicateCard } from "@/services/cardService";
import CardChecklists from "@/components/ui/CardChecklists";
import { ColorPickerModal } from "@/components/modals/ColorPickerModal";
import { ListPickerModal } from "@/components/modals/ListPickerModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

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

function getChecklistProgress(card: Card): { done: number; total: number } {
  const checklists = Array.isArray(card.metadata?.checklists) ? card.metadata.checklists : [];
  let total = 0;
  let done = 0;

  for (const checklist of checklists) {
    const items = Array.isArray(checklist?.items) ? checklist.items : [];
    total += items.length;
    done += items.filter((item: any) => Boolean(item?.checked)).length;
  }

  return { done, total };
}

type CardComment = {
  id: string;
  text: string;
  createdAt: string;
};

function getCardComments(card: Card | null): CardComment[] {
  if (!card) return [];
  return Array.isArray(card.metadata?.comments) ? card.metadata.comments : [];
}

function isCardArchived(card: Card): boolean {
  return Boolean(card.metadata?.archived);
}

// ─── CARD ITEM ───────────────────────────────────────────────────────
function CardItem({ card, listeners, attributes, isDragging, onRename, onOpenDetails, onToggleComplete, onEditDescription, onDelete, onSetCover, onMoveCard, onDuplicateCard, onCopyCardLink, onArchiveCard }: {
  card: Card; listeners?: any; attributes?: any; isDragging?: boolean;
  onRename?: (id: string, newTitle: string) => void;
  onOpenDetails?: (cardId: string) => void;
  onToggleComplete?: (cardId: string) => void;
  onEditDescription?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
  onSetCover?: (cardId: string) => void;
  onMoveCard?: (cardId: string) => void;
  onDuplicateCard?: (cardId: string) => void;
  onCopyCardLink?: (cardId: string) => void;
  onArchiveCard?: (cardId: string) => void;
}) {
  const coverHex = card.cover ? CARD_COVER_COLORS[card.cover] : null;
  const isCompleted = Boolean(card.metadata?.completed);
  const checklistProgress = getChecklistProgress(card);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [pencilMenuOpen, setPencilMenuOpen] = useState(false);
  const [pencilMenuPosition, setPencilMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const pencilButtonRef = useRef<HTMLButtonElement>(null);
  const pencilMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) { setEditTitle(card.title); inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);

  useEffect(() => {
    if (!pencilMenuOpen) return;

    const updatePosition = () => {
      const rect = pencilButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 220;
      const nextLeft = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth));
      setPencilMenuPosition({ top: rect.bottom + 8, left: nextLeft });
    };

    const onOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pencilMenuRef.current?.contains(target)) return;
      if (pencilButtonRef.current?.contains(target)) return;
      setPencilMenuOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", onOutside);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [pencilMenuOpen]);

  function commitRename() {
    const t = editTitle.trim();
    if (t && t !== card.title) onRename?.(card.id, t);
    setEditing(false);
  }

  return (
    <div
      className={`group/card relative overflow-hidden rounded-xl border border-[#dfe1e6] bg-white select-none transition-all duration-200 ${
        isDragging ? "opacity-0" : "hover:border-[#c7d1db] hover:shadow-sm"
      } ${editing ? "cursor-default ring-2 ring-blue-400" : "cursor-grab active:cursor-grabbing"}`}
      onClick={() => { if (!editing) onOpenDetails?.(card.id); }}
      {...(editing ? {} : listeners)}
      {...attributes}
    >
      {coverHex && (
        <div className="h-8 w-full rounded-t-lg" style={{ background: coverHex }} />
      )}
      <div className={`px-3.5 py-3 ${coverHex ? "" : "pt-3"}`}>
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
            <div className="pr-14">
              <p className={`text-[15px] font-medium leading-snug break-words ${isCompleted ? "line-through text-[#5e6c84]" : "text-[#172b4d]"}`}>{card.title}</p>
            </div>
            {card.description && (
              <p className="text-[#626f86] text-[12px] mt-1 line-clamp-2 leading-snug">{card.description}</p>
            )}
            {checklistProgress.total > 0 && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-[#f1f2f4] px-2 py-0.5 text-[11px] font-semibold text-[#44546f]">
                <Check className="w-3 h-3" />
                {checklistProgress.done}/{checklistProgress.total}
              </div>
            )}
          </>
        )}
      </div>

      {/* Hover quick actions */}
      {!editing && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200" onPointerDown={(e) => e.stopPropagation()}>
          <button
            ref={pencilButtonRef}
            onClick={(e) => { e.stopPropagation(); setPencilMenuOpen((prev) => !prev); }}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-[#d0d9e3] bg-white/95 text-[#44546f] hover:text-[#172b4d] hover:bg-white shadow-sm"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete?.(card.id); }}
            className={`h-7 w-7 inline-flex items-center justify-center rounded-md border shadow-sm ${isCompleted ? "border-green-200 bg-green-50 text-green-700" : "border-[#d0d9e3] bg-white/95 text-[#44546f] hover:text-[#172b4d] hover:bg-white"}`}
            title={isCompleted ? "Marcar como pendente" : "Marcar como concluido"}
          >
            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          </button>

          {pencilMenuOpen && pencilMenuPosition && typeof document !== "undefined" && createPortal(
            <div
              ref={pencilMenuRef}
              className="fixed z-[220] w-[220px] rounded-xl border border-gray-200 bg-white shadow-2xl py-1"
              style={{ top: pencilMenuPosition.top, left: pencilMenuPosition.left }}
            >
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onOpenDetails?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Abrir detalhes</button>
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onSetCover?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"><Palette className="w-3.5 h-3.5" /> Alterar capa</button>
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onMoveCard?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"><Move className="w-3.5 h-3.5" /> Mover</button>
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onDuplicateCard?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Copiar cartão</button>
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onCopyCardLink?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"><Link2 className="w-3.5 h-3.5" /> Copiar link</button>
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onArchiveCard?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"><Archive className="w-3.5 h-3.5" /> Arquivar</button>
              <button onClick={(e) => { e.stopPropagation(); setPencilMenuOpen(false); onDelete?.(card.id); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
            </div>,
            document.body,
          )}
        </div>
      )}
    </div>
  );
}

// ─── SORTABLE CARD ───────────────────────────────────────────────────
function SortableCard({ card, onRename, onOpenDetails, onToggleComplete, onEditDescription, onDeleteCard, onSetCover, onMoveCard, onDuplicateCard, onCopyCardLink, onArchiveCard }: {
  card: Card;
  onRename: (id: string, t: string) => void;
  onOpenDetails: (cardId: string) => void;
  onToggleComplete: (cardId: string) => void;
  onEditDescription: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onSetCover: (cardId: string) => void;
  onMoveCard: (cardId: string) => void;
  onDuplicateCard: (cardId: string) => void;
  onCopyCardLink: (cardId: string) => void;
  onArchiveCard: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: "card", card },
  });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <CardItem
        card={card}
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        onRename={onRename}
        onOpenDetails={onOpenDetails}
        onToggleComplete={onToggleComplete}
        onEditDescription={onEditDescription}
        onDelete={onDeleteCard}
        onSetCover={onSetCover}
        onMoveCard={onMoveCard}
        onDuplicateCard={onDuplicateCard}
        onCopyCardLink={onCopyCardLink}
        onArchiveCard={onArchiveCard}
      />
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
function Column({ list, cards, onAddCard, onDeleteList, onRenameCard, onOpenCardDetails, onToggleCardComplete, onEditCardDescription, onDeleteCard, onSetCardCover, onMoveCard, onDuplicateCard, onCopyCardLink, onArchiveCard, isAddingCard, setAddingCard }: {
  list: List; cards: Card[];
  onAddCard: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameCard: (id: string, newTitle: string) => void;
  onOpenCardDetails: (cardId: string) => void;
  onToggleCardComplete: (cardId: string) => void;
  onEditCardDescription: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onSetCardCover: (cardId: string) => void;
  onMoveCard: (cardId: string) => void;
  onDuplicateCard: (cardId: string) => void;
  onCopyCardLink: (cardId: string) => void;
  onArchiveCard: (cardId: string) => void;
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex-shrink-0 w-[320px] flex flex-col rounded-2xl border border-[#d0d9e3] bg-[#ebecf0] transition-all duration-150 overflow-visible ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      {/* Column Header */}
      <div
        className="relative flex items-center gap-2 px-3 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing overflow-visible"
        {...attributes}
        {...listeners}
      >
        <h3 className="flex-1 font-semibold text-lg text-[#172b4d] leading-tight truncate">{list.title}</h3>
        <span className="text-xs text-[#626f86] font-semibold tabular-nums">{cards.length}</span>
        <div className="relative z-30">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-[#091e4224] transition text-[#44546f]"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 z-[140] bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-52"
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
      <div className="px-2.5 pb-2 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onRename={onRenameCard}
              onOpenDetails={onOpenCardDetails}
              onToggleComplete={onToggleCardComplete}
              onEditDescription={onEditCardDescription}
              onDeleteCard={onDeleteCard}
              onSetCover={onSetCardCover}
              onMoveCard={onMoveCard}
              onDuplicateCard={onDuplicateCard}
              onCopyCardLink={onCopyCardLink}
              onArchiveCard={onArchiveCard}
            />
          ))}
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
          className="flex items-center gap-2 mx-2 mb-2 mt-1 px-2 py-1.5 rounded-md text-[#44546f] hover:bg-[#091e4214] hover:text-[#172b4d] transition text-base font-medium"
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
    <div className="flex-shrink-0 w-[320px] rounded-xl p-2 flex flex-col gap-2 shadow-md" style={{ background: "rgba(241,242,244,0.97)" }}>
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
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailComments, setDetailComments] = useState<CardComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<{ title: string; description: string }>({ title: "", description: "" });
  const saveSuccessTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeType, setActiveType] = useState<"card" | "list" | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  
  // Modal states
  const [colorPickerCardId, setColorPickerCardId] = useState<string | null>(null);
  const [listPickerCardId, setListPickerCardId] = useState<string | null>(null);
  const [deleteConfirmCard, setDeleteConfirmCard] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const selectedCard = selectedCardId ? cards.find((card) => card.id === selectedCardId) || null : null;

  useEffect(() => {
    if (!selectedCard) {
      setDetailTitle("");
      setDetailDescription("");
      setDetailComments([]);
      return;
    }

    setDetailTitle(selectedCard.title || "");
    setDetailDescription(selectedCard.description || "");
    setDetailComments(getCardComments(selectedCard));
    lastSavedSnapshotRef.current = {
      title: selectedCard.title || "",
      description: selectedCard.description || "",
    };
  }, [selectedCard?.id, selectedCard?.title, selectedCard?.description, selectedCard?.metadata]);

  useEffect(() => {
    if (!selectedCard) return;

    const normalizedTitle = (detailTitle || "").trim();
    const normalizedDescription = detailDescription || "";

    const hasChanged =
      normalizedTitle !== (lastSavedSnapshotRef.current.title || "").trim() ||
      normalizedDescription !== (lastSavedSnapshotRef.current.description || "");

    if (!hasChanged) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const updated = await updateCard(selectedCard.id, {
          title: normalizedTitle || selectedCard.title,
          description: normalizedDescription,
          metadata: {
            ...(selectedCard.metadata || {}),
            comments: detailComments,
          },
        });

        setCards((prev) => prev.map((card) => (card.id === selectedCard.id ? updated : card)));
        lastSavedSnapshotRef.current = {
          title: updated.title || "",
          description: updated.description || "",
        };
      } catch (error) {
        console.error("Erro no autosave do card", error);
      }
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [selectedCard?.id, detailTitle, detailDescription]);

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    Promise.all([getBoard(boardId), getLists(boardId)])
      .then(async ([b, ls]) => {
        setBoard(b);
        const sorted = ls.sort((a, b) => a.position - b.position);
        setLists(sorted);

        // Preferir busca em lote para evitar padrão N+1 de chamadas por lista.
        try {
          const all = await getCardsByBoard(boardId);
          setCards(all.sort((a, b) => a.position - b.position));
        } catch {
          // Fallback de compatibilidade enquanto endpoint de board estiver indisponível.
          const all = (await Promise.all(sorted.map((l) => getCards(l.id).catch(() => [] as Card[])))).flat();
          setCards(all.sort((a, b) => a.position - b.position));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [boardId]);

  const cardsForList = useCallback((id: string) => cards.filter((c) => c.listId === id && !isCardArchived(c)), [cards]);
  const filteredCardsForList = useCallback((id: string) => {
    const listCards = cards.filter((c) => c.listId === id && !isCardArchived(c));
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
      setCards((p) => p.map((c) => c.id === cardId ? updated : c));
    } catch (e: any) { alert("Erro ao renomear card: " + e.message); }
  }

  async function refreshCard(cardId: string) {
    try {
      const fresh = await getCardById(cardId);
      setCards((prev) => prev.map((card) => (card.id === cardId ? fresh : card)));
    } catch {
      // no-op
    }
  }

  async function handleToggleCardComplete(cardId: string) {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;

    try {
      const metadata = {
        ...(card.metadata || {}),
        completed: !Boolean(card.metadata?.completed),
      };
      const updated = await updateCard(cardId, { metadata });
      setCards((prev) => prev.map((item) => (item.id === cardId ? updated : item)));
    } catch (e: any) {
      alert("Erro ao atualizar status do cartão: " + e.message);
    }
  }

  async function handleEditCardDescription(cardId: string) {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;

    const nextDescription = window.prompt("Descrição do cartão:", card.description || "");
    if (nextDescription === null) return;

    try {
      const updated = await updateCard(cardId, { description: nextDescription });
      setCards((prev) => prev.map((item) => (item.id === cardId ? updated : item)));
    } catch (e: any) {
      alert("Erro ao atualizar descrição: " + e.message);
    }
  }

  async function handleDeleteCard(cardId: string) {
    setDeleteConfirmCard(cardId);
  }

  async function handleConfirmDeleteCard(cardId: string) {
    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
      if (selectedCardId === cardId) {
        setSelectedCardId(null);
      }
    } catch (e: any) {
      alert("Erro ao excluir cartão: " + e.message);
    }
  }

  async function handleSetCardCover(cardId: string) {
    setColorPickerCardId(cardId);
  }

  async function handleConfirmCardCover(color: string) {
    if (!colorPickerCardId) return;
    const card = cards.find((item) => item.id === colorPickerCardId);
    if (!card) return;

    try {
      const metadata = {
        ...(card.metadata || {}),
        ...(color ? { cover: color } : {}),
      };
      const updated = await updateCard(colorPickerCardId, { metadata, cover: color || undefined });
      setCards((prev) => prev.map((item) => (item.id === colorPickerCardId ? updated : item)));
      setColorPickerCardId(null);
    } catch (e: any) {
      alert("Erro ao atualizar capa: " + e.message);
    }
  }

  async function handleMoveCard(cardId: string) {
    setListPickerCardId(cardId);
  }

  async function handleConfirmMoveCard(targetListId: string) {
    if (!listPickerCardId) return;
    const card = cards.find((item) => item.id === listPickerCardId);
    if (!card) return;

    try {
      const targetCount = cardsForList(targetListId).length;
      const updated = await updateCard(listPickerCardId, {
        listId: targetListId,
        position: targetCount,
      });
      setCards((prev) => prev.map((item) => (item.id === listPickerCardId ? updated : item)));
      setListPickerCardId(null);
    } catch (e: any) {
      alert("Erro ao mover cartão: " + e.message);
    }
  }

  async function handleDuplicateCard(cardId: string) {
    try {
      console.log("[BoardPage] duplicating card", cardId);
      const duplicate = await duplicateCard(cardId);
      console.log("[BoardPage] duplicate success", duplicate);
      setCards((prev) => [...prev, duplicate]);
    } catch (e: any) {
      console.error("[BoardPage] duplicate error", e);
      alert("Erro ao copiar cartão: " + (e?.message || String(e)));
    }
  }

  async function handleCopyCardLink(cardId: string) {
    const current = window.location.href.split("#")[0];
    const url = `${current}#card-${cardId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link do cartão copiado!");
    } catch {
      prompt("Copie o link:", url);
    }
  }

  async function handleArchiveCard(cardId: string) {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;

    try {
      const metadata = {
        ...(card.metadata || {}),
        archived: true,
      };
      const updated = await updateCard(cardId, { metadata });
      setCards((prev) => prev.map((item) => (item.id === cardId ? updated : item)));
      if (selectedCardId === cardId) setSelectedCardId(null);
    } catch (e: any) {
      alert("Erro ao arquivar cartão: " + e.message);
    }
  }

  async function handleSaveCardDetails() {
    if (!selectedCard) return;

    setSavingDetails(true);
    try {
      const updated = await updateCard(selectedCard.id, {
        title: detailTitle.trim() || selectedCard.title,
        description: detailDescription,
        metadata: {
          ...(selectedCard.metadata || {}),
          comments: detailComments,
        },
      });

      setCards((prev) => prev.map((card) => (card.id === selectedCard.id ? updated : card)));
      setSaveSuccessMessage("Alterações salvas");
      if (saveSuccessTimerRef.current) {
        clearTimeout(saveSuccessTimerRef.current);
      }
      saveSuccessTimerRef.current = setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 3000);
    } catch (e: any) {
      alert("Erro ao salvar detalhes do cartão: " + e.message);
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleAddComment() {
    if (!selectedCard || !newCommentText.trim()) return;

    const nextComments = [
      ...detailComments,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: newCommentText.trim(),
        createdAt: new Date().toISOString(),
      },
    ];

    setDetailComments(nextComments);
    setNewCommentText("");

    try {
      const updated = await updateCard(selectedCard.id, {
        metadata: {
          ...(selectedCard.metadata || {}),
          comments: nextComments,
        },
      });

      setCards((prev) => prev.map((card) => (card.id === selectedCard.id ? updated : card)));
    } catch (e: any) {
      alert("Erro ao salvar comentário: " + e.message);
    }
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
  const selectedCardProgress = selectedCard ? getChecklistProgress(selectedCard) : { done: 0, total: 0 };

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
                              filtered.map((card) => {
                                const checklistProgress = getChecklistProgress(card);
                                return (
                                  <div key={card.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 group/row">
                                    <button
                                      onClick={() => handleToggleCardComplete(card.id)}
                                      className="text-[#44546f] hover:text-[#172b4d]"
                                      title={card.metadata?.completed ? "Marcar como pendente" : "Marcar como concluido"}
                                    >
                                      {card.metadata?.completed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4" />}
                                    </button>
                                    {card.cover && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CARD_COVER_COLORS[card.cover] }} />}
                                    <div className="flex-1 min-w-0">
                                      <button
                                        onClick={() => setSelectedCardId(card.id)}
                                        className={`text-sm block truncate text-left ${card.metadata?.completed ? "text-[#5e6c84] line-through" : "text-[#172b4d]"}`}
                                      >
                                        {card.title}
                                      </button>
                                      {card.description && <span className="text-xs text-[#626f86] block truncate">{card.description}</span>}
                                    </div>
                                    {checklistProgress.total > 0 && (
                                      <span className="text-[11px] font-semibold text-[#44546f] bg-[#f1f2f4] rounded px-2 py-0.5">
                                        {checklistProgress.done}/{checklistProgress.total}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => { const t = window.prompt("Novo nome:", card.title); if (t?.trim()) handleRenameCard(card.id, t.trim()); }}
                                      className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-gray-200 transition text-gray-400"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-3 h-full px-4 py-3 items-start min-w-max overflow-visible">
                      <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
                        {lists.map((list) => (
                          <Column
                            key={list.id}
                            list={list}
                            cards={filteredCardsForList(list.id)}
                            onAddCard={handleAddCard}
                            onDeleteList={handleDeleteList}
                            onRenameCard={handleRenameCard}
                            onOpenCardDetails={setSelectedCardId}
                            onToggleCardComplete={handleToggleCardComplete}
                            onEditCardDescription={handleEditCardDescription}
                            onDeleteCard={handleDeleteCard}
                            onSetCardCover={handleSetCardCover}
                            onMoveCard={handleMoveCard}
                            onDuplicateCard={handleDuplicateCard}
                            onCopyCardLink={handleCopyCardLink}
                            onArchiveCard={handleArchiveCard}
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
                          className="flex-shrink-0 w-[320px] flex items-center gap-2.5 px-4 py-3 rounded-xl text-white/90 hover:text-white text-sm font-semibold transition-all hover:bg-white/15"
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
                    <div className="rotate-1 w-[320px] rounded-xl px-3 py-2.5 text-[#172b4d] font-bold text-sm shadow-2xl opacity-95"
                      style={{ background: "rgba(241,242,244,0.97)" }}>
                      {activeList.title}
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}

            {selectedCard && (
              <div
                className="fixed inset-0 z-[90] bg-[#0b122033] dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setSelectedCardId(null)}
              >
                <div
                  className="w-full max-w-6xl h-[92vh] rounded-2xl overflow-hidden shadow-2xl border border-white/40 dark:border-white/10 bg-white/35 dark:bg-slate-900/55 backdrop-blur-xl flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {saveSuccessMessage && (
                    <div className="absolute left-1/2 top-4 z-[120] -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                      {saveSuccessMessage}
                    </div>
                  )}
                  <div className="relative h-36 px-6 py-4" style={{ background: board ? (BOARD_BG[board.color] || BOARD_BG.ocean) : BOARD_BG.ocean }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                    <div className="relative flex items-start justify-between h-full">
                      <input
                        value={detailTitle}
                        onChange={(e) => setDetailTitle(e.target.value)}
                        className="w-full max-w-[78%] rounded-md border border-white/40 bg-white/90 dark:bg-slate-900/70 dark:border-white/20 px-3 py-1.5 text-[28px] leading-tight font-extrabold text-[#172b4d] dark:text-slate-100"
                      />
                      <button
                        onClick={() => setSelectedCardId(null)}
                        className="text-white/90 hover:text-white p-1.5 rounded-lg hover:bg-white/20"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-0 h-[calc(92vh-9rem)] min-h-0">
                    <div className="overflow-y-auto p-6 border-r border-white/30 dark:border-white/10 bg-white/20 dark:bg-slate-900/20 min-h-0">
                      <div className="flex items-center gap-2 mb-5">
                        <button
                          onClick={() => handleToggleCardComplete(selectedCard.id)}
                          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold border ${selectedCard.metadata?.completed ? "bg-green-100/80 border-green-200 text-green-700" : "bg-white/70 dark:bg-slate-900/60 border-white/70 dark:border-white/20 text-[#44546f] dark:text-slate-200"}`}
                        >
                          {selectedCard.metadata?.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          {selectedCard.metadata?.completed ? "Concluído" : "Marcar concluído"}
                        </button>
                        {selectedCardProgress.total > 0 && (
                          <span className="text-xs font-semibold text-[#44546f] dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 border border-white/70 dark:border-white/20 rounded px-2 py-1">
                            Progresso: {selectedCardProgress.done}/{selectedCardProgress.total}
                          </span>
                        )}
                      </div>

                      <section className="mb-6 rounded-xl border border-white/60 dark:border-white/15 bg-white/55 dark:bg-slate-900/45 backdrop-blur-sm p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-[#172b4d] dark:text-slate-100 mb-2">Descrição</h3>
                        <textarea
                          value={detailDescription}
                          onChange={(e) => setDetailDescription(e.target.value)}
                          rows={5}
                          placeholder="Descreva o contexto, critérios e próximos passos..."
                          className="w-full rounded-lg border border-white/70 dark:border-white/20 bg-white/65 dark:bg-slate-900/55 px-3 py-2 text-sm text-[#172b4d] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </section>

                      <section className="mb-6 rounded-xl border border-white/60 dark:border-white/15 bg-white/55 dark:bg-slate-900/45 backdrop-blur-sm p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-[#172b4d] dark:text-slate-100 mb-2">Checklist</h3>
                        <CardChecklists
                          cardId={selectedCard.id}
                          onUpdated={() => refreshCard(selectedCard.id)}
                        />
                      </section>

                      <div className="h-2" />
                    </div>

                    <aside className="overflow-y-auto p-5 bg-white/30 dark:bg-slate-900/35 backdrop-blur-sm min-h-0">
                      <h3 className="text-xs font-bold text-[#44546f] dark:text-slate-300 uppercase tracking-wide mb-3">Ações do cartão</h3>
                      <div className="grid gap-2">
                        <button
                          onClick={handleSaveCardDetails}
                          disabled={savingDetails}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
                        >
                          <Check className="w-4 h-4" /> {savingDetails ? "Salvando..." : "Salvar alterações"}
                        </button>
                        <button
                          onClick={() => handleDuplicateCard(selectedCard.id)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-[#172b4d] dark:text-slate-100 text-sm font-semibold px-3 py-2 border border-white/80 dark:border-white/20"
                        >
                          <Copy className="w-4 h-4" /> Duplicar cartão
                        </button>
                        <button
                          onClick={() => handleEditCardDescription(selectedCard.id)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-[#172b4d] dark:text-slate-100 text-sm font-semibold px-3 py-2 border border-white/80 dark:border-white/20"
                        >
                          <Pencil className="w-4 h-4" /> Editar descrição rápida
                        </button>
                        <button
                          onClick={() => handleToggleCardComplete(selectedCard.id)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-[#172b4d] dark:text-slate-100 text-sm font-semibold px-3 py-2 border border-white/80 dark:border-white/20"
                        >
                          {selectedCard.metadata?.completed ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          {selectedCard.metadata?.completed ? "Marcar pendente" : "Marcar concluído"}
                        </button>
                        <button
                          onClick={() => handleDeleteCard(selectedCard.id)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-3 py-2 border border-red-200"
                        >
                          <Trash2 className="w-4 h-4" /> Excluir cartão
                        </button>
                      </div>

                      <section className="mt-5 rounded-xl border border-white/60 dark:border-white/15 bg-white/45 dark:bg-slate-900/45 backdrop-blur-sm p-3 shadow-sm">
                        <h4 className="text-xs font-bold text-[#44546f] dark:text-slate-300 uppercase tracking-wide mb-2">Comentários</h4>
                        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
                          {detailComments.length === 0 ? (
                            <p className="text-xs text-[#626f86] dark:text-slate-400">Nenhum comentário ainda.</p>
                          ) : detailComments.map((comment) => (
                            <div key={comment.id} className="rounded-lg bg-white/75 dark:bg-slate-900/55 border border-white/70 dark:border-white/15 px-2.5 py-2">
                              <p className="text-sm text-[#172b4d] dark:text-slate-100 whitespace-pre-wrap">{comment.text}</p>
                              <p className="text-[11px] text-[#626f86] dark:text-slate-400 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <input
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                            placeholder="Escrever comentário..."
                            className="w-full rounded-lg border border-white/70 dark:border-white/20 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-sm text-[#172b4d] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <button
                            onClick={handleAddComment}
                            className="w-full px-3 py-2 rounded-md bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm font-semibold"
                          >
                            Comentar
                          </button>
                        </div>
                      </section>
                    </aside>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={!!colorPickerCardId}
        onClose={() => setColorPickerCardId(null)}
        onSelect={(color) => handleConfirmCardCover(color)}
        currentColor={colorPickerCardId ? cards.find(c => c.id === colorPickerCardId)?.cover || undefined : undefined}
        title="Escolha a cor da capa do cartão"
      />

      {/* List Picker Modal */}
      <ListPickerModal
        isOpen={!!listPickerCardId}
        onClose={() => setListPickerCardId(null)}
        onSelect={(listId) => handleConfirmMoveCard(listId)}
        lists={lists.map(l => ({ id: l.id, name: l.title }))}
        currentListId={listPickerCardId ? cards.find(c => c.id === listPickerCardId)?.listId : undefined}
        title="Mover cartão para qual lista?"
      />

      {/* Delete Card Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmCard}
        onClose={() => setDeleteConfirmCard(null)}
        onConfirm={() => {
          if (deleteConfirmCard) {
            handleConfirmDeleteCard(deleteConfirmCard);
          }
        }}
        title="Excluir cartão"
        message="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isDangerous
      />
    </AuthGuard>
  );
}