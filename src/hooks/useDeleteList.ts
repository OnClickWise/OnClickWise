import { useState } from "react";
import { deleteList } from "../services/listService";

export function useDeleteList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(listId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteList(listId);
      return true;
    } catch (e: any) {
      setError(e.message || "Erro ao excluir lista");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, handleDelete };
}
