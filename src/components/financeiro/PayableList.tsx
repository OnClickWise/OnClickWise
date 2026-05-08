'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Trash2, Eye, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { financeService } from '@/services/financeService';
import { Payable, PayableStatus } from '@/types/types';
import PaymentRecorder from './PaymentRecorder';

interface PayableListProps {
  refreshTrigger?: number;
  onDelete?: (id: string) => void;
}

const STATUS_FILTERS: { value: PayableStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'issued', label: 'Emitidas' },
  { value: 'partial', label: 'Parciais' },
  { value: 'paid', label: 'Pagas' },
  { value: 'overdue', label: 'Vencidas' },
];

const STATUS_BADGE: Record<string, string> = {
  issued: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function PayableList({ refreshTrigger, onDelete }: PayableListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<PayableStatus | ''>('');

  const [paymentTarget, setPaymentTarget] = useState<Payable | null>(null);
  const [detailTarget, setDetailTarget] = useState<Payable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payable | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadPayables(); }, [refreshTrigger, selectedStatus]);

  const loadPayables = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = selectedStatus
        ? await financeService.listPayablesByStatus(selectedStatus)
        : await financeService.listPayables(200);
      setPayables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await financeService.deletePayable(deleteTarget.id);
      setPayables((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      onDelete?.(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && payables.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedStatus(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
            {f.value && payables.filter((p) => p.status === f.value).length > 0 && (
              <span className="ml-2 text-xs bg-white text-gray-900 px-2 py-0.5 rounded-full">
                {payables.filter((p) => p.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {payables.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma Contas a Pagar encontrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Fornecedor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Vencimento</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Original</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Pendente</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payables.map((p) => {
                const daysUntilDue = financeService.daysUntilDue(p.due_date);
                const isOverdue = financeService.isOverdue(p.due_date, p.status);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{p.supplier_name}</p>
                      {p.reference_number && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {p.reference_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 dark:text-slate-200">{financeService.formatDate(p.due_date)}</p>
                      <p className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : daysUntilDue < 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isOverdue ? `Vencido há ${Math.abs(daysUntilDue)} dias` : `Vence em ${daysUntilDue} dias`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {financeService.formatCurrency(p.original_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className={`font-semibold ${p.outstanding_amount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        {financeService.formatCurrency(p.outstanding_amount)}
                      </p>
                      {p.paid_amount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pago: {financeService.formatCurrency(p.paid_amount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                        {financeService.getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {p.status !== 'paid' && (p.allows_partial_payment || p.outstanding_amount > 0) && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Registrar pagamento"
                            onClick={() => setPaymentTarget(p)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          title="Ver detalhes"
                          onClick={() => setDetailTarget(p)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {p.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Excluir"
                            onClick={() => setDeleteTarget(p)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal pagamento */}
      {paymentTarget && (
        <PaymentRecorder
          target={{ kind: 'payable', data: paymentTarget }}
          onSuccess={async () => { setPaymentTarget(null); await loadPayables(); }}
          onClose={() => setPaymentTarget(null)}
        />
      )}

      {/* Modal detalhes */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes da Conta a Pagar</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <Row label="Fornecedor" value={detailTarget.supplier_name} />
              <Row label="Valor original" value={financeService.formatCurrency(detailTarget.original_amount)} />
              <Row label="Valor pendente" value={financeService.formatCurrency(detailTarget.outstanding_amount)} />
              <Row label="Valor pago" value={financeService.formatCurrency(detailTarget.paid_amount)} />
              <Row label="Vencimento" value={financeService.formatDate(detailTarget.due_date)} />
              <Row label="Status" value={financeService.getStatusLabel(detailTarget.status)} />
              <Row label="Pagamento parcial" value={detailTarget.allows_partial_payment ? 'Permitido' : 'Não permitido'} />
              {detailTarget.description && <Row label="Descrição" value={detailTarget.description} />}
              {detailTarget.reference_type && <Row label="Tipo referência" value={detailTarget.reference_type} />}
              {detailTarget.reference_number && <Row label="Nº referência" value={detailTarget.reference_number} />}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <Button onClick={() => setDetailTarget(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação de exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar exclusão</h2>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-gray-600 dark:text-slate-300">
              Tem certeza que deseja excluir a conta de{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{deleteTarget.supplier_name}</span>?
              Esta ação não pode ser desfeita.
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  );
}
