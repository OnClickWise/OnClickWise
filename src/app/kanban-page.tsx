"use client";

import { useEffect, useState } from "react";
import { getProjects, Project } from "@/services/projectService";
import { useAuth } from "@/hooks/useAuth";


export default function KanbanHome() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!isAuthenticated) return;
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);


  if (!isAuthenticated) {
    return <div>Faça login para acessar seus projetos Kanban.</div>;
  }

  if (loading) return <div>Carregando projetos...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Meus Projetos Kanban</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <a
              href={`./project-boards-page?projectId=${project.id}`}
              style={{ color: "#0070f3", textDecoration: "underline", cursor: "pointer" }}
            >
              {project.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
