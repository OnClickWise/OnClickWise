import React, { useEffect, useState } from "react";
import { getMembers, addMember, removeMember, CardMember } from "@/services/cardMemberService";

interface CardMembersProps {
  cardId: string;
  // Para um sistema real, você buscaria os usuários do projeto/time para sugerir
  availableUsers: { id: string; name: string; avatarUrl?: string }[];
}

export default function CardMembers({ cardId, availableUsers }: CardMembersProps) {
  const [members, setMembers] = useState<CardMember[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!cardId) return;
    getMembers(cardId).then(setMembers).catch(() => setMembers([]));
  }, [cardId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      const member = await addMember(cardId, selected);
      setMembers((prev) => [...prev, member]);
      setSelected("");
    } catch {}
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm("Remover este membro?")) return;
    try {
      await removeMember(cardId, memberId);
      setMembers((prev) => prev.filter(m => m.id !== memberId));
    } catch {}
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <strong>Membros:</strong>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
        {members.map(member => (
          <span key={member.id} style={{ background: '#eee', borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center' }}>
            {member.avatarUrl && <img src={member.avatarUrl} alt={member.name} style={{ width: 20, height: 20, borderRadius: '50%', marginRight: 4 }} />}
            {member.name}
            <button onClick={() => handleRemove(member.id)} style={{ marginLeft: 4, color: '#e00', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </span>
        ))}
      </div>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={selected} onChange={e => setSelected(e.target.value)} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}>
          <option value="">Adicionar membro...</option>
          {availableUsers.filter(u => !members.some(m => m.userId === u.id)).map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px' }}>Adicionar</button>
      </form>
    </div>
  );
}
