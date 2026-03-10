import { useProjectForm } from "@/hooks/useProjectForm";
import { ProjectForm } from "@/components/ProjectForm";
import { useRouter } from "next/navigation";

export default function ProjectCreatePage() {
  const { loading, error, handleCreate } = useProjectForm();
  const router = useRouter();

  async function onSubmit(data: { name: string; description?: string }) {
    const project = await handleCreate(data);
    if (project) router.push(`/projects/${project.id}`);
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Criar Projeto</h2>
      <ProjectForm onSubmit={onSubmit} loading={loading} onDelete={undefined} />
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
