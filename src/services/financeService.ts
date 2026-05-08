import { getAuthToken } from '@/lib/cookies';
import { getApiBaseUrl } from '@/lib/api-url';
import {
  Receivable,
  Payable,
  JournalEntry,
  ChartOfAccount,
  CreateReceivableDTO,
  RecordPaymentDTO,
  CreatePayableDTO,
  CreateJournalEntryDTO,
} from '@/types/types';

export const financeService = {
  // ===== RECEIVABLES =====

  async createReceivable(data: CreateReceivableDTO): Promise<Receivable> {
    const payload = {
      customerId: data.customer_id,
      customerName: data.customer_name,
      originalAmount: data.original_amount,
      dueDate: data.due_date,
      description: data.description,
      referenceNumber: data.reference_number,
      referenceType: data.reference_type,
      referenceId: data.reference_id,
    };
    const response = await fetch(`${getApiBaseUrl()}/finance/accounts-receivable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar Contas a Receber');
    }
    return response.json();
  },

  async listReceivables(limit = 100): Promise<Receivable[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-receivable?limit=${limit}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao listar Contas a Receber');
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async listReceivablesByStatus(status: string, limit = 100): Promise<Receivable[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-receivable/status/${status}?limit=${limit}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error(`Erro ao listar Receivables com status ${status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async getReceivable(id: string): Promise<Receivable> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-receivable/${id}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao obter Contas a Receber');
    return response.json();
  },

  async recordReceivablePayment(receivableId: string, payment: RecordPaymentDTO) {
    const payload = {
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      paymentReference: payment.payment_reference,
      notes: payment.notes,
    };
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-receivable/${receivableId}/payments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao registrar pagamento');
    }
    return response.json();
  },

  async deleteReceivable(id: string): Promise<void> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-receivable/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar Contas a Receber');
    }
  },

  // ===== PAYABLES =====

  async createPayable(data: CreatePayableDTO): Promise<Payable> {
    const payload = {
      supplierId: data.supplier_id,
      supplierName: data.supplier_name,
      originalAmount: data.original_amount,
      dueDate: data.due_date,
      description: data.description,
      allowsPartialPayment: data.allows_partial_payment,
      referenceNumber: data.reference_number,
      referenceType: data.reference_type,
      referenceId: data.reference_id,
    };
    const response = await fetch(`${getApiBaseUrl()}/finance/accounts-payable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar Contas a Pagar');
    }
    return response.json();
  },

  async listPayables(limit = 100): Promise<Payable[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-payable?limit=${limit}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao listar Contas a Pagar');
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async listPayablesByStatus(status: string, limit = 100): Promise<Payable[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-payable/status/${status}?limit=${limit}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error(`Erro ao listar Payables com status ${status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async getPayable(id: string): Promise<Payable> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-payable/${id}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao obter Contas a Pagar');
    return response.json();
  },

  async recordPayablePayment(payableId: string, payment: RecordPaymentDTO) {
    const payload = {
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      paymentReference: payment.payment_reference,
      notes: payment.notes,
    };
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-payable/${payableId}/payments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao registrar pagamento');
    }
    return response.json();
  },

  async deletePayable(id: string): Promise<void> {
    const response = await fetch(
      `${getApiBaseUrl()}/finance/accounts-payable/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar Contas a Pagar');
    }
  },

  // ===== JOURNAL ENTRIES =====

  async createJournalEntry(data: CreateJournalEntryDTO): Promise<JournalEntry> {
    const response = await fetch(`${getApiBaseUrl()}/accounting/journal-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar Lançamento Contábil');
    }
    return response.json();
  },

  async listJournalEntries(limit = 100): Promise<JournalEntry[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/accounting/journal-entries?limit=${limit}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao listar Lançamentos Contábeis');
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async getJournalEntry(id: string): Promise<JournalEntry> {
    const response = await fetch(
      `${getApiBaseUrl()}/accounting/journal-entries/${id}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao obter Lançamento Contábil');
    return response.json();
  },

  // ===== CHART OF ACCOUNTS =====

  async listChartOfAccounts(): Promise<ChartOfAccount[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/accounting/chart-of-accounts`,
      { method: 'GET', headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    if (!response.ok) throw new Error('Erro ao listar Plano de Contas');
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  // ===== UTILITIES =====

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      issued: 'Emitida',
      partial: 'Parcial',
      paid: 'Paga',
      overdue: 'Vencida',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  },

  daysUntilDue(dueDate: string): number {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  },

  isOverdue(dueDate: string, status: string): boolean {
    return this.daysUntilDue(dueDate) < 0 && status !== 'paid';
  },
};
