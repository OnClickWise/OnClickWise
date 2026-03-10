import React, { useEffect, useState } from "react";
import CardLabels from "@/components/ui/CardLabels";
import CardChecklists from "@/components/ui/CardChecklists";
import CardDueDate from "@/components/ui/CardDueDate";
import CardMembers from "@/components/ui/CardMembers";
import { CardComments } from "@/components/ui/CardComments";
import { CardAttachments } from "@/components/ui/CardAttachments";

interface CardModalProps {
  open: boolean;
  onClose: () => void;
  card: {
    id: string;
    title: string;
    description?: string;
    labels?: string[];
    dueDate?: string;
    members?: string[];
    checklists?: { id: string; title: string; items: { id: string; text: string; checked: boolean }[] }[];
    attachments?: { id: string; name: string; url: string }[];
    comments?: { id: string; user: string; text: string; createdAt: string }[];
  };
}

// Exemplo de usuários disponíveis (em produção, buscar do contexto do projeto/time)
const mockUsers = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
];

export default function CardModal({ open, onClose, card }: CardModalProps) {


  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: "0 4px 32px #0003", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>×</button>
        <h2>{card.title}</h2>
        <div style={{ marginBottom: 16, color: "#666" }}>{card.description}</div>
        {/* Labels */}
        <CardLabels cardId={card.id} />
        <CardDueDate cardId={card.id} />
        <CardMembers cardId={card.id} availableUsers={mockUsers} />
        {/* Due Date */}
        {card.dueDate && (
          <div style={{ marginBottom: 16 }}>
            <strong>Data de entrega:</strong> {new Date(card.dueDate).toLocaleDateString()}
          </div>
        )}
        {/* Members */}
        {card.members && card.members.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>Membros:</strong> {card.members.join(", ")}
          </div>
        )}
        {/* Checklists */}
        <CardChecklists cardId={card.id} />
        {/* Attachments */}
        <CardAttachments cardId={card.id} />
        {/* Comments */}
        <CardComments cardId={card.id} />
      </div>
    </div>
  );
}
