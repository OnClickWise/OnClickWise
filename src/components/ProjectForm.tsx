
import { useState } from "react";
import { Project } from "../services/projectService";

interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (data: { name: string; description?: string }) => void;
  onDelete?: () => void;
  loading?: boolean;
}

export function ProjectForm({ initialData = {}, onSubmit, onDelete, loading }: ProjectFormProps) {
  const [name, setName] = useState(initialData.name ?? "");
  const [description, setDescription] = useState(initialData.description ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ name, description });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        className="border rounded px-2 py-1"
        placeholder="Nome do projeto"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <textarea
        className="border rounded px-2 py-1"
        placeholder="Descrição"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>
          {initialData.id ? "Salvar" : "Criar"}
        </button>
        {initialData.id && onDelete && (
          <button type="button" className="bg-red-500 text-white px-4 py-1 rounded" onClick={onDelete} disabled={loading}>
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
