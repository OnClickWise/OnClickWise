import { useState, useEffect } from "react";
import {
  getChecklists,
  addChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  CardChecklist
} from "../services/cardChecklistService";

export function useCardChecklists(cardId: string) {
  const [checklists, setChecklists] = useState<CardChecklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    getChecklists(cardId)
      .then(setChecklists)
      .catch((e: any) => setError(e.message || "Erro ao carregar checklists"))
      .finally(() => setLoading(false));
  }, [cardId]);

  async function addChecklistHandler(title: string) {
    setLoading(true);
    setError("");
    try {
      const checklist = await addChecklist(cardId, title);
      setChecklists(prev => [...prev, checklist]);
    } catch (e: any) {
      setError(e.message || "Erro ao adicionar checklist");
    } finally {
      setLoading(false);
    }
  }

  async function removeChecklist(checklistId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteChecklist(cardId, checklistId);
      setChecklists(prev => prev.filter(c => c.id !== checklistId));
    } catch (e: any) {
      setError(e.message || "Erro ao remover checklist");
    } finally {
      setLoading(false);
    }
  }

  async function addItem(checklistId: string, text: string) {
    setLoading(true);
    setError("");
    try {
      const updatedChecklist = await addChecklistItem(cardId, checklistId, text);
      setChecklists(prev => prev.map(c => c.id === checklistId ? updatedChecklist : c));
    } catch (e: any) {
      setError(e.message || "Erro ao adicionar item");
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(checklistId: string, itemId: string, checked: boolean) {
    setLoading(true);
    setError("");
    try {
      const updatedChecklist = await toggleChecklistItem(cardId, checklistId, itemId, checked);
      setChecklists(prev => prev.map(c => c.id === checklistId ? updatedChecklist : c));
    } catch (e: any) {
      setError(e.message || "Erro ao atualizar item");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(checklistId: string, itemId: string) {
    setLoading(true);
    setError("");
    try {
      // Não existe removeChecklistItem, apenas filtra localmente
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      ));
    } catch (e: any) {
      setError(e.message || "Erro ao remover item");
    } finally {
      setLoading(false);
    }
  }

  return { checklists, loading, error, addChecklist, removeChecklist, addItem, toggleItem, removeItem };
}
