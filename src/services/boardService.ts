import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

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
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/boards?projectId=${projectId}`, {
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Erro ao buscar quadros");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeBoard);
}

export async function getBoard(boardId: string): Promise<Board> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Erro ao buscar quadro");
  return normalizeBoard(await res.json());
}

export async function createBoard(data: CreateBoardRequest): Promise<Board> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ title: data.title, projectId: data.projectId, color: data.color || "ocean", description: data.description }),
  });
  if (!res.ok) throw new Error("Erro ao criar quadro");
  return normalizeBoard(await res.json());
}

export async function updateBoard(boardId: string, data: Partial<CreateBoardRequest>): Promise<Board> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar quadro");
  return normalizeBoard(await res.json());
}

export async function deleteBoard(boardId: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Erro ao excluir quadro");
}
