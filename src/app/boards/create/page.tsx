"use client";

import { useBoardForm } from "@/hooks/useBoardForm";
import { BoardForm } from "@/components/BoardForm";
import { useRouter } from "next/navigation";


export default function BoardCreatePage() {
  const { loading, error, handleCreate } = useBoardForm();
  const router = useRouter();
  // Para exemplo, projectId fixo ou vindo de contexto/rota. Substitua conforme sua lógica.
  const projectId = "default-project-id";

  async function onSubmit(data: { title: string; description?: string }) {
    // Exigir projectId para criar o board
    const board = await handleCreate({ ...data, projectId });
    if (board) router.push(`/boards/${board.id}`);
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Criar Quadro</h2>
      <BoardForm onSubmit={onSubmit} loading={loading} onDelete={undefined} />
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
