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
import { journalsService } from '@/services/journalsService';
import {
  AccountingJournal,
  CreateJournalDTO,
  JournalType,
  NumberingMode,
} from '@/types/types';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

const JOURNAL_TYPE_OPTIONS: ReadonlyArray<{ value: JournalType; label: string }> = [
  { value: 'sales', label: 'Vendas' },
  { value: 'purchases', label: 'Compras' },
  { value: 'cash', label: 'Caixa' },
  { value: 'bank', label: 'Bancos' },
  { value: 'diverse', label: 'Diversos' },
  { value: 'opening', label: 'Abertura' },
  { value: 'regularization', label: 'Regularização' },
  { value: 'closing', label: 'Encerramento' },
  { value: 'depreciation', label: 'Amortização/Depreciação' },
  { value: 'payroll', label: 'Folha de Pagamento' },
  { value: 'taxes', label: 'Impostos' },
];

interface Props {
  initial?: AccountingJournal | null;
  onSuccess: (journal: AccountingJournal) => void;
  onCancel: () => void;
}

export default function JournalForm({ initial, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<CreateJournalDTO>(() => ({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    journalType: initial?.journal_type ?? 'diverse',
    numberingMode: initial?.numbering_mode ?? 'continuous',
    isActive: initial?.is_active ?? true,
    sortOrder: initial?.sort_order ?? 0,
    description: initial?.description ?? '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset quando o objeto inicial mudar (modal reaberto com outro item)
  useEffect(() => {
    setForm({
      code: initial?.code ?? '',
      name: initial?.name ?? '',
      journalType: initial?.journal_type ?? 'diverse',
      numberingMode: initial?.numbering_mode ?? 'continuous',
      isActive: initial?.is_active ?? true,
      sortOrder: initial?.sort_order ?? 0,
      description: initial?.description ?? '',
    });
    setError(null);
  }, [initial]);

  const set = <K extends keyof CreateJournalDTO>(key: K, value: CreateJournalDTO[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.code.trim()) throw new Error('Código é obrigatório');
      if (!form.name.trim()) throw new Error('Nome é obrigatório');

      const result = isEdit && initial
        ? await journalsService.update(initial.id, form)
        : await journalsService.create(form);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar diário');
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
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="Ex.: 41"
            maxLength={10}
            disabled={loading}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Nome *</label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex.: Diário de Compras"
            maxLength={120}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo *</label>
          <Select
            value={form.journalType}
            onValueChange={(v) => set('journalType', v as JournalType)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {JOURNAL_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelCls}>Numeração *</label>
          <Select
            value={form.numberingMode}
            onValueChange={(v) => set('numberingMode', v as NumberingMode)}
            disabled={loading || (isEdit && (initial?.entries_count ?? 0) > 0)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="continuous">Contínua (anual)</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          {isEdit && (initial?.entries_count ?? 0) > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Não pode ser alterada — diário já possui lançamentos.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Notas sobre o uso deste diário..."
          rows={2}
          disabled={loading}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
        <input
          type="checkbox"
          id="journal_is_active"
          checked={form.isActive ?? true}
          onChange={(e) => set('isActive', e.target.checked)}
          disabled={loading}
          className="h-4 w-4 accent-indigo-600"
        />
        <label htmlFor="journal_is_active" className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          Ativo
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : isEdit ? (
            'Salvar alterações'
          ) : (
            'Criar diário'
          )}
        </Button>
      </div>
    </form>
  );
}
