import { getAuthToken } from '@/lib/cookies';
import { getApiBaseUrl } from '@/lib/api-url';

/**
 * Service Tesouraria — caixas, bancos, movimentos, transferências, extratos.
 * Padrão: fetch direto + Bearer. Content-Type só em requests com body.
 */

export type BankAccountType = 'cash' | 'checking' | 'savings' | 'investment' | 'credit';
export type MovementDirection = 'inflow' | 'outflow';

export interface BankAccount {
  id: string;
  organization_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_type: BankAccountType;
  account_holder: string;
  current_balance: string | number;
  available_balance: string | number;
  is_active: boolean;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankStatementMovement {
  id: string;
  occurred_at: string;
  amount: string | number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  transaction_type: string;
}

export interface BankStatement {
  account: BankAccount;
  movements: BankStatementMovement[];
  meta: { count: number; limitApplied: number };
}

export interface TreasuryOverview {
  byCurrency: Record<string, { accounts: number; totalBalance: number }>;
  byType: Record<string, { accounts: number; totalBalance: number }>;
  raw: Array<{ currency: string; account_type: string; accounts: number; total_balance: number }>;
}

export interface CreateBankAccountDTO {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  accountHolder: string;
  initialBalance?: number;
  currency?: string;
  isActive?: boolean;
  notes?: string;
}

export type UpdateBankAccountDTO = Partial<
  Omit<CreateBankAccountDTO, 'bankCode' | 'accountNumber' | 'initialBalance'>
>;

export interface CreateCashMovementDTO {
  bankAccountId: string;
  direction: MovementDirection;
  amount: number;
  movementDate: string;
  description: string;
  reference?: string;
  notes?: string;
}

export interface CreateTransferDTO {
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
  movementDate: string;
  description: string;
  reference?: string;
}

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
    let message = fallback;
    try {
      const body = (await res.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(body.message)) message = body.message.join('; ');
      else if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const treasuryService = {
  async overview(signal?: AbortSignal): Promise<TreasuryOverview> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/overview`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    });
    return handle<TreasuryOverview>(res, 'Erro ao carregar resumo de tesouraria');
  },

  async listAccounts(
    filters?: { isActive?: boolean; accountType?: BankAccountType },
    signal?: AbortSignal,
  ): Promise<BankAccount[]> {
    const params = new URLSearchParams();
    if (typeof filters?.isActive === 'boolean') params.set('isActive', String(filters.isActive));
    if (filters?.accountType) params.set('accountType', filters.accountType);
    const qs = params.toString();
    const res = await fetch(
      `${getApiBaseUrl()}/finance/treasury/accounts${qs ? `?${qs}` : ''}`,
      { method: 'GET', headers: authHeaders(), signal },
    );
    return handle<BankAccount[]>(res, 'Erro ao listar contas');
  },

  async getAccount(id: string, signal?: AbortSignal): Promise<BankAccount> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/accounts/${id}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    });
    return handle<BankAccount>(res, 'Erro ao obter conta');
  },

  async createAccount(data: CreateBankAccountDTO): Promise<BankAccount> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/accounts`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handle<BankAccount>(res, 'Erro ao criar conta');
  },

  async updateAccount(id: string, data: UpdateBankAccountDTO): Promise<BankAccount> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/accounts/${id}`, {
      method: 'PATCH',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handle<BankAccount>(res, 'Erro ao atualizar conta');
  },

  async removeAccount(id: string): Promise<{ success: boolean; action: 'deleted' | 'inactivated' }> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/accounts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle(res, 'Erro ao excluir conta');
  },

  async recordMovement(data: CreateCashMovementDTO): Promise<{
    movementId: string;
    bankAccountId: string;
    direction: MovementDirection;
    amount: number;
    previousBalance: number;
    newBalance: number;
    currency: string;
  }> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/movements`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handle(res, 'Erro ao registrar movimento');
  },

  async recordTransfer(data: CreateTransferDTO): Promise<{
    transferId: string;
    amount: number;
    from: { id: string; newBalance: number };
    to: { id: string; newBalance: number };
  }> {
    const res = await fetch(`${getApiBaseUrl()}/finance/treasury/transfers`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    });
    return handle(res, 'Erro ao registrar transferência');
  },

  async getStatement(
    bankAccountId: string,
    filters: { startDate?: string; endDate?: string; limit?: number } = {},
    signal?: AbortSignal,
  ): Promise<BankStatement> {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    const res = await fetch(
      `${getApiBaseUrl()}/finance/treasury/accounts/${bankAccountId}/statement${qs ? `?${qs}` : ''}`,
      { method: 'GET', headers: authHeaders(), signal },
    );
    return handle<BankStatement>(res, 'Erro ao gerar extrato');
  },

  /* ─── Helpers UI ───────────────────────────────────────────────────── */

  accountTypeLabel(type: BankAccountType): string {
    const labels: Record<BankAccountType, string> = {
      cash: 'Caixa',
      checking: 'Conta Corrente',
      savings: 'Poupança',
      investment: 'Investimento',
      credit: 'Cartão de Crédito',
    };
    return labels[type] ?? type;
  },

  currencyFormat(value: string | number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(value));
  },

  dateFormat(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
