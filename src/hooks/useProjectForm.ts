
import { useState } from "react";
import { createProject, updateProject, deleteProject, CreateProjectRequest, Project } from "../services/projectService";

export function useProjectForm(initialData?: Partial<Project>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(data: CreateProjectRequest) {
    setLoading(true);
    setError("");
    try {
      const project = await createProject(data);
      return project;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as any).message || "Erro ao criar projeto");
      } else {
        setError("Erro ao criar projeto");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(projectId: string, data: Partial<CreateProjectRequest>) {
    setLoading(true);
    setError("");
    try {
      const project = await updateProject(projectId, data);
      return project;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as any).message || "Erro ao atualizar projeto");
      } else {
        setError("Erro ao atualizar projeto");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(projectId: string) {
    setLoading(true);
    setError("");
    try {
      await deleteProject(projectId);
      return true;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as any).message || "Erro ao excluir projeto");
      } else {
        setError("Erro ao excluir projeto");
      }
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, handleCreate, handleUpdate, handleDelete };
}
