import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface CardLabel {
  id: string;
  cardId: string;
  name: string;
  color: string;
}

export async function getLabels(cardId: string): Promise<CardLabel[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/labels`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao buscar labels");
  return res.json();
}

export async function addLabel(cardId: string, name: string, color: string): Promise<CardLabel> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/labels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error("Erro ao adicionar label");
  return res.json();
}

export async function deleteLabel(cardId: string, labelId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/labels/${labelId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao excluir label");
  return res.json();
}
