import { getAuthToken } from '@/lib/cookies';
import { getApiBaseUrl } from '@/lib/api-url';

/**
 * Service unificado de Partes (Customers + Suppliers) + TaxRates + FinanceConfig.
 * Concentrado num arquivo para evitar duplicação de helpers HTTP.
 */

export type TaxIdType =
  | 'cnpj' | 'cpf' | 'nif' | 'nipc' | 'ssn' | 'ein' | 'tin'
  | 'siret' | 'siren' | 'rfc' | 'cif' | 'other';

export interface Customer {
  id: string;
  organization_id: string;
  code: string | null;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  tax_id_type: TaxIdType | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  default_currency: string | null;
  payment_terms_days: number;
  credit_limit: string | null;
  withholding_config: Record<string, unknown> | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier extends Omit<Customer, 'mobile' | 'credit_limit'> {
  bank_name: string | null;
  bank_account: string | null;
  bank_iban: string | null;
  bank_swift: string | null;
}

export interface CreateCustomerDTO {
  code?: string;
  name: string;
  legalName?: string;
  taxId?: string;
  taxIdType?: TaxIdType;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  defaultCurrency?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  withholdingConfig?: Record<string, unknown>;
  isActive?: boolean;
  notes?: string;
}
export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

export interface CreateSupplierDTO extends Omit<CreateCustomerDTO, 'mobile' | 'creditLimit'> {
  bankName?: string;
  bankAccount?: string;
  bankIban?: string;
  bankSwift?: string;
}
export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;

export type TaxType =
  | 'vat' | 'sales_tax' | 'withholding'
  | 'icms' | 'iss' | 'ipi' | 'pis' | 'cofins'
  | 'other';

export interface TaxRate {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  tax_type: TaxType;
  rate: string | number;
  country: string | null;
  account_id: string | null;
  is_default: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxRateDTO {
  code: string;
  name: string;
  taxType: TaxType;
  rate: number;
  country?: string;
  accountId?: string;
  isDefault?: boolean;
  isActive?: boolean;
  description?: string;
}
export type UpdateTaxRateDTO = Partial<CreateTaxRateDTO>;

export type TaxMode = 'inclusive' | 'exclusive' | 'none';

export interface FinanceConfig {
  organization_id: string;
  locale: string;
  default_currency: string;
  country: string;
  fiscal_year_start_month: number;
  tax_mode: TaxMode;
  decimal_separator: string;
  thousands_separator: string;
  updated_at: string;
}

export interface UpdateFinanceConfigDTO {
  locale?: string;
  defaultCurrency?: string;
  country?: string;
  fiscalYearStartMonth?: number;
  taxMode?: TaxMode;
  decimalSeparator?: string;
  thousandsSeparator?: string;
}

/* ─── HTTP helpers (sem Content-Type em GET/DELETE) ──────────────────── */

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
      // body não-JSON
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

const base = () => getApiBaseUrl();

/* ─── Customers ──────────────────────────────────────────────────────── */

export const customersService = {
  list(
    filters?: { isActive?: boolean; query?: string; country?: string; limit?: number },
    signal?: AbortSignal,
  ): Promise<Customer[]> {
    const p = new URLSearchParams();
    if (typeof filters?.isActive === 'boolean') p.set('isActive', String(filters.isActive));
    if (filters?.query?.trim()) p.set('query', filters.query.trim());
    if (filters?.country) p.set('country', filters.country);
    if (filters?.limit) p.set('limit', String(filters.limit));
    return fetch(`${base()}/finance/customers${p.toString() ? `?${p}` : ''}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar clientes'));
  },
  getById(id: string, signal?: AbortSignal): Promise<Customer> {
    return fetch(`${base()}/finance/customers/${id}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao obter cliente'));
  },
  create(data: CreateCustomerDTO): Promise<Customer> {
    return fetch(`${base()}/finance/customers`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao criar cliente'));
  },
  update(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    return fetch(`${base()}/finance/customers/${id}`, {
      method: 'PATCH',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao atualizar cliente'));
  },
  remove(id: string): Promise<{ success: boolean; action: 'deleted' | 'inactivated' }> {
    return fetch(`${base()}/finance/customers/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro ao excluir cliente'));
  },
};

/* ─── Suppliers ──────────────────────────────────────────────────────── */

export const suppliersService = {
  list(
    filters?: { isActive?: boolean; query?: string; country?: string; limit?: number },
    signal?: AbortSignal,
  ): Promise<Supplier[]> {
    const p = new URLSearchParams();
    if (typeof filters?.isActive === 'boolean') p.set('isActive', String(filters.isActive));
    if (filters?.query?.trim()) p.set('query', filters.query.trim());
    if (filters?.country) p.set('country', filters.country);
    if (filters?.limit) p.set('limit', String(filters.limit));
    return fetch(`${base()}/finance/suppliers${p.toString() ? `?${p}` : ''}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar fornecedores'));
  },
  getById(id: string, signal?: AbortSignal): Promise<Supplier> {
    return fetch(`${base()}/finance/suppliers/${id}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao obter fornecedor'));
  },
  create(data: CreateSupplierDTO): Promise<Supplier> {
    return fetch(`${base()}/finance/suppliers`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao criar fornecedor'));
  },
  update(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    return fetch(`${base()}/finance/suppliers/${id}`, {
      method: 'PATCH',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao atualizar fornecedor'));
  },
  remove(id: string): Promise<{ success: boolean; action: 'deleted' | 'inactivated' }> {
    return fetch(`${base()}/finance/suppliers/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro ao excluir fornecedor'));
  },
};

/* ─── Tax Rates ──────────────────────────────────────────────────────── */

export const taxRatesService = {
  list(
    filters?: { isActive?: boolean; taxType?: TaxType; country?: string },
    signal?: AbortSignal,
  ): Promise<TaxRate[]> {
    const p = new URLSearchParams();
    if (typeof filters?.isActive === 'boolean') p.set('isActive', String(filters.isActive));
    if (filters?.taxType) p.set('taxType', filters.taxType);
    if (filters?.country) p.set('country', filters.country);
    return fetch(`${base()}/finance/tax-rates${p.toString() ? `?${p}` : ''}`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao listar impostos'));
  },
  create(data: CreateTaxRateDTO): Promise<TaxRate> {
    return fetch(`${base()}/finance/tax-rates`, {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao criar imposto'));
  },
  update(id: string, data: UpdateTaxRateDTO): Promise<TaxRate> {
    return fetch(`${base()}/finance/tax-rates/${id}`, {
      method: 'PATCH',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao atualizar imposto'));
  },
  remove(id: string): Promise<{ success: boolean; action: 'deleted' | 'inactivated' }> {
    return fetch(`${base()}/finance/tax-rates/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => handle(r, 'Erro ao excluir imposto'));
  },

  taxTypeLabel(type: TaxType): string {
    const labels: Record<TaxType, string> = {
      vat: 'IVA / TVA / VAT',
      sales_tax: 'Sales Tax (US)',
      withholding: 'Retenção na Fonte',
      icms: 'ICMS (BR)',
      iss: 'ISS (BR)',
      ipi: 'IPI (BR)',
      pis: 'PIS (BR)',
      cofins: 'COFINS (BR)',
      other: 'Outro',
    };
    return labels[type] ?? type;
  },
};

/* ─── Finance Config ─────────────────────────────────────────────────── */

export const financeConfigService = {
  get(signal?: AbortSignal): Promise<FinanceConfig> {
    return fetch(`${base()}/finance/config`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    }).then((r) => handle(r, 'Erro ao carregar configuração financeira'));
  },
  update(data: UpdateFinanceConfigDTO): Promise<FinanceConfig> {
    return fetch(`${base()}/finance/config`, {
      method: 'PUT',
      headers: authHeadersJson(),
      body: JSON.stringify(data),
    }).then((r) => handle(r, 'Erro ao atualizar configuração financeira'));
  },
};

/* ─── Helpers de UI ───────────────────────────────────────────────────── */

export const TAX_ID_TYPE_OPTIONS: ReadonlyArray<{ value: TaxIdType; label: string; country?: string }> = [
  { value: 'cnpj', label: 'CNPJ', country: 'BR' },
  { value: 'cpf', label: 'CPF', country: 'BR' },
  { value: 'nif', label: 'NIF', country: 'PT/AO/ES' },
  { value: 'nipc', label: 'NIPC', country: 'PT' },
  { value: 'ssn', label: 'SSN', country: 'US' },
  { value: 'ein', label: 'EIN', country: 'US' },
  { value: 'tin', label: 'TIN', country: 'US' },
  { value: 'siret', label: 'SIRET', country: 'FR' },
  { value: 'siren', label: 'SIREN', country: 'FR' },
  { value: 'rfc', label: 'RFC', country: 'MX' },
  { value: 'cif', label: 'CIF', country: 'ES' },
  { value: 'other', label: 'Outro' },
];

export const COUNTRY_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'BR', name: 'Brasil' },
  { code: 'AO', name: 'Angola' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MZ', name: 'Moçambique' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
];
