const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const getApiBaseUrl = () => API_BASE_URL;

/* ===============================
   TYPES
================================ */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/* ===============================
   WHATSAPP TYPES
================================ */

export interface WhatsAppAccount {
  id: string;
  name: string;
  phone_number: string;
  provider: 'twilio';
  is_active: boolean;
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  contact_phone: string;
  contact_name?: string;
  last_message?: string;
  unread_count: number;
  lead_id?: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  body?: string;
  media_url?: string;
  created_at: string;
}

/* ===============================
   API SERVICE
================================ */

class ApiService {
  /* ===============================
     AUTH
  ================================ */

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /* ===============================
     REQUEST BASE
  ================================ */

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Client-side only' };
    }

    const token = this.getAuthToken();

    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      if (
        response.status === 204 ||
        !contentType ||
        !contentType.includes('application/json')
      ) {
        return { success: true };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unexpected network error',
      };
    }
  }

  /* ===============================
     WHATSAPP – ACCOUNTS
  ================================ */

  async getWhatsAppAccounts() {
    return this.request<{ accounts: WhatsAppAccount[] }>(
      '/whatsapp/accounts'
    );
  }

  async createWhatsAppAccount(data: {
    name: string;
    phone_number: string;
  }) {
    return this.request<{ account: WhatsAppAccount }>(
      '/whatsapp/accounts',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /* ===============================
     WHATSAPP – MESSAGES
  ================================ */

  async sendWhatsAppMessage(data: {
    account_id: string;
    to: string;
    message: string;
  }) {
    return this.request<{ message: WhatsAppMessage }>(
      '/whatsapp/messages',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /* ===============================
     WHATSAPP – CONVERSATIONS
  ================================ */

  async getWhatsAppConversations(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    return this.request<{
      conversations: WhatsAppConversation[];
      total: number;
    }>(`/whatsapp/conversations${qs ? `?${qs}` : ''}`);
  }

  async getWhatsAppMessages(
    conversationId: string,
    params?: { page?: number; limit?: number }
  ) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString();

    return this.request<{
      messages: WhatsAppMessage[];
      total: number;
    }>(
      `/whatsapp/conversations/${conversationId}/messages${
        qs ? `?${qs}` : ''
      }`
    );
  }

  async markWhatsAppMessagesAsRead(conversationId: string) {
    return this.request<{ unreadCount: number }>(
      `/whatsapp/conversations/${conversationId}/mark-read`,
      { method: 'POST' }
    );
  }

  async linkWhatsAppConversationToLead(
    conversationId: string,
    leadId: string
  ) {
    return this.request<{ message: string }>(
      `/whatsapp/conversations/${conversationId}/link-lead`,
      {
        method: 'POST',
        body: JSON.stringify({ lead_id: leadId }),
      }
    );
  }
}

export const apiService = new ApiService();
