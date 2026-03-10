import { getAuthToken } from "@/lib/cookies";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface CardAttachment {
  id: string;
  cardId: string;
  name: string;
  url: string;
  createdAt: string;
}

export async function getAttachments(cardId: string): Promise<CardAttachment[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/attachments`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao buscar anexos");
  return res.json();
}

export async function addAttachment(cardId: string, file: File): Promise<CardAttachment> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/attachments`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  if (!res.ok) throw new Error("Erro ao adicionar anexo");
  return res.json();
}

export async function deleteAttachment(cardId: string, attachmentId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Erro ao excluir anexo");
  return res.json();
}
