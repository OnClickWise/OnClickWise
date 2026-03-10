import { useState, useEffect } from "react";
import { getDueDate, setDueDate, clearDueDate } from "../services/cardDueDateService";

export function useCardDueDate(cardId: string) {
  const [dueDate, setDueDateState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    getDueDate(cardId)
      .then((due) => setDueDateState(due))
      .catch((e: any) => setError(e.message || "Erro ao carregar data"))
      .finally(() => setLoading(false));
  }, [cardId]);

  async function updateDueDate(date: string) {
    setLoading(true);
    setError("");
    try {
      const newDate = await setDueDate(cardId, date);
      setDueDateState(newDate);
    } catch (e: any) {
      setError(e.message || "Erro ao definir data");
    } finally {
      setLoading(false);
    }
  }

  async function clearDueDateHandler() {
    setLoading(true);
    setError("");
    try {
      await clearDueDate(cardId);
      setDueDateState(null);
    } catch (e: any) {
      setError(e.message || "Erro ao remover data");
    } finally {
      setLoading(false);
    }
  }

  return { dueDate, loading, error, updateDueDate, clearDueDate: clearDueDateHandler };
}
