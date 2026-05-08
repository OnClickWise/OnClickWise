'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { financeService } from '@/services/financeService';
import { Payable, CreatePayableDTO } from '@/types/types';

const fieldCls = "w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1";

interface PayableFormProps {
  onSuccess?: (payable: Payable) => void;
  onError?: (error: string) => void;
  initialData?: Payable;
}

export default function PayableForm({ onSuccess, onError, initialData }: PayableFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreatePayableDTO>({
    supplier_name: initialData?.supplier_name || '',
    original_amount: initialData ? initialData.original_amount : 0,
    due_date: initialData?.due_date || '',
    supplier_id: initialData?.supplier_id,
    description: initialData?.description,
    allows_partial_payment: initialData?.allows_partial_payment ?? true,
    reference_number: initialData?.reference_number,
    reference_type: initialData?.reference_type,
    reference_id: initialData?.reference_id,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'original_amount' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.supplier_name.trim()) throw new Error('Nome do fornecedor é obrigatório');
      if (formData.original_amount <= 0) throw new Error('Valor deve ser maior que zero');
      if (!formData.due_date) throw new Error('Data de vencimento é obrigatória');

      const payable = await financeService.createPayable(formData);
      setSuccess(true);
      setFormData({ supplier_name: '', original_amount: 0, due_date: '', allows_partial_payment: true });
      onSuccess?.(payable);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar Contas a Pagar';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-700 dark:text-green-300">Contas a Pagar criada com sucesso!</p>
        </div>
      )}

      <div>
        <label className={labelCls}>Nome do Fornecedor <span className="text-red-500">*</span></label>
        <Input
          type="text"
          name="supplier_name"
          value={formData.supplier_name}
          onChange={handleChange}
          placeholder="Ex: Distribuidora ABC"
          disabled={loading}
          className="w-full"
        />
      </div>

      <div>
        <label className={labelCls}>Valor (R$) <span className="text-red-500">*</span></label>
        <Input
          type="number"
          name="original_amount"
          value={formData.original_amount}
          onChange={handleChange}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="0.00"
          disabled={loading}
          step="0.01"
          min="0.01"
          className="w-full"
        />
      </div>

      <div>
        <label className={labelCls}>Data de Vencimento <span className="text-red-500">*</span></label>
        <Input
          type="date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          disabled={loading}
          className="w-full"
        />
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Detalhes da compra..."
          disabled={loading}
          rows={2}
          className={fieldCls}
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
        <input
          type="checkbox"
          id="allows_partial_payment"
          name="allows_partial_payment"
          checked={formData.allows_partial_payment}
          onChange={handleChange}
          disabled={loading}
          className="mt-0.5 h-4 w-4 accent-blue-600"
        />
        <div>
          <label htmlFor="allows_partial_payment" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
            Permitir pagamento parcial
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formData.allows_partial_payment ? 'Você pode registrar múltiplos pagamentos' : 'Deve ser pago de uma vez'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tipo de Referência</label>
          <select
            name="reference_type"
            value={formData.reference_type || ''}
            onChange={handleChange}
            disabled={loading}
            className={fieldCls}
          >
            <option value="">Nenhum</option>
            <option value="invoice">Nota Fiscal</option>
            <option value="purchase_order">Pedido de Compra</option>
            <option value="contract">Contrato</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Número de Referência</label>
          <Input
            type="text"
            name="reference_number"
            value={formData.reference_number || ''}
            onChange={handleChange}
            placeholder="NF-001, PC-2024, etc"
            disabled={loading}
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : <><Plus className="h-4 w-4 mr-2" />Criar Contas a Pagar</>}
        </Button>
      </div>
    </form>
  );
}
