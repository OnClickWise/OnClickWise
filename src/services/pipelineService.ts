import { getAccessTokenFromCookie } from "@/lib/cookies";
import { getCurrentUser } from "./authService";
import { getApiOrigin } from "@/lib/api-url";

const API_BASE_URL = getApiOrigin();

// Interfaces permanecem as mesmas
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PipelineStage {
  id: string;
  organization_id: string;
  name: string;
  order: number;
  slug: string;
  color?: string;
  translation_key: string;
  status?:string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePipelineStageRequest {
  name: string;
  order?: number;
  slug?: string;
  color?: string;
  stagetype:string;
  description?: string;
}

export interface PipelineKanbanBoardResponse {
  stages: Array<PipelineStage & { leads: any[] }>;
  uncategorizedLeads: any[];
  metrics: {
    totalLeads: number;
    totalValue: number;
    conversionRate: number;
  };
}

class PipelineService {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return getAccessTokenFromCookie() || localStorage.getItem('token');
  }

  /**
   * Helper para obter o ID da organização do usuário logado
   */
  private async getOrgId(): Promise<string | null> {
    const user = await getCurrentUser();
    // Verificando as variações comuns de nome de campo (camelCase ou snake_case)
    return user?.organization_id || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'API calls only available on client side' };
    }

    const token = this.getAuthToken();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || `Error ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET /api/pipeline-stages/:organizationId
  async getStages(): Promise<ApiResponse<PipelineStage[]>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };
    
    return this.request<PipelineStage[]>(`/api/pipeline-stages/${orgId}`);
  }

  // GET /api/pipeline-stages/:organizationId/:id
  async getStageById(id: string): Promise<ApiResponse<PipelineStage>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };

    return this.request<PipelineStage>(`/api/pipeline-stages/${orgId}/${id}`);
  }

  // POST /api/pipeline-stages/:organizationId
  async createStage(data: any): Promise<ApiResponse<PipelineStage>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };

    return this.request<PipelineStage>(`/api/pipeline-stages/${orgId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PATCH /api/pipeline-stages/:organizationId/:id
  async updateStage(id: string, data: any): Promise<ApiResponse<PipelineStage>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };

    return this.request<PipelineStage>(`/api/pipeline-stages/${orgId}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE /api/pipeline-stages/:organizationId/:id
  async deleteStage(id: string): Promise<ApiResponse<{ message: string }>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };

    return this.request<{ message: string }>(`/api/pipeline-stages/${orgId}/${id}`, {
      method: 'DELETE',
    });
  }

  // PATCH /api/pipeline-stages/:organizationId/reorder
  async reorderStages(stageIds: string[]): Promise<ApiResponse<{ success: boolean }>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };

    return this.request<{ success: boolean }>(`/api/pipeline-stages/${orgId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ stageIds }),
    });
  }

  // GET /api/pipeline-stages/:organizationId/kanban
  async getKanbanBoard(params?: {
    search?: string;
    assigned_user_id?: string;
    show_on_pipeline?: boolean;
    limit?: number;
  }): Promise<ApiResponse<PipelineKanbanBoardResponse>> {
    const orgId = await this.getOrgId();
    if (!orgId) return { success: false, error: 'No organization linked to user' };

    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.assigned_user_id) query.append('assigned_user_id', params.assigned_user_id);
    if (params?.show_on_pipeline !== undefined) {
      query.append('show_on_pipeline', String(params.show_on_pipeline));
    }
    if (params?.limit) query.append('limit', String(params.limit));

    const endpoint = `/api/pipeline-stages/${orgId}/kanban${query.toString() ? `?${query.toString()}` : ''}`;
    return this.request<PipelineKanbanBoardResponse>(endpoint);
  }
}

export const pipelineService = new PipelineService();