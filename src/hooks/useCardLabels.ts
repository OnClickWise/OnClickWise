import { useState, useEffect } from "react";
import { getLabels, addLabel, deleteLabel, CardLabel } from "../services/cardLabelService";

export function useCardLabels(cardId: string) {
  const [labels, setLabels] = useState<CardLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    getLabels(cardId)
      .then(setLabels)
      .catch((e: any) => setError(e.message || "Erro ao carregar labels"))
      .finally(() => setLoading(false));
  }, [cardId]);

  async function addLabelHandler(name: string, color: string) {
    setLoading(true);
    setError("");
    try {
      const newLabel = await addLabel(cardId, name, color);
      setLabels(prev => [...prev, newLabel]);
    } catch (e: any) {
      setError(e.message || "Erro ao adicionar label");
    } finally {
      setLoading(false);
    }
  }

  async function removeLabelHandler(labelId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteLabel(cardId, labelId);
      setLabels(prev => prev.filter(l => l.id !== labelId));
    } catch (e: any) {
      setError(e.message || "Erro ao remover label");
    } finally {
      setLoading(false);
    }
  }

  return { labels, loading, error, addLabel: addLabelHandler, removeLabel: removeLabelHandler };
}
