const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  private isValidJWT(token: string): boolean {
    if (!token) return false;
    
    // JWT deve ter exatamente 3 partes separadas por ponto
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format: token does not have 3 parts');
      return false;
    }
    
    // Verificar se as partes não estão vazias
    if (parts.some(part => !part || part.trim() === '')) {
      console.error('Invalid JWT format: token has empty parts');
      return false;
    }
    
    // Tentar decodificar o payload para verificar se é um JWT válido
    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Verificar se tem as propriedades básicas de um JWT
      if (!payload.exp || !payload.userId || !payload.organizationId) {
        console.error('Invalid JWT: missing required claims');
        return false;
      }
      
      // Verificar se o token não está expirado
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.error('JWT token has expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid JWT format: cannot decode payload', error);
      return false;
    }
  }

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
    
    // Validar formato do JWT antes de usar
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
      
      // Check if response is HTML (API not running)
      const contentType = response.headers.get('content-type');
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
        console.log('API response:', data);
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

    const endpoint = `/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ leads: Lead[]; total?: number }>(endpoint);
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
        const url = queryString ? `/leads/search?${queryString}` : '/leads/search';
        
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

  // Upload attachment to lead
  async uploadAttachment(leadId: string, file: File): Promise<ApiResponse<{ lead: Lead }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'API calls only available on client side'
      };
    }

    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/attachments`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
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
  async getAttachment(leadId: string, attachmentId: string): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
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
      data: data
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

  // ==================== TELEGRAM API METHODS ====================

  // Telegram Bot API methods
  async getTelegramBots(): Promise<ApiResponse<{ bots: any[] }>> {
    return this.request<{ bots: any[] }>('/telegram/bots');
  }

  async createTelegramBot(botData: {
    bot_name: string;
    bot_username: string;
    token: string;
    webhook_url?: string;
  }): Promise<ApiResponse<{ bot: any }>> {
    return this.request<{ bot: any }>('/telegram/bots', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  }

  async updateTelegramBot(botId: string, botData: {
    bot_name?: string;
    bot_username?: string;
    token?: string;
    webhook_url?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<{ bot: any }>> {
    return this.request<{ bot: any }>(`/telegram/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(botData),
    });
  }

  async deleteTelegramBot(botId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/telegram/bots/${botId}`, {
      method: 'DELETE',
    });
  }

  // Telegram Account API methods
  async getTelegramAccounts(): Promise<ApiResponse<{ accounts: any[] }>> {
    return this.request<{ accounts: any[] }>('/telegram/accounts');
  }

  async createTelegramAccount(accountData: {
    api_id: string;
    api_hash: string;
    phone_number: string;
  }): Promise<ApiResponse<{ account: any }>> {
    return this.request<{ account: any }>('/telegram/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async updateTelegramAccount(accountId: string, accountData: {
    api_id?: string;
    api_hash?: string;
    phone_number?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<{ account: any }>> {
    return this.request<{ account: any }>(`/telegram/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
  }

  async deleteTelegramAccount(accountId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/telegram/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  async authenticateTelegramAccount(accountId: string): Promise<ApiResponse<{ message: string; requiresSmsCode?: boolean }>> {
    return this.request<{ message: string; requiresSmsCode?: boolean }>(`/telegram/accounts/${accountId}/authenticate`, {
      method: 'POST',
    });
  }

  async verifyTelegramSmsCode(accountId: string, smsCode: string, twoFactorPassword?: string, rememberTwoFactor?: boolean): Promise<ApiResponse<{ message: string; requires2FA?: boolean }>> {
    return this.request<{ message: string; requires2FA?: boolean }>(`/telegram/accounts/${accountId}/verify-sms`, {
      method: 'POST',
      body: JSON.stringify({ smsCode, twoFactorPassword, rememberTwoFactor }),
    });
  }

  async verifyTelegram2FA(accountId: string, twoFactorPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/telegram/accounts/${accountId}/verify-2fa`, {
      method: 'POST',
      body: JSON.stringify({ twoFactorPassword }),
    });
  }

  async testTelegramAccountConnection(accountId: string): Promise<ApiResponse<{ message: string; account_info?: any }>> {
    return this.request<{ message: string; account_info?: any }>(`/telegram/accounts/${accountId}/test`, {
      method: 'POST',
    });
  }

  async startTelegramAccountChat(accountId: string, identifier: string, firstMessage?: string): Promise<ApiResponse<{ message: string; conversation?: any }>> {
    return this.request<{ message: string; conversation?: any }>(`/telegram/accounts/${accountId}/start-chat`, {
      method: 'POST',
      body: JSON.stringify({ identifier, firstMessage }),
    });
  }

  // Telegram Conversations API methods
  async getTelegramConversations(params?: {
    bot_id?: string;
    account_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ conversations: any[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.bot_id) queryParams.append('bot_id', params.bot_id);
    if (params?.account_id) queryParams.append('account_id', params.account_id);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/telegram/conversations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ conversations: any[]; total: number; page: number; limit: number }>(endpoint);
  }

  async getTelegramConversation(conversationId: string): Promise<ApiResponse<{ conversation: any }>> {
    return this.request<{ conversation: any }>(`/telegram/conversations/${conversationId}`);
  }

  async getTelegramMessages(conversationId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ messages: any[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/telegram/conversations/${conversationId}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ messages: any[]; total: number; page: number; limit: number }>(endpoint);
  }

  async getTelegramUnreadCount(conversationId: string): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.request<{ unreadCount: number }>(`/telegram/conversations/${conversationId}/unread-count`);
  }

  async markTelegramMessagesAsRead(conversationId: string): Promise<ApiResponse<{ message: string; unreadCount: number }>> {
    return this.request<{ message: string; unreadCount: number }>(`/telegram/conversations/${conversationId}/mark-read`, {
      method: 'POST',
    });
  }

  // Telegram Message API methods
  async sendTelegramMessage(messageData: {
    conversation_id: string;
    message_text: string;
    message_type?: 'text' | 'photo' | 'video' | 'document' | 'audio' | 'voice';
    file_id?: string;
    caption?: string;
  }): Promise<ApiResponse<{ message: any }>> {
    return this.request<{ message: any }>('/telegram/send-message', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async sendTelegramFile(file: File, conversationId: string, messageType: string = 'document', caption?: string): Promise<ApiResponse<{ message: any }>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'File upload only available on client side'
      };
    }

    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', conversationId);
    formData.append('message_type', messageType);
    if (caption) {
      formData.append('caption', caption);
    }

    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const fullUrl = `${API_BASE_URL}/telegram/send-file`;
      console.log('Sending file to Telegram:', fullUrl);
      
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send file error:', response.status, errorText);
        
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
      console.log('Send file response:', data);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Send file request failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getTelegramFile(fileId: string): Promise<string> {
    return `${API_BASE_URL}/telegram/files/${fileId}`;
  }

  async getTelegramMessageContent(messageId: string): Promise<ApiResponse<{ message: any; content?: any }>> {
    return this.request<{ message: any; content?: any }>(`/telegram/messages/${messageId}/content`);
  }

  async linkTelegramConversationToLead(conversationId: string, leadId: string): Promise<ApiResponse<{ message: string; lead: any }>> {
    return this.request<{ message: string; lead: any }>(`/telegram/conversations/${conversationId}/link-lead`, {
      method: 'POST',
      body: JSON.stringify({ lead_id: leadId }),
    });
  }
}

export const apiService = new ApiService();
