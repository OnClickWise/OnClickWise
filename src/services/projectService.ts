import { authenticatedFetch } from "@/services/authService";
import { getApiBaseUrl } from "@/lib/api-url";

const API_BASE_URL = getApiBaseUrl();

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

export interface ProjectAvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

async function handleResponse<T>(res: Response, errorMessage: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const errMsg = `${errorMessage} (${res.status}: ${body || res.statusText})`;
    console.error("[projectService]", errMsg);
    throw new Error(errMsg);
  }
  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  console.log("[projectService] Getting projects list");
  const res = await authenticatedFetch(`${API_BASE_URL}/projects`);
  const data = await handleResponse<any>(res, "Erro ao buscar projetos");
  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function getProjectById(projectId: string): Promise<Project> {
  console.log("[projectService] Getting project by ID:", projectId);
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`);
  return handleResponse<Project>(res, "Erro ao buscar projeto");
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  console.log("[projectService] Creating project:", data);
  const res = await authenticatedFetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse<Project>(res, "Erro ao criar projeto");
}

export async function updateProject(projectId: string, data: Partial<CreateProjectRequest>): Promise<Project> {
  console.log("[projectService] Updating project:", { projectId, data });
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse<Project>(res, "Erro ao atualizar projeto");
}

export async function deleteProject(projectId: string): Promise<void> {
  console.log("[projectService] Deleting project:", projectId);
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const errMsg = `Erro ao excluir projeto (${res.status}: ${body})`;
    console.error("[projectService]", errMsg);
    throw new Error(errMsg);
  }
}

export async function getAvailableProjectUsers(): Promise<ProjectAvailableUser[]> {
  const res = await authenticatedFetch(`${API_BASE_URL}/projects/available-users`);
  const data = await handleResponse<any>(res, "Erro ao buscar usuários disponíveis");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  return [];
}