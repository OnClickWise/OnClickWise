import { authenticatedFetch } from "@/services/authService";
import { getApiBaseUrl } from "@/lib/api-url";

const API_BASE_URL = getApiBaseUrl();

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  cover?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  listId: string;
  position?: number;
  cover?: string;
  metadata?: Record<string, any>;
}

function normalizeCard(c: any): Card {
  let meta: Record<string, any> = {};
  if (typeof c.metadata === "string") {
    try {
      meta = JSON.parse(c.metadata || "{}");
    } catch {
      meta = {};
    }
  } else {
    meta = c.metadata || {};
  }

  return {
    id: c.id,
    title: c.title || "",
    description: c.description || "",
    listId: c.listId || c.list_id || c.column_id || "",
    position: c.position ?? c.order ?? 0,
    cover: c.cover || meta.cover || null,
    metadata: meta,
    createdAt: c.createdAt || c.created_at || "",
    updatedAt: c.updatedAt || c.updated_at || "",
  };
}

export async function getCardById(cardId: string): Promise<Card> {
  const res = await authenticatedFetch(`${API_BASE_URL}/cards/${cardId}`);
  if (!res.ok) throw new Error("Erro ao buscar cartao");
  return normalizeCard(await res.json());
}

export async function getCards(listId: string): Promise<Card[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/cards?listId=${listId}`);
  if (!res.ok) throw new Error("Erro ao buscar cartoes");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeCard);
}

export async function getCardsByBoard(boardId: string): Promise<Card[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/cards?boardId=${boardId}`);
  if (!res.ok) throw new Error("Erro ao buscar cartoes do board");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeCard);
}

export async function createCard(data: CreateCardRequest): Promise<Card> {
  const metadata = { ...(data.metadata || {}), ...(data.cover ? { cover: data.cover } : {}) };
  const res = await authenticatedFetch(`${API_BASE_URL}/cards`, {
    method: "POST",
    body: JSON.stringify({ title: data.title, description: data.description, columnId: data.listId, listId: data.listId, position: data.position ?? 0, metadata }),
  });
  if (!res.ok) throw new Error("Erro ao criar cartao");
  return normalizeCard(await res.json());
}

export async function updateCard(cardId: string, data: Partial<CreateCardRequest>): Promise<Card> {
  const body: any = { ...data };
  if (data.listId) { body.columnId = data.listId; body.listId = data.listId; }
  const res = await authenticatedFetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erro ao atualizar cartao");
  return normalizeCard(await res.json());
}

export async function deleteCard(cardId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao excluir cartao");
}
