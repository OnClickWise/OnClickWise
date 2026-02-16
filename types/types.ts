/* =====================================================
   GENERIC API RESPONSE
===================================================== */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/* =====================================================
   WHATSAPP DOMAIN TYPES
   (alinhado com backend)
===================================================== */

export interface WhatsAppAccount {
  id: string;
  organization_id: string;

  phone_number_id: string;
  display_phone_number?: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  organization_id: string;

  whatsapp_contact_id: string;
  phone_number: string;
  name?: string;

  last_message?: string;
  unread_count: number;

  lead_id?: string;

  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  organization_id: string;

  whatsapp_contact_id: string;
  whatsapp_message_id: string;

  direction: 'inbound' | 'outbound';
  message_type:
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'document'
    | 'template';

  content?: string;
  media_url?: string;

  lead_id?: string;

  created_at: string;
}
