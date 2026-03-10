"use client";

import { useBoardForm } from "@/hooks/useBoardForm";
import { BoardForm } from "@/components/BoardForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBoards } from "@/services/boardService";


export default function BoardEditPage() {
  const { boardId } = useParams();
  const { loading, error, handleUpdate, handleDelete } = useBoardForm();
  const [initialData, setInitialData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchBoard() {
      if (!boardId) return;
      // Supondo que boardId é string, buscar todos e filtrar
      const boards = await getBoards("");
      const board = boards.find((b: any) => b.id === boardId);
      setInitialData(board);
    }
    fetchBoard();
  }, [boardId]);


  async function onSubmit(data: { title: string; description?: string }) {
    if (typeof boardId === 'string') {
      await handleUpdate(boardId, data);
      router.refresh();
    }
  }


  async function onDelete() {
    if (typeof boardId === 'string') {
      await handleDelete(boardId);
      router.push("/boards");
    }
  }

  if (!initialData) return <div>Carregando...</div>;

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Editar Quadro</h2>
      <BoardForm initialData={initialData} onSubmit={onSubmit} onDelete={onDelete} loading={loading} />
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
