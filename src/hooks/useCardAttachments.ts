import { useState, useEffect } from "react";
import { getAttachments, addAttachment, deleteAttachment, CardAttachment } from "../services/cardAttachmentService";

export function useCardAttachments(cardId: string) {
  const [attachments, setAttachments] = useState<CardAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    getAttachments(cardId)
      .then(setAttachments)
      .catch((e: any) => setError(e.message || "Erro ao carregar anexos"))
      .finally(() => setLoading(false));
  }, [cardId]);

  const addAttachmentHandler = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const attachment = await addAttachment(cardId, file);
      setAttachments(prev => [...prev, attachment]);
    } catch (e: any) {
      setError(e.message || "Erro ao adicionar anexo");
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    setLoading(true);
    setError("");
    try {
      await deleteAttachment(cardId, attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (e: any) {
      setError(e.message || "Erro ao excluir anexo");
    } finally {
      setLoading(false);
    }
  };

  return { attachments, loading, error, addAttachment: addAttachmentHandler, removeAttachment };
}
