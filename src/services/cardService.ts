import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  cover?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  listId: string;
  position?: number;
  cover?: string;
}

function normalizeCard(c: any): Card {
  const meta = typeof c.metadata === "string" ? JSON.parse(c.metadata || "{}") : (c.metadata || {});
  return {
    id: c.id,
    title: c.title || "",
    description: c.description || "",
    listId: c.listId || c.list_id || c.column_id || "",
    position: c.position ?? c.order ?? 0,
    cover: c.cover || meta.cover || null,
    createdAt: c.createdAt || c.created_at || "",
    updatedAt: c.updatedAt || c.updated_at || "",
  };
}

export async function getCards(listId: string): Promise<Card[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards?listId=${listId}`, {
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Erro ao buscar cartoes");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeCard);
}

export async function createCard(data: CreateCardRequest): Promise<Card> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ title: data.title, description: data.description, columnId: data.listId, listId: data.listId, position: data.position ?? 0, metadata: data.cover ? { cover: data.cover } : {} }),
  });
  if (!res.ok) throw new Error("Erro ao criar cartao");
  return normalizeCard(await res.json());
}

export async function updateCard(cardId: string, data: Partial<CreateCardRequest>): Promise<Card> {
  const token = getAuthToken();
  const body: any = { ...data };
  if (data.listId) { body.columnId = data.listId; body.listId = data.listId; }
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erro ao atualizar cartao");
  return normalizeCard(await res.json());
}

export async function deleteCard(cardId: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Erro ao excluir cartao");
}
