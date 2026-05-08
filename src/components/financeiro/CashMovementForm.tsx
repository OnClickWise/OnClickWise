'use client';

import { useState } from 'react';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  BankAccount,
  CreateCashMovementDTO,
  MovementDirection,
  treasuryService,
} from '@/services/treasuryService';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

interface Props {
  account: BankAccount;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CashMovementForm({ account, onSuccess, onCancel }: Props) {
  const [direction, setDirection] = useState<MovementDirection>('inflow');
  const [form, setForm] = useState<Omit<CreateCashMovementDTO, 'bankAccountId' | 'direction'>>({
    amount: 0,
    movementDate: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (form.amount <= 0) throw new Error('Valor deve ser maior que zero');
      if (!form.description.trim()) throw new Error('Descrição é obrigatória');

      await treasuryService.recordMovement({
        bankAccountId: account.id,
        direction,
        amount: form.amount,
        movementDate: form.movementDate,
        description: form.description.trim(),
        reference: form.reference?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar movimento');
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

      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm">
        <span className="text-slate-600 dark:text-slate-300">
          Conta: <strong>{account.bank_code} — {account.bank_name}</strong>
        </span>
        <span className="ml-3 text-slate-500">
          Saldo: {treasuryService.currencyFormat(account.current_balance, account.currency)}
        </span>
      </div>

      {/* Toggle direção */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection('inflow')}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
            direction === 'inflow'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Entrada
        </button>
        <button
          type="button"
          onClick={() => setDirection('outflow')}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
            direction === 'outflow'
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Saída
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Valor ({account.currency}) *</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
        </div>
        <div>
          <label className={labelCls}>Data *</label>
          <Input
            type="date"
            value={form.movementDate}
            onChange={(e) => set('movementDate', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Descrição *</label>
        <Input
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Ex.: Suprimento de caixa, taxa bancária..."
          maxLength={500}
          disabled={loading}
        />
      </div>

      <div>
        <label className={labelCls}>Referência</label>
        <Input
          value={form.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
          placeholder="Comprovante, doc bancário..."
          maxLength={100}
          disabled={loading}
        />
      </div>

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

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className={`flex-1 text-white ${
            direction === 'inflow' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            `Confirmar ${direction === 'inflow' ? 'Entrada' : 'Saída'}`
          )}
        </Button>
      </div>
    </form>
  );
}
