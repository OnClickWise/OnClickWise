import { authenticatedFetch } from "@/services/authService";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

async function handleResponse<T>(res: Response, errorMessage: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${errorMessage} (${res.status}: ${body || res.statusText})`);
  }
  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects`);
  const data = await handleResponse<any>(res, "Erro ao buscar projetos");
  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function getProjectById(projectId: string): Promise<Project> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`);
  return handleResponse<Project>(res, "Erro ao buscar projeto");
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse<Project>(res, "Erro ao criar projeto");
}

export async function updateProject(projectId: string, data: Partial<CreateProjectRequest>): Promise<Project> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse<Project>(res, "Erro ao atualizar projeto");
}

export async function deleteProject(projectId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Erro ao excluir projeto (${res.status}: ${body})`);
  }
}