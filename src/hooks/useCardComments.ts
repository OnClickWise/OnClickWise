import { useState, useEffect } from "react";
import { CardComment, getComments, addComment, deleteComment } from "../services/cardCommentService";
export function useCardComments(cardId: string) {
  const [comments, setComments] = useState<CardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    getComments(cardId)
      .then(setComments)
      .catch((e: any) => setError(e.message || "Erro ao carregar comentários"))
      .finally(() => setLoading(false));
  }, [cardId]);

  async function addCommentHandler(text: string) {
    setLoading(true);
    setError("");
    try {
      const comment = await addComment(cardId, text);
      setComments(prev => [...prev, comment]);
    } catch (e: any) {
      setError(e.message || "Erro ao adicionar comentário");
    } finally {
      setLoading(false);
    }
  }

  async function removeComment(commentId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteComment(cardId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e: any) {
      setError(e.message || "Erro ao excluir comentário");
    } finally {
      setLoading(false);
    }
  }

  return { comments, loading, error, addComment: addCommentHandler, removeComment };
}
