import { useState } from "react";
import { deleteCard } from "../services/cardService";

export function useDeleteCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(cardId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteCard(cardId);
      return true;
    } catch (e: any) {
      setError(e.message || "Erro ao excluir cartão");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, handleDelete };
}
