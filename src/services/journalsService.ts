import { getAuthToken } from '@/lib/cookies';
import { getApiBaseUrl } from '@/lib/api-url';
import {
  AccountingJournal,
  AccountingJournalDocument,
  CreateJournalDTO,
  CreateJournalDocumentDTO,
  JournalType,
  UpdateJournalDTO,
  UpdateJournalDocumentDTO,
} from '@/types/types';

/**
 * Serviço para gestão de Diários e Documentos contábeis.
 *
 * Padrão: fetch direto com Bearer token (igual ao financeService.ts).
 * Suporta AbortController em todos os GETs para cancelar requests pendentes.
 * Erros são extraídos do payload da API quando possível (NestJS message field).
 */

/**
 * Headers para requests SEM corpo (GET / DELETE).
 * Não inclui Content-Type: backends estritos rejeitam Content-Type sem body.
 */
function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Headers para requests COM corpo JSON (POST / PATCH / PUT).
 */
function authHeadersJson(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let message = fallbackMessage;
    try {
      const body = (await res.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(body.message)) message = body.message.join('; ');
      else if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch {
      // body não-JSON; mantém fallback
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const journalsService = {
  /* ─── Diários ─────────────────────────────────────────────────────── */

  async list(
    filters?: { isActive?: boolean; journalType?: JournalType; query?: string },
    signal?: AbortSignal,
  ): Promise<AccountingJournal[]> {
    const params = new URLSearchParams();
    if (typeof filters?.isActive === 'boolean') params.set('isActive', String(filters.isActive));
    if (filters?.journalType) params.set('journalType', filters.journalType);
    if (filters?.query?.trim()) params.set('query', filters.query.trim());
    const qs = params.toString();
    const res = await fetch(
      `${getApiBaseUrl()}/accounting/journals${qs ? `?${qs}` : ''}`,
      { method: 'GET', headers: authHeaders(), signal },
    );
    return handleResponse<AccountingJournal[]>(res, 'Erro ao listar diários');
  },

  async getById(id: string, signal?: AbortSignal): Promise<AccountingJournal> {
    const res = await fetch(`${getApiBaseUrl()}/accounting/journals/${id}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    });
    return handleResponse<AccountingJournal>(res, 'Erro ao obter diário');
  },

  async create(data: CreateJournalDTO): Promise<AccountingJournal> {
    const res = await fetch(`${getApiBaseUrl()}/accounting/journals`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handleResponse<AccountingJournal>(res, 'Erro ao criar diário');
  },

  async update(id: string, data: UpdateJournalDTO): Promise<AccountingJournal> {
    const res = await fetch(`${getApiBaseUrl()}/accounting/journals/${id}`, {
      method: 'PATCH',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handleResponse<AccountingJournal>(res, 'Erro ao atualizar diário');
  },

  async remove(id: string): Promise<{ success: boolean; action: 'deleted' | 'inactivated' }> {
    const res = await fetch(`${getApiBaseUrl()}/accounting/journals/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(res, 'Erro ao excluir diário');
  },

  /* ─── Documentos ──────────────────────────────────────────────────── */

  async listDocuments(
    journalId: string,
    signal?: AbortSignal,
  ): Promise<AccountingJournalDocument[]> {
    const res = await fetch(`${getApiBaseUrl()}/accounting/journals/${journalId}/documents`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    });
    return handleResponse<AccountingJournalDocument[]>(res, 'Erro ao listar documentos');
  },

  async createDocument(
    journalId: string,
    data: CreateJournalDocumentDTO,
  ): Promise<AccountingJournalDocument> {
    const res = await fetch(`${getApiBaseUrl()}/accounting/journals/${journalId}/documents`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handleResponse<AccountingJournalDocument>(res, 'Erro ao criar documento');
  },

  async updateDocument(
    journalId: string,
    documentId: string,
    data: UpdateJournalDocumentDTO,
  ): Promise<AccountingJournalDocument> {
    const res = await fetch(
      `${getApiBaseUrl()}/accounting/journals/${journalId}/documents/${documentId}`,
      {
        method: 'PATCH',
        headers: authHeadersJson(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<AccountingJournalDocument>(res, 'Erro ao atualizar documento');
  },

  async removeDocument(
    journalId: string,
    documentId: string,
  ): Promise<{ success: boolean; action: 'deleted' | 'inactivated' }> {
    const res = await fetch(
      `${getApiBaseUrl()}/accounting/journals/${journalId}/documents/${documentId}`,
      { method: 'DELETE', headers: authHeaders() },
    );
    return handleResponse(res, 'Erro ao excluir documento');
  },

  /* ─── Helpers de UI ───────────────────────────────────────────────── */

  journalTypeLabel(type: JournalType): string {
    const labels: Record<JournalType, string> = {
      sales: 'Vendas',
      purchases: 'Compras',
      cash: 'Caixa',
      bank: 'Bancos',
      diverse: 'Diversos',
      opening: 'Abertura',
      regularization: 'Regularização',
      closing: 'Encerramento',
      depreciation: 'Amortização/Depreciação',
      payroll: 'Folha de Pagamento',
      taxes: 'Impostos',
    };
    return labels[type] ?? type;
  },

  numberingModeLabel(mode: 'continuous' | 'monthly'): string {
    return mode === 'continuous' ? 'Contínua (anual)' : 'Mensal';
  },
};
