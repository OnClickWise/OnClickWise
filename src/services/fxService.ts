import { getAuthToken } from '@/lib/cookies';
import { getApiBaseUrl } from '@/lib/api-url';

/**
 * Service unificado da Fase 2:
 *  - Exchange Rates (câmbios)
 *  - Payment Allocations (liquidações)
 *  - Bank Reconciliation (reconciliação bancária)
 */

export type FxSource = 'manual' | 'api_brapi' | 'api_openexchange' | 'imported';

export interface ExchangeRate {
  id: string;
  organization_id: string;
  from_currency: string;
  to_currency: string;
  rate_date: string;
  rate: string | number;
  source: FxSource;
  created_at: string;
}

export interface CreateExchangeRateDTO {
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  source?: FxSource;
}

export interface ConvertResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateSource: 'direct' | 'older' | 'inverse';
  rateDate: string;
  convertedAmount: number;
}

export type AllocationKind = 'receivable' | 'payable';

export interface PaymentAllocation {
  id: string;
  payment_kind: AllocationKind;
  payment_id: string;
  invoice_kind: AllocationKind;
  invoice_id: string;
  amount: string | number;
  payment_currency: string | null;
  invoice_currency: string | null;
  exchange_rate: string | number | null;
  notes: string | null;
  created_at: string;
}

export interface AllocateDTO {
  paymentKind: AllocationKind;
  paymentId: string;
  allocations: Array<{
    invoiceKind: AllocationKind;
    invoiceId: string;
    amount: number;
    notes?: string;
  }>;
}

export interface BankStatementLine {
  id: string;
  transaction_date: string;
  amount: string | number;
  transaction_type: string;
  description: string;
  reference: string | null;
  is_reconciled: boolean;
  matched_transaction_id: string | null;
  reconciliation_status?: 'matched' | 'pending' | 'discrepancy' | 'unmatched' | null;
  reconciliation_variance?: string | number | null;
  reconciliation_notes?: string | null;
}

export interface BankStatement {
  id: string;
  bank_account_id: string;
  bank_name?: string;
  bank_code?: string;
  account_number?: string;
  start_date: string;
  end_date: string;
  statement_date: string;
  opening_balance: string | number;
  closing_balance: string | number;
  status: 'draft' | 'uploaded' | 'reconciled' | 'approved';
  lines_total?: number;
  lines_reconciled?: number;
  created_at: string;
}

export interface ImportStatementDTO {
  bankAccountId: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  sourceType: 'csv' | 'ofx' | 'manual';
  sourceFilename?: string;
  lines: Array<{
    transactionDate: string;
    amount: number;
    transactionType: string;
    description: string;
    reference?: string;
  }>;
}

export interface MatchSuggestion {
  statementLineId: string;
  candidateTransactionId: string | null;
  candidateDescription: string | null;
  candidateAmount: number | null;
  candidateDate: string | null;
  matchType: 'exact' | 'amount_only' | 'none';
}

export interface ReconcileDecision {
  statementLineId: string;
  matchedTransactionId?: string;
  matchStatus: 'matched' | 'pending' | 'discrepancy' | 'unmatched';
  varianceAmount?: number;
  notes?: string;
}

