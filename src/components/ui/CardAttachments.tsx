import { useRef } from "react";
import { useCardAttachments } from "../../hooks/useCardAttachments";

export function CardAttachments({ cardId }: { cardId: string }) {
  const { attachments, loading, error, addAttachment, removeAttachment } = useCardAttachments(cardId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      addAttachment(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Anexos</h4>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} disabled={loading} />
      {error && <div style={{ color: "red", fontSize: 12 }}>{error}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {attachments.map((a: any) => (
          <li key={a.id} style={{ marginBottom: 8, background: "#f9f9f9", borderRadius: 4, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>{a.name || a.url}</a>
            <button onClick={() => removeAttachment(a.id)} style={{ background: "transparent", border: "none", color: "#e00", cursor: "pointer" }} disabled={loading}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
