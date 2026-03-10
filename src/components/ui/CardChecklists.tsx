import React, { useEffect, useState } from "react";
import {
  getChecklists,
  addChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklist,
  CardChecklist
} from "@/services/cardChecklistService";

interface CardChecklistsProps {
  cardId: string;
}

export default function CardChecklists({ cardId }: CardChecklistsProps) {
  const [checklists, setChecklists] = useState<CardChecklist[]>([]);
  const [newChecklist, setNewChecklist] = useState("");
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!cardId) return;
    getChecklists(cardId).then(setChecklists).catch(() => setChecklists([]));
  }, [cardId]);

  async function handleAddChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newChecklist.trim()) return;
    try {
      const checklist = await addChecklist(cardId, newChecklist);
      setChecklists((prev) => [...prev, checklist]);
      setNewChecklist("");
    } catch {}
  }

  async function handleAddItem(e: React.FormEvent, checklistId: string) {
    e.preventDefault();
    const text = newItem[checklistId]?.trim();
    if (!text) return;
    try {
      const updated = await addChecklistItem(cardId, checklistId, text);
      setChecklists((prev) => prev.map(cl => cl.id === checklistId ? updated : cl));
      setNewItem((prev) => ({ ...prev, [checklistId]: "" }));
    } catch {}
  }

  async function handleToggleItem(checklistId: string, itemId: string, checked: boolean) {
    try {
      const updated = await toggleChecklistItem(cardId, checklistId, itemId, checked);
      setChecklists((prev) => prev.map(cl => cl.id === checklistId ? updated : cl));
    } catch {}
  }

  async function handleDeleteChecklist(checklistId: string) {
    if (!window.confirm("Excluir este checklist?")) return;
    try {
      await deleteChecklist(cardId, checklistId);
      setChecklists((prev) => prev.filter(cl => cl.id !== checklistId));
    } catch {}
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <strong>Checklists:</strong>
      {checklists.map(cl => (
        <div key={cl.id} style={{ marginTop: 8, background: '#f7f7f7', borderRadius: 6, padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 500 }}>{cl.title}</div>
            <button onClick={() => handleDeleteChecklist(cl.id)} style={{ color: '#e00', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
          </div>
          <ul style={{ margin: '8px 0' }}>
            {cl.items.map(item => (
              <li key={item.id}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleItem(cl.id, item.id, !item.checked)}
                  />
                  {item.text}
                </label>
              </li>
            ))}
          </ul>
          <form onSubmit={e => handleAddItem(e, cl.id)} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newItem[cl.id] || ""}
              onChange={e => setNewItem(prev => ({ ...prev, [cl.id]: e.target.value }))}
              placeholder="Novo item..."
              style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px' }}>Adicionar</button>
          </form>
        </div>
      ))}
      <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={newChecklist}
          onChange={e => setNewChecklist(e.target.value)}
          placeholder="Novo checklist..."
          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px' }}>Adicionar</button>
      </form>
    </div>
  );
}
