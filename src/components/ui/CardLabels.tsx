import React, { useEffect, useState } from "react";
import { getLabels, addLabel, deleteLabel, CardLabel } from "@/services/cardLabelService";

interface CardLabelsProps {
  cardId: string;
}

export default function CardLabels({ cardId }: CardLabelsProps) {
  const [labels, setLabels] = useState<CardLabel[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [color, setColor] = useState("#0070f3");

  useEffect(() => {
    if (!cardId) return;
    getLabels(cardId).then(setLabels).catch(() => setLabels([]));
  }, [cardId]);

  async function handleAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      const label = await addLabel(cardId, newLabel, color);
      setLabels((prev) => [...prev, label]);
      setNewLabel("");
    } catch {}
  }

  async function handleDeleteLabel(labelId: string) {
    if (!window.confirm("Excluir esta label?")) return;
    try {
      await deleteLabel(cardId, labelId);
      setLabels((prev) => prev.filter(l => l.id !== labelId));
    } catch {}
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <strong>Labels:</strong>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
        {labels.map(label => (
          <span key={label.id} style={{ background: label.color, color: '#fff', borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center' }}>
            {label.name}
            <button onClick={() => handleDeleteLabel(label.id)} style={{ marginLeft: 4, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </span>
        ))}
      </div>
      <form onSubmit={handleAddLabel} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Nova label..."
          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px' }}>Adicionar</button>
      </form>
    </div>
  );
}
