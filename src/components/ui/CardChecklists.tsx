import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, Trash2, Edit2 } from "lucide-react";
import {
  getChecklists,
  addChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklist,
  updateChecklistItem,
  deleteChecklistItem,
  CardChecklist
} from "@/services/cardChecklistService";
import { TextEditModal } from "@/components/modals/TextEditModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface CardChecklistsProps {
  cardId: string;
  onUpdated?: () => void;
}

export default function CardChecklists({ cardId, onUpdated }: CardChecklistsProps) {
  const [checklists, setChecklists] = useState<CardChecklist[]>([]);
  const [newChecklist, setNewChecklist] = useState("");
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({});
  const [editingItem, setEditingItem] = useState<{ checklistId: string; itemId: string; text: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ checklistId: string; itemId: string } | null>(null);

  useEffect(() => {
    if (!cardId) return;
    getChecklists(cardId).then(setChecklists).catch(() => setChecklists([]));
  }, [cardId]);

  async function handleAddChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newChecklist.trim()) return;
    try {
      const checklist = await addChecklist(cardId, newChecklist);
      setChecklists((prev) => [...prev, checklist]);
      setNewChecklist("");
      onUpdated?.();
    } catch {}
  }

  async function handleAddItem(e: React.FormEvent, checklistId: string) {
    e.preventDefault();
    const text = newItem[checklistId]?.trim();
    if (!text) return;
    try {
      const updated = await addChecklistItem(cardId, checklistId, text);
      setChecklists((prev) => prev.map(cl => cl.id === checklistId ? updated : cl));
      setNewItem((prev) => ({ ...prev, [checklistId]: "" }));
      onUpdated?.();
    } catch {}
  }

  async function handleToggleItem(checklistId: string, itemId: string, checked: boolean) {
    try {
      const updated = await toggleChecklistItem(cardId, checklistId, itemId, checked);
      setChecklists((prev) => prev.map(cl => cl.id === checklistId ? updated : cl));
      onUpdated?.();
    } catch {}
  }

  async function handleDeleteChecklist(checklistId: string) {
    if (!window.confirm("Excluir este checklist?")) return;
    try {
      await deleteChecklist(cardId, checklistId);
      setChecklists((prev) => prev.filter(cl => cl.id !== checklistId));
      onUpdated?.();
    } catch {}
  }

  async function handleEditItem(checklistId: string, itemId: string, newText: string) {
    try {
      const updated = await updateChecklistItem(cardId, checklistId, itemId, newText);
      setChecklists((prev) => prev.map(cl => cl.id === checklistId ? updated : cl));
      onUpdated?.();
    } catch {}
  }

  async function handleDeleteItem(checklistId: string, itemId: string) {
    try {
      const updated = await deleteChecklistItem(cardId, checklistId, itemId);
      setChecklists((prev) => prev.map(cl => cl.id === checklistId ? updated : cl));
      onUpdated?.();
    } catch {}
  }

  const totals = checklists.reduce(
    (acc, checklist) => {
      const total = checklist.items.length;
      const done = checklist.items.filter((item) => item.checked).length;
      return {
        total: acc.total + total,
        done: acc.done + done,
      };
    },
    { total: 0, done: 0 },
  );

  const progress = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[#172b4d] dark:text-slate-100">
        <CheckSquare className="w-4 h-4" />
        <strong className="text-sm font-semibold">Checklists</strong>
      </div>

      {totals.total > 0 && (
        <div className="rounded-lg border border-white/70 dark:border-white/15 bg-white/60 dark:bg-slate-900/45 backdrop-blur-sm px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#5e6c84] dark:text-slate-300">
            <span>Progresso geral</span>
            <span>{totals.done}/{totals.total} ({progress}%)</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#d4d8de]">
            <div
              className={`h-full transition-all ${progress === 100 ? "bg-[#22a06b]" : "bg-[#0c66e4]"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {checklists.map(cl => (
        <div key={cl.id} className="rounded-xl border border-white/70 dark:border-white/15 bg-white/55 dark:bg-slate-900/45 backdrop-blur-sm p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#172b4d] dark:text-slate-100">{cl.title}</p>
              <p className="text-[11px] text-[#5e6c84] dark:text-slate-300">
                {cl.items.filter((item) => item.checked).length}/{cl.items.length} itens concluídos
              </p>
            </div>
            <button
              onClick={() => handleDeleteChecklist(cl.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
              title="Excluir checklist"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <ul className="space-y-1.5">
            {cl.items.map(item => (
              <li key={item.id}>
                <div className="group/item flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleItem(cl.id, item.id, !item.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0c66e4] focus:ring-[#0c66e4]"
                  />
                  <span className={`flex-1 text-sm ${item.checked ? "text-[#5e6c84] dark:text-slate-400 line-through" : "text-[#172b4d] dark:text-slate-100"}`}>{item.text}</span>
                  
                  {/* Edit and Delete Icons - Visible on Hover */}
                  <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingItem({ checklistId: cl.id, itemId: item.id, text: item.text })}
                      className="inline-flex h-6 w-6 items-center justify-center text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingItem({ checklistId: cl.id, itemId: item.id })}
                      className="inline-flex h-6 w-6 items-center justify-center text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={e => handleAddItem(e, cl.id)} className="mt-2 flex gap-2">
            <input
              type="text"
              value={newItem[cl.id] || ""}
              onChange={e => setNewItem(prev => ({ ...prev, [cl.id]: e.target.value }))}
              placeholder="Novo item..."
              className="h-9 flex-1 rounded-md border border-white/80 dark:border-white/20 bg-white/70 dark:bg-slate-900/55 px-2.5 text-sm text-[#172b4d] dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#0c66e4]"
            />
            <button type="submit" className="inline-flex h-9 items-center gap-1 rounded-md bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc]">
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </form>
        </div>
      ))}

      <form onSubmit={handleAddChecklist} className="flex gap-2">
        <input
          type="text"
          value={newChecklist}
          onChange={e => setNewChecklist(e.target.value)}
          placeholder="Novo checklist..."
          className="h-9 flex-1 rounded-md border border-white/80 dark:border-white/20 bg-white/70 dark:bg-slate-900/55 px-2.5 text-sm text-[#172b4d] dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#0c66e4]"
        />
        <button type="submit" className="inline-flex h-9 items-center gap-1 rounded-md bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc]">
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </form>

      {/* Edit Item Modal */}
      <TextEditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(newText) => {
          if (editingItem) {
            handleEditItem(editingItem.checklistId, editingItem.itemId, newText);
          }
        }}
        initialValue={editingItem?.text || ""}
        title="Editar item do checklist"
        placeholder="Digite o novo texto..."
      />

      {/* Delete Item Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) {
            handleDeleteItem(deletingItem.checklistId, deletingItem.itemId);
          }
        }}
        title="Excluir item"
        message="Tem certeza que deseja excluir este item?"
        confirmText="Excluir"
        isDangerous
      />
    </div>
  );
}