/* ─── HTTP helpers ───────────────────────────────────────────────────── */

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function authHeadersJson(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    let msg = fallback;
    try {
      const body = (await res.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(body.message)) msg = body.message.join('; ');
      else if (body.message) msg = body.message;
      else if (body.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

const base = () => getApiBaseUrl();

/* ─── Exchange Rates ─────────────────────────────────────────────────── */

export const exchangeRatesService = {
  list(
    filters?: {
      fromCurrency?: string;
      toCurrency?: string;
      from?: string;
      to?: string;
      limit?: number;
    },
    signal?: AbortSignal,
  ): Promise<ExchangeRate[]> {
    const p = new URLSearchParams();
    if (filters?.fromCurrency) p.set('fromCurrency', filters.fromCurrency);
    if (filters?.toCurrency) p.set('toCurrency', filters.toCurrency);
    if (filters?.from) p.set('from', filters.from);
    if (filters?.to) p.set('to', filters.to);
    if (filters?.limit) p.set('limit', String(filters.limit));
    return fetch(`${base()}/finance/exchange-rates${p.toString() ? `?${p}` : ''}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar câmbios'));
  },
  create(data: CreateExchangeRateDTO): Promise<ExchangeRate> {
    return fetch(`${base()}/finance/exchange-rates`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao criar câmbio'));
  },
  remove(id: string): Promise<{ success: boolean }> {
    return fetch(`${base()}/finance/exchange-rates/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro ao remover câmbio'));
  },
  convert(amount: number, from: string, to: string, date: string): Promise<ConvertResult> {
    const p = new URLSearchParams({
      amount: String(amount),
      from,
      to,
      date,
    });
    return fetch(`${base()}/finance/exchange-rates/convert?${p}`, {
      method: 'GET',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro na conversão'));
  },
};

/* ─── Allocations ────────────────────────────────────────────────────── */

export const allocationsService = {
  allocate(data: AllocateDTO): Promise<{
    success: boolean;
    paymentId: string;
    allocations: number;
    totalAllocated: number;
    unallocated: number;
  }> {
    return fetch(`${base()}/finance/allocations`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao alocar pagamento'));
  },
  listForPayment(
    paymentKind: AllocationKind,
    paymentId: string,
    signal?: AbortSignal,
  ): Promise<PaymentAllocation[]> {
    const p = new URLSearchParams({ paymentKind, paymentId });
    return fetch(`${base()}/finance/allocations?${p}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar alocações'));
  },
  listForInvoice(
    invoiceKind: AllocationKind,
    invoiceId: string,
    signal?: AbortSignal,
  ): Promise<PaymentAllocation[]> {
    const p = new URLSearchParams({ invoiceKind, invoiceId });
    return fetch(`${base()}/finance/allocations?${p}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar alocações'));
  },
  remove(id: string): Promise<{ success: boolean }> {
    return fetch(`${base()}/finance/allocations/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro ao remover alocação'));
  },
};

/* ─── Bank Reconciliation ────────────────────────────────────────────── */

export const reconciliationService = {
  importStatement(data: ImportStatementDTO): Promise<{
    importId: string;
    statementId: string;
    bankAccountId: string;
    linesImported: number;
  }> {
    return fetch(`${base()}/finance/reconciliation/import`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao importar extrato'));
  },
  listStatements(
    filters?: { bankAccountId?: string; status?: string },
    signal?: AbortSignal,
  ): Promise<BankStatement[]> {
    const p = new URLSearchParams();
    if (filters?.bankAccountId) p.set('bankAccountId', filters.bankAccountId);
    if (filters?.status) p.set('status', filters.status);
    return fetch(`${base()}/finance/reconciliation/statements${p.toString() ? `?${p}` : ''}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar extratos'));
  },
  getStatement(
    id: string,
    signal?: AbortSignal,
  ): Promise<{ statement: BankStatement; lines: BankStatementLine[] }> {
    return fetch(`${base()}/finance/reconciliation/statements/${id}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao obter extrato'));
  },
  deleteStatement(id: string): Promise<{ success: boolean }> {
    return fetch(`${base()}/finance/reconciliation/statements/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro ao remover extrato'));
  },
  suggestMatches(statementId: string, signal?: AbortSignal): Promise<MatchSuggestion[]> {
    return fetch(`${base()}/finance/reconciliation/statements/${statementId}/suggestions`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao sugerir matches'));
  },
  reconcile(
    statementId: string,
    decisions: ReconcileDecision[],
  ): Promise<{ success: boolean; decisions: number; matched: number; allDone: boolean }> {
    return fetch(`${base()}/finance/reconciliation/statements/${statementId}/reconcile`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify({ decisions }),
    }).then((r) => handle(r, 'Erro ao reconciliar'));
  },
};
