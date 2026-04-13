import { authenticatedFetch } from "@/services/authService";
import { getApiBaseUrl } from "@/lib/api-url";

const API_BASE_URL = getApiBaseUrl();

export interface Board {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
  projectId: string;
  color?: string;
}

function normalizeBoard(b: any): Board {
  return {
    id: b.id,
    title: b.title || b.name || "",
    description: b.description || "",
    projectId: b.projectId || b.project_id || "",
    color: b.color || "ocean",
    createdAt: b.createdAt || b.created_at || "",
    updatedAt: b.updatedAt || b.updated_at || "",
  };
}

export async function getBoards(projectId: string): Promise<Board[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/boards?projectId=${projectId}`);
  if (!res.ok) throw new Error("Erro ao buscar quadros");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeBoard);
}

export async function getBoard(boardId: string): Promise<Board> {
  const res = await authenticatedFetch(`${API_BASE_URL}/boards/${boardId}`);
  if (!res.ok) throw new Error("Erro ao buscar quadro");
  return normalizeBoard(await res.json());
}

export async function createBoard(data: CreateBoardRequest): Promise<Board> {
  const res = await authenticatedFetch(`${API_BASE_URL}/boards`, {
    method: "POST",
    body: JSON.stringify({ title: data.title, projectId: data.projectId, color: data.color || "ocean", description: data.description }),
  });
  if (!res.ok) throw new Error("Erro ao criar quadro");
  return normalizeBoard(await res.json());
}

export async function updateBoard(boardId: string, data: Partial<CreateBoardRequest>): Promise<Board> {
  const res = await authenticatedFetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar quadro");
  return normalizeBoard(await res.json());
}

export async function deleteBoard(boardId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao excluir quadro");
}
