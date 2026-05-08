'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { financeService } from '@/services/financeService';
import { Payable, Receivable, RecordPaymentDTO } from '@/types/types';

/**
 * Tipo discriminado: o modal aceita Receivable OU Payable de forma type-safe.
 * Antes existia `as any` em PayableList — agora resolvido sem cast.
 */
type PaymentTarget =
  | { kind: 'receivable'; data: Receivable }
  | { kind: 'payable'; data: Payable };

interface PaymentRecorderProps {
  target: PaymentTarget;
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const PAYMENT_METHODS: ReadonlyArray<{ value: RecordPaymentDTO['payment_method']; label: string }> = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'check', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Transferência Bancária / PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'other', label: 'Outro' },
];

export default function PaymentRecorder({
  target,
  onSuccess,
  onClose,
  isModal = true,
}: PaymentRecorderProps) {
  const isReceivable = target.kind === 'receivable';
  const entity = target.data;
  const counterpartyLabel = isReceivable
    ? (entity as Receivable).customer_name
    : (entity as Payable).supplier_name;

  const allowsPartial = isReceivable
    ? true // recebíveis sempre permitem parcial
    : (entity as Payable).allows_partial_payment;

  const outstanding = Number(entity.outstanding_amount) || 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [paymentData, setPaymentData] = useState<RecordPaymentDTO>(() => ({
    amount: outstanding,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    payment_reference: '',
    notes: '',
  }));

  // Reset quando trocar o alvo (caso o modal seja reutilizado)
  useEffect(() => {
    setPaymentData({
      amount: outstanding,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      payment_reference: '',
      notes: '',
    });
    setError(null);
    setSuccess(false);
  }, [entity.id, outstanding]);

  const remainingAfter = useMemo(
    () => Math.max(0, outstanding - (Number(paymentData.amount) || 0)),
    [outstanding, paymentData.amount],
  );

  const handleField = <K extends keyof RecordPaymentDTO>(key: K, value: RecordPaymentDTO[K]) => {
    setPaymentData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validações de domínio
      if (paymentData.amount <= 0) {
        throw new Error('Valor do pagamento deve ser maior que zero.');
      }
      if (paymentData.amount > outstanding + 0.001) {
        throw new Error(
          `Valor não pode exceder a pendência: ${financeService.formatCurrency(outstanding)}.`,
        );
      }
      if (!allowsPartial && Math.abs(paymentData.amount - outstanding) > 0.001) {
        throw new Error('Este lançamento não permite pagamento parcial. Quite o valor total.');
      }
      if (!paymentData.payment_date) {
        throw new Error('Data do pagamento é obrigatória.');
      }

      if (isReceivable) {
        await financeService.recordReceivablePayment(entity.id, paymentData);
      } else {
        await financeService.recordPayablePayment(entity.id, paymentData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const titleSuffix = isReceivable ? 'Recebimento' : 'Pagamento';
  const submitLabel = isReceivable ? 'Confirmar Recebimento' : 'Confirmar Pagamento';
  const accentColor = isReceivable ? 'green' : 'purple';
  const submitBtnClass =
    accentColor === 'green'
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-purple-600 hover:bg-purple-700 text-white';

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Registrar {titleSuffix}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {counterpartyLabel}
          </p>
        </div>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
        <Stat label="Original" value={financeService.formatCurrency(Number(entity.original_amount))} />
        <Stat label="Já pago" value={financeService.formatCurrency(Number(entity.paid_amount))} />
        <Stat
          label="Pendente"
          value={financeService.formatCurrency(outstanding)}
          highlight={outstanding > 0 ? 'orange' : 'green'}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {titleSuffix} registrado com sucesso.
          </p>
        </div>
      )}

      {/* Valor */}
      <Field label="Valor (R$)" required>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
          <Input
            type="number"
            value={paymentData.amount}
            onChange={(e) => handleField('amount', parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="0.00"
            disabled={loading}
            step="0.01"
            min="0.01"
            max={outstanding}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Máximo: {financeService.formatCurrency(outstanding)}
          {paymentData.amount > 0 && paymentData.amount < outstanding && (
            <> · Restará {financeService.formatCurrency(remainingAfter)}</>
          )}
        </p>
      </Field>

      {/* Data */}
      <Field label="Data do Pagamento" required>
        <Input
          type="date"
          value={paymentData.payment_date}
          onChange={(e) => handleField('payment_date', e.target.value)}
          disabled={loading}
        />
      </Field>

      {/* Forma de Pagamento — agora com Radix Select consistente com o app */}
      <Field label="Forma de Pagamento" required>
        <Select
          value={paymentData.payment_method}
          onValueChange={(value) =>
            handleField('payment_method', value as RecordPaymentDTO['payment_method'])
          }
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar forma de pagamento..." />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Referência */}
      <Field label="Referência (comprovante, código, etc.)">
        <Input
          type="text"
          value={paymentData.payment_reference ?? ''}
          onChange={(e) => handleField('payment_reference', e.target.value)}
          placeholder="Ex: TED-091823, CHQ-0001..."
          disabled={loading}
        />
      </Field>

      {/* Notas */}
      <Field label="Observações">
        <textarea
          value={paymentData.notes ?? ''}
          onChange={(e) => handleField('notes', e.target.value)}
          placeholder="Observações adicionais..."
          disabled={loading}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </Field>

      <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        {isModal && onClose && (
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading || success} className={`flex-1 ${submitBtnClass}`}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6">{content}</div>
        </div>
      </div>
    );
  }

  return content;
}

/* ─── Subcomponentes ─────────────────────────────────────────────────────── */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'orange' | 'green';
}) {
  const highlightClass =
    highlight === 'orange'
      ? 'text-orange-600 dark:text-orange-400'
      : highlight === 'green'
      ? 'text-green-600 dark:text-green-400'
      : 'text-slate-900 dark:text-white';
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`font-semibold mt-0.5 ${highlightClass}`}>{value}</p>
    </div>
  );
}
