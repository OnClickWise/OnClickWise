"use client";

import { useEffect, useState } from "react";
import { getBoards, Board } from "@/services/boardService";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProjectBoardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getBoards(projectId)
      .then((data) => setBoards(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return <div>Projeto não encontrado.</div>;
  if (loading) return <div>Carregando quadros...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h2>Quadros do Projeto</h2>
      <ul>
        {boards.map((board) => (
          <li key={board.id}>
            <a
              href={`./board-kanban-page?boardId=${board.id}`}
              style={{ color: "#0070f3", textDecoration: "underline", cursor: "pointer" }}
            >
              {board.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
