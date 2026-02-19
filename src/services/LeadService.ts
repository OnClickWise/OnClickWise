const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

import {
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/cookies";
// Export the API base URL for use in other components
export const getApiBaseUrl = () => API_BASE_URL;

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  assigned_user_id?: string;
  created_by?: string;
  name: string;
  email: string;
  phone?: string;
  ssn?: string;
  ein?: string;
  source?: string;
  status: string;
  value?: number;
  description?: string;
  estimated_close_date?: string;
  location?: string;
  interest?: string;
  show_on_pipeline: boolean;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  ssn?: string;
  ein?: string;
  source?: string;
  location?: string;
  interest?: string;
  status?: string;
  value?: number;
  description?: string;
  estimated_close_date?: string;
  assigned_user_id?: string;
  show_on_pipeline?: boolean;
  attachments?: Attachment[];
}

export interface UpdateLeadRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  ssn?: string;
  ein?: string;
  source?: string;
  location?: string;
  interest?: string;
  status?: string;
  value?: number;
  description?: string;
  estimated_close_date?: string;
  assigned_user_id?: string;
  show_on_pipeline?: boolean;
  attachments?: Attachment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  

  private getAuthToken(): string | null {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Buscar token do localStorage
    const token = localStorage.getItem('token');
    /*
    if (!token) {
      console.log('No auth token found');
      return null;
    }
    */
    
    // Validar formato do JWT antes de usar
    /*
    if (!this.isValidJWT(token)) {
      console.error('Invalid or malformed JWT token detected, clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('organization');
      localStorage.removeItem('lastActivity');
      // Redirecionar para login
      if (typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        const orgSlug = pathParts[1];
        if (orgSlug && orgSlug !== 'login' && orgSlug !== 'register') {
          window.location.href = `/${orgSlug}/login`;
        } else {
          window.location.href = '/login';
        }
      }
      
      return null;
    }
    */
    
    console.log('Using token from localStorage');
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
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
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(fullUrl, config);
      
      // Check if response is HTML (API not running)
      const contentType = response.headers.get('content-type');
      console.log(response)
      if (contentType && contentType.includes('text/html')) {
        console.log('API not available, returning fallback response');
        return {
          success: false,
          error: 'API not available'
        };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a duplicate error or lead not found - don't log as error
        const isDuplicateError = errorText.toLowerCase().includes('duplicado') || 
                                errorText.toLowerCase().includes('duplicate');
        const isLeadNotFoundError = errorText.toLowerCase().includes('não encontrado') || 
                                   errorText.toLowerCase().includes('not found') ||
                                   errorText.toLowerCase().includes('não pertence');
        
        if (isDuplicateError) {
          console.log('Lead duplicate detected (expected behavior):', errorText);
        } else if (isLeadNotFoundError) {
          console.log('Lead not found (expected during rollback):', errorText);
        } else {
          console.error('API Error:', response.status, errorText);
        }
        
        // Se for erro de autenticação, limpar token
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('organization');
          localStorage.removeItem('lastActivity');
          // Redirecionar para login da organização específica se estivermos no cliente
          if (typeof window !== 'undefined') {
            // Extrair o slug da organização da URL atual
            const pathParts = window.location.pathname.split('/');
            const orgSlug = pathParts[1]; // Primeira parte após a barra
            if (orgSlug && orgSlug !== 'login' && orgSlug !== 'register') {
              window.location.href = `/${orgSlug}/login`;
            } else {
              window.location.href = '/login';
            }
          }
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      // Check if response has content before trying to parse JSON
      const contentLength = response.headers.get('content-length');
      
      // If no content-type or content-length is 0, or status is 204 (No Content), return success without data
      // Note: contentType is already declared at line 193
      if (response.status === 204 || contentLength === '0' || !contentType || !contentType.includes('application/json')) {
        console.log('API response: No content (success)');
        return {
          success: true,
          data: undefined
        };
      }
      
      // Check if the response body is empty
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.log('API response: Empty body (success)');
        return {
          success: true,
          data: undefined
        };
      }
      
      // Try to parse JSON
      try {
        const data = JSON.parse(text);
        return {
          success: true,
          data: data
        };
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        console.error('Response text:', text);
        return {
          success: false,
          error: `Failed to parse response: ${text}`
        };
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Users/Employees API methods
  async getOrganizationUsers(includeMaster: boolean = false) {
    const url = includeMaster ? '/auth/employees?include_master=true' : '/auth/employees';
    return this.request<{ success: boolean; employees: Array<{id: string, name: string, email: string, role: string}> }>(url, {
      method: 'GET'
    });
  }

  // Leads API methods
  async getLeads(params?: {
    search?: string;
    status?: string;
    source?: string;
    assigned_user_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ leads: Lead[]; total?: number }>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.assigned_user_id) queryParams.append('assigned_user_id', params.assigned_user_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ leads: Lead[]; total?: number }>(endpoint);
  }

  async getLeadById(id: string): Promise<ApiResponse<{ lead: Lead }>> {
    return this.request<{ lead: Lead }>(`api/leads/${id}`);
  }

  async createLead(leadData: CreateLeadRequest): Promise<ApiResponse<{ lead: Lead }>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }
    const token = getAccessTokenFromCookie();
    return this.request<{ lead: Lead }>('/api/leads', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(leadData: UpdateLeadRequest): Promise<ApiResponse<{ lead: Lead }>> {
    // Verificar se estamos no cliente
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }
    const token = getAccessTokenFromCookie();
    return this.request<{ lead: Lead }>('/api/leads', {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(leadData),
    });

  }

  async deleteLead(id: string): Promise<ApiResponse<{ message: string }>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }
     const token = getAccessTokenFromCookie();
    return this.request<{ message: string }>('/api/leads', {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
  }

  async getLeadsByStatus(): Promise<ApiResponse<{ leads: Lead[]; leadsByStatus?: Record<string, Lead[]> }>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    return this.request<{ leads: Lead[]; leadsByStatus?: Record<string, Lead[]> }>('/api/leads/status');
  }

  async searchLeads(params: {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    ssn?: string;
    ein?: string;
    status?: string;
    source?: string;
    location?: string;
    interest?: string;
    assigned_user_id?: string;
    value_min?: number;
    value_max?: number;
    date_min?: string;
    date_max?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    show_on_pipeline?: boolean;
  } = {}): Promise<ApiResponse<{ leads: Lead[]; total?: number }>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.name) queryParams.append('name', params.name);
    if (params.email) queryParams.append('email', params.email);
    if (params.phone) queryParams.append('phone', params.phone);
    if (params.ssn) queryParams.append('ssn', params.ssn);
    if (params.ein) queryParams.append('ein', params.ein);
    if (params.status) queryParams.append('status', params.status);
    if (params.source) queryParams.append('source', params.source);
    if (params.location) queryParams.append('location', params.location);
    if (params.interest) queryParams.append('interest', params.interest);
    if (params.assigned_user_id !== undefined) queryParams.append('assigned_user_id', params.assigned_user_id);
    if (params.value_min !== undefined) queryParams.append('value_min', params.value_min.toString());
    if (params.value_max !== undefined) queryParams.append('value_max', params.value_max.toString());
    if (params.date_min) queryParams.append('date_min', params.date_min);
    if (params.date_max) queryParams.append('date_max', params.date_max);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.show_on_pipeline !== undefined) queryParams.append('show_on_pipeline', params.show_on_pipeline.toString());

        const queryString = queryParams.toString();
        const url = queryString ? `/api/leads/search?${queryString}` : '/api/leads/search';
        
        console.log('API: Final URL:', url);
        console.log('API: Query params:', Object.fromEntries(queryParams.entries()));

        return this.request<{ leads: Lead[]; total?: number }>(url);
  }

  // Métodos específicos para busca por campo
  async searchLeadsByName(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/?name=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByEmail(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/email?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByPhone(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/phone?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsBySSN(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/ssn?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByEIN(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/ein?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsBySource(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/source?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByStatus(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/status?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByValueMin(query: number): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/value-min?q=${query}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByValueMax(query: number): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/value-max?q=${query}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByDateMin(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/date-min?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByDateMax(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search/date-max?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }


  // Buscar todos os leads do banco (para seleção completa)
  async getAllLeads(): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/api/leads/search`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  // Atualização em massa para pipeline
  async bulkUpdatePipeline(leadIds: string[], showOnPipeline: boolean): Promise<ApiResponse<{ message: string }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    return this.request<{ message: string }>('/api/leads/bulk-pipeline', {
      method: 'POST',
      body: JSON.stringify({
        lead_ids: leadIds,
        show_on_pipeline: showOnPipeline
      }),
    });
  }

  // Upload attachment to lead
  async uploadAttachment(leadId: string, file: File): Promise<ApiResponse<{ lead: Lead }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const token = getAccessTokenFromCookie();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}` ,
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  }

  // Delete attachment from lead
  async deleteAttachment(leadId: string, attachmentId: string): Promise<ApiResponse<{ lead: Lead }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const data = await response.json();
    return data;
  }

  // Get attachment file data
  async getAttachment(leadId: string, attachmentId: string): Promise<{ success: boolean; data?: Blob; error?: string }> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/attachments/${attachmentId}`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.arrayBuffer();
    return {
      success: true,
      data: new Blob([data])
    };
  }

  // Attachment methods
  async uploadLeadAttachment(leadId: string, file: File): Promise<ApiResponse<{ attachment: Attachment }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const fullUrl = `${API_BASE_URL}/api/leads/${leadId}/attachments`;
      console.log('Uploading attachment to:', fullUrl);
      
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload Error:', response.status, errorText);
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('organization');
          localStorage.removeItem('lastActivity');
          if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/');
            const orgSlug = pathParts[1];
            if (orgSlug && orgSlug !== 'login' && orgSlug !== 'register') {
              window.location.href = `/${orgSlug}/login`;
            } else {
              window.location.href = '/login';
            }
          }
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      console.log('Upload response:', data);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Upload request failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async deleteLeadAttachment(leadId: string, attachmentId: string): Promise<ApiResponse<{ message: string }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    return this.request<{ message: string }>(`/api/leads/${leadId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  async getLeadAttachment(leadId: string, attachmentId: string): Promise<Blob | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = this.getAuthToken();
    
    const config: RequestInit = {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    try {
      const fullUrl = `${API_BASE_URL}/api/leads/${leadId}/attachments/${attachmentId}`;
      console.log('Downloading attachment from:', fullUrl);
      
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        console.error('Download Error:', response.status);
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('organization');
          localStorage.removeItem('lastActivity');
          if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/');
            const orgSlug = pathParts[1];
            if (orgSlug && orgSlug !== 'login' && orgSlug !== 'register') {
              window.location.href = `/${orgSlug}/login`;
            } else {
              window.location.href = '/login';
            }
          }
        }
        
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.error('Download request failed:', error);
      return null;
    }
  }

}

export const apiService = new ApiService();