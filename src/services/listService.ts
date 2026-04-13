import { authenticatedFetch } from "@/services/authService";
import { getApiBaseUrl } from "@/lib/api-url";

const API_BASE_URL = getApiBaseUrl();

export interface List {
  id: string;
  title: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListRequest {
  title: string;
  boardId: string;
  position?: number;
}

function normalizeList(l: any): List {
  return {
    id: l.id,
    title: l.title || l.name || "",
    boardId: l.boardId || l.board_id || "",
    position: l.position ?? l.order ?? 0,
    createdAt: l.createdAt || l.created_at || "",
    updatedAt: l.updatedAt || l.updated_at || "",
  };
}

export async function getLists(boardId: string): Promise<List[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/lists?boardId=${boardId}`);
  if (!res.ok) throw new Error("Erro ao buscar listas");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeList);
}

export async function createList(data: CreateListRequest): Promise<List> {
  const res = await authenticatedFetch(`${API_BASE_URL}/lists`, {
    method: "POST",
    body: JSON.stringify({ title: data.title, boardId: data.boardId, position: data.position ?? 0 }),
  });
  if (!res.ok) throw new Error("Erro ao criar lista");
  return normalizeList(await res.json());
}

export async function updateList(listId: string, data: Partial<CreateListRequest>): Promise<List> {
  const res = await authenticatedFetch(`${API_BASE_URL}/lists/${listId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar lista");
  return normalizeList(await res.json());
}

export async function deleteList(listId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE_URL}/lists/${listId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao excluir lista");
}
