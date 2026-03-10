import React, { useEffect, useState } from "react";
import { getDueDate, setDueDate, clearDueDate } from "@/services/cardDueDateService";

interface CardDueDateProps {
  cardId: string;
}

export default function CardDueDate({ cardId }: CardDueDateProps) {
  const [dueDate, setDueDateState] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!cardId) return;
    getDueDate(cardId).then(setDueDateState);
  }, [cardId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!input) return;
    try {
      const newDate = await setDueDate(cardId, input);
      setDueDateState(newDate);
      setEditing(false);
    } catch {}
  }

  async function handleClear() {
    if (!window.confirm("Remover data de entrega?")) return;
    try {
      await clearDueDate(cardId);
      setDueDateState(null);
    } catch {}
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <strong>Data de entrega:</strong>
      {editing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px' }}>Salvar</button>
          <button type="button" onClick={() => setEditing(false)} style={{ border: 'none', background: 'transparent', color: '#888' }}>Cancelar</button>
        </form>
      ) : dueDate ? (
        <span style={{ marginLeft: 8 }}>
          {new Date(dueDate).toLocaleDateString()}
          <button onClick={() => setEditing(true)} style={{ marginLeft: 8, color: '#0070f3', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
          <button onClick={handleClear} style={{ marginLeft: 4, color: '#e00', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
        </span>
      ) : (
        <button onClick={() => setEditing(true)} style={{ marginLeft: 8, color: '#0070f3', background: 'none', border: 'none', cursor: 'pointer' }}>Adicionar data</button>
      )}
    </div>
  );
}
