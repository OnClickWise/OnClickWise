import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export async function getDueDate(cardId: string): Promise<string | null> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/due-date`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.dueDate || null;
}

export async function setDueDate(cardId: string, dueDate: string): Promise<string> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/due-date`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ dueDate }),
  });
  if (!res.ok) throw new Error("Erro ao definir data de entrega");
  const data = await res.json();
  return data.dueDate;
}

export async function clearDueDate(cardId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/due-date`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao remover data de entrega");
  return res.json();
}
