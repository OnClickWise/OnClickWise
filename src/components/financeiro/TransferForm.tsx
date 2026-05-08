'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BankAccount, CreateTransferDTO, treasuryService } from '@/services/treasuryService';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

interface Props {
  accounts: BankAccount[];
  initialFromId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TransferForm({ accounts, initialFromId, onSuccess, onCancel }: Props) {
  const activeAccounts = accounts.filter((a) => a.is_active);

  const [form, setForm] = useState<CreateTransferDTO>(() => ({
    fromBankAccountId: initialFromId ?? activeAccounts[0]?.id ?? '',
    toBankAccountId: '',
    amount: 0,
    movementDate: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garante que conta destino seja diferente da origem
  useEffect(() => {
    if (form.fromBankAccountId && form.toBankAccountId === form.fromBankAccountId) {
      setForm((prev) => ({ ...prev, toBankAccountId: '' }));
    }
  }, [form.fromBankAccountId, form.toBankAccountId]);

  const fromAccount = activeAccounts.find((a) => a.id === form.fromBankAccountId);
  const toAccount = activeAccounts.find((a) => a.id === form.toBankAccountId);

  const set = <K extends keyof CreateTransferDTO>(key: K, value: CreateTransferDTO[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.fromBankAccountId) throw new Error('Conta de origem é obrigatória');
      if (!form.toBankAccountId) throw new Error('Conta de destino é obrigatória');
      if (form.fromBankAccountId === form.toBankAccountId) {
        throw new Error('Conta de origem e destino devem ser diferentes');
      }
      if (form.amount <= 0) throw new Error('Valor deve ser maior que zero');
      if (!form.description.trim()) throw new Error('Descrição é obrigatória');

      await treasuryService.recordTransfer({
        fromBankAccountId: form.fromBankAccountId,
        toBankAccountId: form.toBankAccountId,
        amount: form.amount,
        movementDate: form.movementDate,
        description: form.description.trim(),
        reference: form.reference?.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar transferência');
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className={labelCls}>De *</label>
          <Select
            value={form.fromBankAccountId}
            onValueChange={(v) => set('fromBankAccountId', v)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Conta de origem..." />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.bank_code} · {a.bank_name} ({treasuryService.currencyFormat(a.current_balance, a.currency)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-center pb-2">
          <ArrowRight className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <label className={labelCls}>Para *</label>
          <Select
            value={form.toBankAccountId}
            onValueChange={(v) => set('toBankAccountId', v)}
            disabled={loading || !form.fromBankAccountId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Conta de destino..." />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts
                .filter((a) => a.id !== form.fromBankAccountId)
                .filter((a) => !fromAccount || a.currency === fromAccount.currency)
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.bank_code} · {a.bank_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {fromAccount && toAccount && fromAccount.currency !== toAccount.currency && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ Transferência entre moedas diferentes não é suportada nesta versão.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Valor ({fromAccount?.currency ?? 'BRL'}) *</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={fromAccount ? Number(fromAccount.current_balance) : undefined}
            value={form.amount}
            onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
          {fromAccount && (
            <p className="text-xs text-slate-400 mt-1">
              Saldo origem: {treasuryService.currencyFormat(fromAccount.current_balance, fromAccount.currency)}
            </p>
          )}
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
          placeholder="Ex.: Repasse para conta corrente"
          maxLength={500}
          disabled={loading}
        />
      </div>

      <div>
        <label className={labelCls}>Referência</label>
        <Input
          value={form.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
          placeholder="Comprovante, código TED..."
          maxLength={100}
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Transferindo...
            </>
          ) : (
            'Confirmar Transferência'
          )}
        </Button>
      </div>
    </form>
  );
}
