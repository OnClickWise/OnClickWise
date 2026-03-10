import { useProjectForm } from "@/hooks/useProjectForm";
import { ProjectForm } from "@/components/ProjectForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProjects } from "@/services/projectService";


export default function ProjectEditPage() {
  const { projectId } = useParams();
  const { loading, error, handleUpdate, handleDelete } = useProjectForm();
  const [initialData, setInitialData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;
      const projects = await getProjects();
      const project = projects.find((p: any) => p.id === projectId);
      setInitialData(project);
    }
    fetchProject();
  }, [projectId]);


  async function onSubmit(data: { name: string; description?: string }) {
    if (typeof projectId === 'string') {
      await handleUpdate(projectId, data);
      router.refresh();
    }
  }


  async function onDelete() {
    if (typeof projectId === 'string') {
      await handleDelete(projectId);
      router.push("/projects");
    }
  }

  if (!initialData) return <div>Carregando...</div>;

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Editar Projeto</h2>
      <ProjectForm initialData={initialData} onSubmit={onSubmit} onDelete={onDelete} loading={loading} />
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
