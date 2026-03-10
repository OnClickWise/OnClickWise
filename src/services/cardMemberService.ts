import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface CardMember {
  id: string;
  cardId: string;
  userId: string;
  name: string;
  avatarUrl?: string;
}

export async function getMembers(cardId: string): Promise<CardMember[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/members`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao buscar membros");
  return res.json();
}

export async function addMember(cardId: string, userId: string): Promise<CardMember> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Erro ao adicionar membro");
  return res.json();
}

export async function removeMember(cardId: string, memberId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/members/${memberId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao remover membro");
  return res.json();
}
