import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface CardChecklist {
  id: string;
  cardId: string;
  title: string;
  items: { id: string; text: string; checked: boolean }[];
}

export async function getChecklists(cardId: string): Promise<CardChecklist[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/checklists`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao buscar checklists");
  return res.json();
}

export async function addChecklist(cardId: string, title: string): Promise<CardChecklist> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/checklists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Erro ao adicionar checklist");
  return res.json();
}

export async function addChecklistItem(cardId: string, checklistId: string, text: string): Promise<CardChecklist> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/checklists/${checklistId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Erro ao adicionar item");
  return res.json();
}

export async function toggleChecklistItem(cardId: string, checklistId: string, itemId: string, checked: boolean): Promise<CardChecklist> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ checked }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar item");
  return res.json();
}

export async function deleteChecklist(cardId: string, checklistId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/checklists/${checklistId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao excluir checklist");
  return res.json();
}
