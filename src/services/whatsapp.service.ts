import { ApiResponse, getApiBaseUrl } from "@/lib/api";

const API_BASE_URL = getApiBaseUrl();

export interface CreateWhatsAppInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: string;
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  proxyHost?: string;
  proxyPort?: string;
  proxyProtocol?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  webhook?: {
    url?: string;
    byEvents?: boolean;
    base64?: boolean;
    headers?: {
      authorization?: string;
      'Content-Type'?: string;
    };
    events?: string[];
  };
  rabbitmq?: {
    enabled?: boolean;
    events?: string[];
  };
  sqs?: {
    enabled?: boolean;
    events?: string[];
  };
}

export interface CreateWhatsAppInstanceResponse {
  success: boolean;
  instance?: {
    instanceName: string;
    status: string;
    qrcode?: string;
    [key: string]: unknown;
  };
  canConnectWithQr?: boolean;
  qrcode?: string;
  message?: string;
  error?: string;
}

export interface WhatsAppInstanceRecord {
  id?: string;
  organization_id?: string;
  instance_name?: string;
  instanceName?: string;
  status?: string;
  qrcode?: string | null;
  instance_token?: string;
  meta?: {
    instance?: {
      owner?: string;
      profileName?: string;
      profilePicUrl?: string;
    };
    owner?: string;
    profileName?: string;
    profilePicUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CheckOrganizationInstanceResponse {
  success: boolean;
  exists: boolean;
  instance?: WhatsAppInstanceRecord;
  error?: string;
}

export interface ConnectWhatsAppInstanceResponse {
  success: boolean;
  qrcode?: string | {
    base64?: string;
    code?: string;
    pairingCode?: string;
    [key: string]: unknown;
  };
  message?: string;
  error?: string;
}

export interface GetWhatsAppInstanceResponse {
  success: boolean;
  instance?: {
    instanceName: string;
    status: string;
    owner?: string;
    profilePicUrl?: string;
    [key: string]: unknown;
  };
  error?: string;
}

export interface DeleteWhatsAppInstanceResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ConnectionStateResponse {
  success: boolean;
  instance?: {
    instanceName: string;
    state: string;
  };
  error?: string;
}

export interface GetInstanceStatusResponse {
  success: boolean;
  instance?: {
    instanceName?: string;
    instance_name?: string;
    instance?: {
      instanceName?: string;
      state?: string;
      owner?: string;
      profileName?: string;
      profilePicUrl?: string;
      [key: string]: unknown;
    };
    state?: string;
    status?: string;
    owner?: string;
    profileName?: string;
    profilePicUrl?: string;
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * Função helper para fazer requisições HTTP seguindo o padrão do apiService
 */
async function makeRequest<T>(
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

  // Buscar token do localStorage
  const token = localStorage.getItem('token');
  
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
    console.log('WhatsAppService: Making API request to:', fullUrl);
    
    const response = await fetch(fullUrl, config);
    
    // Check if response is HTML (API not running)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.log('WhatsAppService: API not available');
      return {
        success: false,
        error: 'API not available'
      };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WhatsAppService: API Error:', response.status, errorText);
      
      // Se for erro de autenticação, limpar token
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
    console.log('WhatsAppService: API response:', data);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('WhatsAppService: API request failed:', error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const whatsappService = {
  /**
   * Verifica se a organização atual já possui uma instância WhatsApp
   */
  async checkOrganizationInstance(): Promise<ApiResponse<CheckOrganizationInstanceResponse>> {
    return makeRequest<CheckOrganizationInstanceResponse>('/whatsapp/instance');
  },

  /**
   * Cria uma nova instância do WhatsApp
   * Seguindo o padrão do createInstance do backend
   */
  async createWhatsAppInstance(
    data: CreateWhatsAppInstanceRequest
  ): Promise<ApiResponse<CreateWhatsAppInstanceResponse>> {
    return makeRequest<CreateWhatsAppInstanceResponse>('/whatsapp/instance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Conecta uma instância WhatsApp (gera QR Code)
   */
  async connectWhatsAppInstance(instanceName: string): Promise<ApiResponse<ConnectWhatsAppInstanceResponse>> {
    return makeRequest<ConnectWhatsAppInstanceResponse>(`/whatsapp/instance/${instanceName}/connect`);
  },

  /**
   * Regenera QR code de uma instância WhatsApp
   * Rota: POST /whatsapp/instance/{instanceName}/regenerate-qrcode
   */
  async regenerateQRCode(instanceName: string): Promise<ApiResponse<ConnectWhatsAppInstanceResponse>> {
    return makeRequest<ConnectWhatsAppInstanceResponse>(`/whatsapp/instance/${instanceName}/regenerate-qrcode`, {
      method: 'POST',
    });
  },

  /**
   * Busca informações de uma instância WhatsApp
   */
  async getWhatsAppInstance(instanceName: string): Promise<ApiResponse<GetWhatsAppInstanceResponse>> {
    return makeRequest<GetWhatsAppInstanceResponse>(`/whatsapp/instance/${instanceName}`);
  },

  /**
   * Busca o status da instância na Evolution API
   */
  async getInstanceStatus(instanceName: string): Promise<ApiResponse<GetInstanceStatusResponse>> {
    return makeRequest<GetInstanceStatusResponse>(`/whatsapp/instance/status/${instanceName}`);
  },

  /**
   * Busca o estado da conexão de uma instância WhatsApp
   * Rota: /whatsapp/instance/{instanceName}/connectionState
   */
  async getConnectionState(instanceName: string): Promise<ApiResponse<ConnectionStateResponse>> {
    return makeRequest<ConnectionStateResponse>(`/whatsapp/instance/${instanceName}/connectionState`);
  },

  /**
   * Desconecta uma instância WhatsApp
   */
  async logoutWhatsAppInstance(instanceName: string): Promise<ApiResponse<DeleteWhatsAppInstanceResponse>> {
    return makeRequest<DeleteWhatsAppInstanceResponse>(`/whatsapp/instance/${instanceName}/logout`, {
      method: 'DELETE',
    });
  },

  /**
   * Deleta uma instância WhatsApp
   */
  async deleteWhatsAppInstance(instanceName: string): Promise<ApiResponse<DeleteWhatsAppInstanceResponse>> {
    return makeRequest<DeleteWhatsAppInstanceResponse>(`/whatsapp/instance/${instanceName}`, {
      method: 'DELETE',
    });
  },
}