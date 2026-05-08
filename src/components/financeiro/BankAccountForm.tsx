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
  BankAccount,
  BankAccountType,
  CreateBankAccountDTO,
  treasuryService,
} from '@/services/treasuryService';
import CurrencySelect from './CurrencySelect';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

const ACCOUNT_TYPE_OPTIONS: ReadonlyArray<{ value: BankAccountType; label: string }> = [
  { value: 'cash', label: 'Caixa' },
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'investment', label: 'Investimento' },
  { value: 'credit', label: 'Cartão de Crédito' },
];

interface Props {
  initial?: BankAccount | null;
  onSuccess: (account: BankAccount) => void;
  onCancel: () => void;
}

export default function BankAccountForm({ initial, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<CreateBankAccountDTO>(() => ({
    bankCode: initial?.bank_code ?? '',
    bankName: initial?.bank_name ?? '',
    accountNumber: initial?.account_number ?? '',
    accountType: initial?.account_type ?? 'checking',
    accountHolder: initial?.account_holder ?? '',
    initialBalance: 0,
    currency: initial?.currency ?? 'BRL',
    isActive: initial?.is_active ?? true,
    notes: initial?.notes ?? '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      bankCode: initial?.bank_code ?? '',
      bankName: initial?.bank_name ?? '',
      accountNumber: initial?.account_number ?? '',
      accountType: initial?.account_type ?? 'checking',
      accountHolder: initial?.account_holder ?? '',
      initialBalance: 0,
      currency: initial?.currency ?? 'BRL',
      isActive: initial?.is_active ?? true,
      notes: initial?.notes ?? '',
    });
    setError(null);
  }, [initial]);

  const set = <K extends keyof CreateBankAccountDTO>(key: K, value: CreateBankAccountDTO[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.bankCode.trim()) throw new Error('Código é obrigatório');
      if (!form.bankName.trim()) throw new Error('Nome é obrigatório');
      if (!form.accountNumber.trim()) throw new Error('Número da conta é obrigatório');
      if (!form.accountHolder.trim()) throw new Error('Titular é obrigatório');

      const result =
        isEdit && initial
          ? await treasuryService.updateAccount(initial.id, {
              bankName: form.bankName,
              accountType: form.accountType,
              accountHolder: form.accountHolder,
              currency: form.currency,
              isActive: form.isActive,
              notes: form.notes,
            })
          : await treasuryService.createAccount(form);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className={labelCls}>Código *</label>
          <Input
            value={form.bankCode}
            onChange={(e) => set('bankCode', e.target.value.toUpperCase())}
            placeholder="Ex.: 001 ou CXA01"
            maxLength={10}
            disabled={loading || isEdit}
          />
          {isEdit && <p className="text-xs text-slate-400 mt-1">Não editável após criação</p>}
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Nome do Banco/Caixa *</label>
          <Input
            value={form.bankName}
            onChange={(e) => set('bankName', e.target.value)}
            placeholder="Ex.: Itaú · Caixa Geral"
            maxLength={255}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo *</label>
          <Select
            value={form.accountType}
            onValueChange={(v) => set('accountType', v as BankAccountType)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelCls}>Moeda</label>
          <CurrencySelect
            value={form.currency ?? 'BRL'}
            onChange={(v) => set('currency', v)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Número da Conta *</label>
          <Input
            value={form.accountNumber}
            onChange={(e) => set('accountNumber', e.target.value)}
            placeholder="Ex.: 12345-6"
            maxLength={50}
            disabled={loading || isEdit}
          />
          {isEdit && <p className="text-xs text-slate-400 mt-1">Não editável após criação</p>}
        </div>
        <div>
          <label className={labelCls}>Titular *</label>
          <Input
            value={form.accountHolder}
            onChange={(e) => set('accountHolder', e.target.value)}
            placeholder="Nome do titular"
            maxLength={255}
            disabled={loading}
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className={labelCls}>Saldo Inicial (opcional)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.initialBalance ?? 0}
            onChange={(e) => set('initialBalance', parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
          <p className="text-xs text-slate-400 mt-1">
            Se preenchido, gera lançamento de abertura para auditoria.
          </p>
        </div>
      )}

      <div>
        <label className={labelCls}>Notas</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Observações..."
          rows={2}
          disabled={loading}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
        <input
          type="checkbox"
          id="bank_is_active"
          checked={form.isActive ?? true}
          onChange={(e) => set('isActive', e.target.checked)}
          disabled={loading}
          className="h-4 w-4 accent-cyan-600"
        />
        <label htmlFor="bank_is_active" className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          Ativa
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : isEdit ? (
            'Salvar alterações'
          ) : (
            'Criar conta'
          )}
        </Button>
      </div>
    </form>
  );
}
