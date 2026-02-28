// ==================== WHATSAPP TYPES ====================

export interface WhatsAppAccount {
  id: string
  organization_id: string
  account_id: string // phone number (ex: +14155238886)
  name: string
  provider: 'twilio'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateWhatsAppAccountRequest {
  account_id: string
  name: string
}

export interface SendWhatsAppMessageRequest {
  account_id: string
  to: string
  message: string
}

export interface WhatsAppMessage {
  id: string
  organization_id: string
  account_id: string
  from_number?: string
  to_number: string
  message: string
  message_type: string
  direction: 'inbound' | 'outbound'
  status: string
  provider_message_id?: string
  created_at: string
}
