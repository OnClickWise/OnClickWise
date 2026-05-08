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

/* =====================================================
   FINANCE DOMAIN TYPES
   (Contas a Receber, Contas a Pagar, Contabilidade)
===================================================== */

/* --- Chart of Accounts --- */
export interface ChartOfAccount {
  id: string;
  organization_id: string;
  code: string; // Ex: 1.1.1.001
  name: string; // Ex: Caixa
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normal_balance: 'debit' | 'credit';
  parent_id?: string;
  level: number;
  is_active: boolean;
  allows_posting: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

/* --- Accounts Receivable (Contas a Receber) --- */
export type ReceivableStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Receivable {
  id: string;
  organization_id: string;
  customer_id?: string;
  customer_name: string;
  original_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  issue_date?: string;
  due_date: string;
  status: ReceivableStatus;
  description?: string;
  reference_number?: string; // Unique per org
  reference_type?: string; // invoice, contract, etc
  reference_id?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  payments?: ReceivablePayment[];
}

export interface ReceivablePayment {
  id: string;
  receivable_id: string;
  organization_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  payment_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CreateReceivableDTO {
  customer_id?: string;
  customer_name: string;
  original_amount: number;
  due_date: string;
  description?: string;
  reference_number?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface RecordPaymentDTO {
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  payment_reference?: string;
  notes?: string;
}

/* --- Accounts Payable (Contas a Pagar) --- */
export type PayableStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Payable {
  id: string;
  organization_id: string;
  supplier_id?: string;
  supplier_name: string;
  original_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  issue_date?: string;
  due_date: string;
  status: PayableStatus;
  description?: string;
  reference_number?: string; // Unique per org
  allows_partial_payment: boolean;
  reference_type?: string;
  reference_id?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  payments?: PayablePayment[];
}

export interface PayablePayment {
  id: string;
  payable_id: string;
  organization_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  payment_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CreatePayableDTO {
  supplier_id?: string;
  supplier_name: string;
  original_amount: number;
  due_date: string;
  description?: string;
  allows_partial_payment?: boolean;
  reference_number?: string;
  reference_type?: string;
  reference_id?: string;
}

/* --- Diários e Documentos contábeis --- */
export type JournalType =
  | 'sales'
  | 'purchases'
  | 'cash'
  | 'bank'
  | 'diverse'
  | 'opening'
  | 'regularization'
  | 'closing'
  | 'depreciation'
  | 'payroll'
  | 'taxes';

export type NumberingMode = 'continuous' | 'monthly';

export interface AccountingJournal {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  journal_type: JournalType;
  numbering_mode: NumberingMode;
  is_active: boolean;
  sort_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Agregados retornados pela API (LEFT JOIN no service)
  documents_count?: number;
  entries_count?: number;
  documents?: AccountingJournalDocument[];
}

export interface AccountingJournalDocument {
  id: string;
  journal_id: string;
  organization_id: string;
  code: string;
  name: string;
  default_debit_account_id: string | null;
  default_credit_account_id: string | null;
  allows_recapitulative: boolean;
  is_active: boolean;
  sort_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalDTO {
  code: string;
  name: string;
  journalType: JournalType;
  numberingMode?: NumberingMode;
  isActive?: boolean;
  sortOrder?: number;
  description?: string;
}

export type UpdateJournalDTO = Partial<CreateJournalDTO>;

export interface CreateJournalDocumentDTO {
  code: string;
  name: string;
  defaultDebitAccountId?: string;
  defaultCreditAccountId?: string;
  allowsRecapitulative?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  description?: string;
}

export type UpdateJournalDocumentDTO = Partial<CreateJournalDocumentDTO>;

/* --- Journal Entries (Lançamentos Contábeis) --- */
export interface JournalEntry {
  id: string;
  organization_id: string;
  transaction_id?: string;
  status: 'draft' | 'posted';
  entry_date: string;
  description: string;
  reference_type?: string; // receivable, payable, etc
  reference_id?: string;
  posted_by?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  organization_id: string;
  account_id: string;
  account?: ChartOfAccount;
  line_type: 'debit' | 'credit';
  amount: number; // Em centavos
  memo?: string;
  created_by: string;
  created_at: string;
}

export interface CreateJournalEntryDTO {
  description: string;
  entry_date?: string;
  reference_type?: string;
  reference_id?: string;
  lines: {
    account_id: string;
    line_type: 'debit' | 'credit';
    amount: number;
    memo?: string;
  }[];
}
