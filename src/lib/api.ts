const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Lead {
  id: string;
  organization_id: string;
  assigned_user_id?: string;
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
  show_on_pipeline: boolean;
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
  status?: string;
  value?: number;
  description?: string;
  estimated_close_date?: string;
  assigned_user_id?: string;
  show_on_pipeline?: boolean;
}

export interface UpdateLeadRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  ssn?: string;
  ein?: string;
  source?: string;
  status?: string;
  value?: number;
  description?: string;
  estimated_close_date?: string;
  assigned_user_id?: string;
  show_on_pipeline?: boolean;
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
    if (!token) {
      console.log('No auth token found');
      return null;
    }
    
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
      console.log('Making API request to:', fullUrl);
      console.log('Request config:', config);
      
      const response = await fetch(fullUrl, config);
      
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

      const data = await response.json();
      console.log('API response:', data);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Leads API methods
  async getLeads(params?: {
    search?: string;
    status?: string;
    source?: string;
    assigned_user_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ leads: Lead[] }>> {
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

    const endpoint = `/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async getLeadById(id: string): Promise<ApiResponse<{ lead: Lead }>> {
    return this.request<{ lead: Lead }>(`/leads/${id}`);
  }

  async createLead(leadData: CreateLeadRequest): Promise<ApiResponse<{ lead: Lead }>> {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    return this.request<{ lead: Lead }>('/leads', {
      method: 'POST',
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

    return this.request<{ lead: Lead }>('/leads', {
      method: 'PUT',
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

    return this.request<{ message: string }>('/leads', {
      method: 'DELETE',
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

    return this.request<{ leads: Lead[]; leadsByStatus?: Record<string, Lead[]> }>('/leads/status');
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
    value_min?: number;
    value_max?: number;
    date_min?: string;
    date_max?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    show_on_pipeline?: boolean;
  } = {}): Promise<ApiResponse<{ leads: Lead[] }>> {
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
        const url = queryString ? `/leads/search?${queryString}` : '/leads/search';
        
        console.log('API: Final URL:', url);
        console.log('API: Query params:', Object.fromEntries(queryParams.entries()));

        return this.request<{ leads: Lead[] }>(url);
  }

  // Métodos específicos para busca por campo
  async searchLeadsByName(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/name?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByEmail(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/email?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByPhone(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/phone?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsBySSN(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/ssn?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByEIN(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/ein?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsBySource(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/source?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByStatus(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/status?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByValueMin(query: number): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/value-min?q=${query}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByValueMax(query: number): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/value-max?q=${query}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByDateMin(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/date-min?q=${encodeURIComponent(query)}`;
    return this.request<{ leads: Lead[] }>(endpoint);
  }

  async searchLeadsByDateMax(query: string): Promise<ApiResponse<{ leads: Lead[] }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const endpoint = `/leads/search/date-max?q=${encodeURIComponent(query)}`;
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

    const endpoint = `/leads/all`;
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

    return this.request<{ message: string }>('/leads/bulk-pipeline', {
      method: 'POST',
      body: JSON.stringify({
        lead_ids: leadIds,
        show_on_pipeline: showOnPipeline
      }),
    });
  }
}

export const apiService = new ApiService();
