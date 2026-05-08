'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { financeService } from '@/services/financeService';
import { Receivable, CreateReceivableDTO } from '@/types/types';

const fieldCls = "w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1";

interface ReceivableFormProps {
  onSuccess?: (receivable: Receivable) => void;
  onError?: (error: string) => void;
  initialData?: Receivable;
}

export default function ReceivableForm({ onSuccess, onError, initialData }: ReceivableFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateReceivableDTO>({
    customer_name: initialData?.customer_name || '',
    original_amount: initialData ? initialData.original_amount : 0,
    due_date: initialData?.due_date || '',
    customer_id: initialData?.customer_id,
    description: initialData?.description,
    reference_number: initialData?.reference_number,
    reference_type: initialData?.reference_type,
    reference_id: initialData?.reference_id,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'original_amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.customer_name.trim()) throw new Error('Nome do cliente é obrigatório');
      if (formData.original_amount <= 0) throw new Error('Valor deve ser maior que zero');
      if (!formData.due_date) throw new Error('Data de vencimento é obrigatória');

      const receivable = await financeService.createReceivable(formData);
      setSuccess(true);
      setFormData({ customer_name: '', original_amount: 0, due_date: '' });
      onSuccess?.(receivable);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar Contas a Receber';
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
          <p className="text-sm text-green-700 dark:text-green-300">Contas a Receber criada com sucesso!</p>
        </div>
      )}

      <div>
        <label className={labelCls}>Nome do Cliente <span className="text-red-500">*</span></label>
        <Input
          type="text"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          placeholder="Ex: Acme Corporation"
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
          placeholder="Detalhes adicionais..."
          disabled={loading}
          rows={2}
          className={fieldCls}
        />
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
            <option value="contract">Contrato</option>
            <option value="order">Pedido</option>
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
            placeholder="NF-001, CT-2024, etc"
            disabled={loading}
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : <><Plus className="h-4 w-4 mr-2" />Criar Contas a Receber</>}
        </Button>
      </div>
    </form>
  );
}
