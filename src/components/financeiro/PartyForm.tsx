'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COUNTRY_OPTIONS,
  Customer,
  CreateCustomerDTO,
  CreateSupplierDTO,
  Supplier,
  TAX_ID_TYPE_OPTIONS,
  TaxIdType,
  customersService,
  suppliersService,
} from '@/services/partiesService';
import CurrencySelect from './CurrencySelect';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

export type PartyKind = 'customer' | 'supplier';

interface Props {
  kind: PartyKind;
  initial?: Customer | Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const NONE = '__none__';

/**
 * Form universal para Cliente OU Fornecedor.
 * Diferenças mínimas (mobile só em Customer; campos bancários só em Supplier).
 */
export default function PartyForm({ kind, initial, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initial);
  const isSupplier = kind === 'supplier';

  const [form, setForm] = useState<CreateCustomerDTO & CreateSupplierDTO>(() => ({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    legalName: initial?.legal_name ?? '',
    taxId: initial?.tax_id ?? '',
    taxIdType: (initial?.tax_id_type as TaxIdType | undefined) ?? undefined,
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    mobile: (initial as Customer | undefined)?.mobile ?? '',
    website: initial?.website ?? '',
    addressLine1: initial?.address_line1 ?? '',
    addressLine2: initial?.address_line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    postalCode: initial?.postal_code ?? '',
    country: initial?.country ?? '',
    defaultCurrency: initial?.default_currency ?? '',
    paymentTermsDays: initial?.payment_terms_days ?? 0,
    bankName: (initial as Supplier | undefined)?.bank_name ?? '',
    bankAccount: (initial as Supplier | undefined)?.bank_account ?? '',
    bankIban: (initial as Supplier | undefined)?.bank_iban ?? '',
    bankSwift: (initial as Supplier | undefined)?.bank_swift ?? '',
    isActive: initial?.is_active ?? true,
    notes: initial?.notes ?? '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [initial]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.name?.trim()) throw new Error('Nome é obrigatório');

      // Saneamento — converte strings vazias em undefined antes de enviar.
      const clean: Record<string, unknown> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v === '' || v === null) return;
        clean[k] = v;
      });
      // Force-keep isActive/paymentTermsDays (boolean/0 são válidos).
      clean.isActive = form.isActive;
      if (form.paymentTermsDays !== undefined) clean.paymentTermsDays = form.paymentTermsDays;

      if (isSupplier) {
        const payload = clean as unknown as CreateSupplierDTO;
        if (isEdit && initial) await suppliersService.update(initial.id, payload);
        else await suppliersService.create(payload);
      } else {
        const payload = clean as unknown as CreateCustomerDTO;
        if (isEdit && initial) await customersService.update(initial.id, payload);
        else await customersService.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const accentClass = isSupplier ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700';
  const labelKind = isSupplier ? 'Fornecedor' : 'Cliente';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Código</label>
          <Input value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} placeholder="C001" maxLength={40} disabled={loading} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Nome *</label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={`Nome do ${labelKind.toLowerCase()}`} maxLength={255} disabled={loading} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Razão social / Nome legal</label>
        <Input value={form.legalName ?? ''} onChange={(e) => set('legalName', e.target.value)} maxLength={255} disabled={loading} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Tipo ID Fiscal</label>
          <Select
            value={form.taxIdType ?? NONE}
            onValueChange={(v) => set('taxIdType', v === NONE ? undefined : (v as TaxIdType))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {TAX_ID_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}{opt.country ? ` (${opt.country})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Identificação Fiscal</label>
          <Input value={form.taxId ?? ''} onChange={(e) => set('taxId', e.target.value)} placeholder="CNPJ / NIF / EIN..." maxLength={50} disabled={loading} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>E-mail</label>
          <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} maxLength={255} disabled={loading} />
        </div>
        <div>
          <label className={labelCls}>Telefone</label>
          <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} maxLength={50} disabled={loading} />
        </div>
      </div>

      {!isSupplier && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Celular</label>
            <Input value={form.mobile ?? ''} onChange={(e) => set('mobile', e.target.value)} maxLength={50} disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>Site</label>
            <Input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} maxLength={255} disabled={loading} />
          </div>
        </div>
      )}

      {/* Endereço */}
      <div className="space-y-3">
        <label className={labelCls}>Endereço</label>
        <Input value={form.addressLine1 ?? ''} onChange={(e) => set('addressLine1', e.target.value)} placeholder="Linha 1" disabled={loading} />
        <Input value={form.addressLine2 ?? ''} onChange={(e) => set('addressLine2', e.target.value)} placeholder="Linha 2 (opcional)" disabled={loading} />
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder="Cidade" disabled={loading} />
          <Input value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} placeholder="Estado/Província" disabled={loading} />
          <Input value={form.postalCode ?? ''} onChange={(e) => set('postalCode', e.target.value)} placeholder="CEP/CP" disabled={loading} />
        </div>
        <Select
          value={form.country ?? NONE}
          onValueChange={(v) => set('country', v === NONE ? '' : v)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {COUNTRY_OPTIONS.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} · {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comercial */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Moeda padrão</label>
          <CurrencySelect
            value={form.defaultCurrency || 'BRL'}
            onChange={(v) => set('defaultCurrency', v)}
            disabled={loading}
          />
        </div>
        <div>
          <label className={labelCls}>Prazo de pagamento (dias)</label>
          <Input
            type="number"
            min="0"
            value={form.paymentTermsDays ?? 0}
            onChange={(e) => set('paymentTermsDays', parseInt(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
        </div>
      </div>

      {/* Bancário (apenas Supplier) */}
      {isSupplier && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Dados Bancários</p>
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.bankName ?? ''} onChange={(e) => set('bankName', e.target.value)} placeholder="Nome do banco" disabled={loading} />
            <Input value={form.bankAccount ?? ''} onChange={(e) => set('bankAccount', e.target.value)} placeholder="Conta" disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.bankIban ?? ''} onChange={(e) => set('bankIban', e.target.value)} placeholder="IBAN" disabled={loading} />
            <Input value={form.bankSwift ?? ''} onChange={(e) => set('bankSwift', e.target.value)} placeholder="SWIFT/BIC" disabled={loading} />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Notas</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          disabled={loading}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive ?? true}
          onChange={(e) => set('isActive', e.target.checked)}
          disabled={loading}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-slate-700 dark:text-slate-200">Ativo</span>
      </label>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className={`flex-1 text-white ${accentClass}`}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : isEdit ? (
            'Salvar alterações'
          ) : (
            `Criar ${labelKind}`
          )}
        </Button>
      </div>
    </form>
  );
}
