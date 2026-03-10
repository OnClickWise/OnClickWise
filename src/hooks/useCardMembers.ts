
import { useState, useEffect } from "react";
import { getMembers, addMember, removeMember, CardMember } from "../services/cardMemberService";

export function useCardMembers(cardId: string) {
    const [members, setMembers] = useState<CardMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      if (!cardId) return;
      setLoading(true);
      getMembers(cardId)
        .then(setMembers)
        .catch((e: unknown) => {
          if (e && typeof e === 'object' && 'message' in e) {
            setError((e as any).message || "Erro ao carregar membros");
          } else {
            setError("Erro ao carregar membros");
          }
        })
        .finally(() => setLoading(false));
    }, [cardId]);

    const addMemberToCard = async (userId: string) => {
      setLoading(true);
      setError("");
      try {
        const newMember = await addMember(cardId, userId);
        setMembers(prev => [...prev, newMember]);
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'message' in e) {
          setError((e as any).message || "Erro ao adicionar membro");
        } else {
          setError("Erro ao adicionar membro");
        }
      } finally {
        setLoading(false);
      }
    };

    const removeMemberFromCard = async (memberId: string) => {
      setLoading(true);
      setError("");
      try {
        await removeMember(cardId, memberId);
        setMembers(prev => prev.filter((m) => m.id !== memberId));
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'message' in e) {
          setError((e as any).message || "Erro ao remover membro");
        } else {
          setError("Erro ao remover membro");
        }
      } finally {
        setLoading(false);
      }
    };

    return { members, loading, error, addMember: addMemberToCard, removeMember: removeMemberFromCard };
  }
