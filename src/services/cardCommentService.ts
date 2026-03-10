import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface CardComment {
  id: string;
  cardId: string;
  user: string;
  text: string;
  createdAt: string;
}

export async function getComments(cardId: string): Promise<CardComment[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/comments`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao buscar comentários");
  return res.json();
}

export async function addComment(cardId: string, text: string): Promise<CardComment> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Erro ao adicionar comentário");
  return res.json();
}

export async function deleteComment(cardId: string, commentId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao excluir comentário");
  return res.json();
}
