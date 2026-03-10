import { useState } from "react";
import { useCardComments } from "../../hooks/useCardComments";

export function CardComments({ cardId }: { cardId: string }) {
  const { comments, loading, error, addComment, removeComment } = useCardComments(cardId);
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(text);
    setText("");
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Comentários</h4>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Adicionar comentário..."
          style={{ flex: 1, padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button type="submit" disabled={loading || !text.trim()} style={{ padding: 6, borderRadius: 4, background: "#0070f3", color: "#fff", border: "none" }}>
          Comentar
        </button>
      </form>
      {error && <div style={{ color: "red", fontSize: 12 }}>{error}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {comments.map((c: any) => (
          <li key={c.id} style={{ marginBottom: 8, background: "#f9f9f9", borderRadius: 4, padding: 8, display: "flex", justifyContent: "space-between" }}>
            <span>{c.text}</span>
            <button onClick={() => removeComment(c.id)} style={{ background: "transparent", border: "none", color: "#e00", cursor: "pointer" }} disabled={loading}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
