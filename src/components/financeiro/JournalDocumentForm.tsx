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
import { financeService } from '@/services/financeService';
import {
  AccountingJournal,
  AccountingJournalDocument,
  ChartOfAccount,
  CreateJournalDocumentDTO,
} from '@/types/types';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

interface Props {
  journal: AccountingJournal;
  initial?: AccountingJournalDocument | null;
  onSuccess: (doc: AccountingJournalDocument) => void;
  onCancel: () => void;
}

export default function JournalDocumentForm({ journal, initial, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<CreateJournalDocumentDTO>(() => ({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    defaultDebitAccountId: initial?.default_debit_account_id ?? undefined,
    defaultCreditAccountId: initial?.default_credit_account_id ?? undefined,
    allowsRecapitulative: initial?.allows_recapitulative ?? false,
    isActive: initial?.is_active ?? true,
    sortOrder: initial?.sort_order ?? 0,
    description: initial?.description ?? '',
  }));
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      code: initial?.code ?? '',
      name: initial?.name ?? '',
      defaultDebitAccountId: initial?.default_debit_account_id ?? undefined,
      defaultCreditAccountId: initial?.default_credit_account_id ?? undefined,
      allowsRecapitulative: initial?.allows_recapitulative ?? false,
      isActive: initial?.is_active ?? true,
      sortOrder: initial?.sort_order ?? 0,
      description: initial?.description ?? '',
    });
    setError(null);
  }, [initial]);

  // Carrega lista de contas analíticas (allows_posting=true) — só essas podem ser default.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoadingAccounts(true);
    financeService
      .listChartOfAccounts()
      .then((all) => {
        if (cancelled) return;
        setAccounts(all.filter((a) => a.allows_posting && a.is_active));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar plano de contas');
      })
      .finally(() => {
        if (!cancelled) setLoadingAccounts(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const set = <K extends keyof CreateJournalDocumentDTO>(
    key: K,
    value: CreateJournalDocumentDTO[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.code.trim()) throw new Error('Código é obrigatório');
      if (!form.name.trim()) throw new Error('Nome é obrigatório');

      const result =
        isEdit && initial
          ? await journalsService.updateDocument(journal.id, initial.id, form)
          : await journalsService.createDocument(journal.id, form);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar documento');
    } finally {
      setLoading(false);
    }
  }

  const NONE_VALUE = '__none__';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-2 text-sm">
        <span className="text-indigo-700 dark:text-indigo-300">
          Documento do diário <strong>{journal.code} — {journal.name}</strong>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className={labelCls}>Código *</label>
          <Input
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder={`Ex.: ${journal.code}1`}
            maxLength={10}
            disabled={loading}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Nome *</label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex.: Nota Fiscal de Compra"
            maxLength={120}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Conta padrão de Débito</label>
          <Select
            value={form.defaultDebitAccountId ?? NONE_VALUE}
            onValueChange={(v) => set('defaultDebitAccountId', v === NONE_VALUE ? undefined : v)}
            disabled={loading || loadingAccounts}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingAccounts ? 'Carregando...' : 'Nenhuma'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Nenhuma —</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelCls}>Conta padrão de Crédito</label>
          <Select
            value={form.defaultCreditAccountId ?? NONE_VALUE}
            onValueChange={(v) => set('defaultCreditAccountId', v === NONE_VALUE ? undefined : v)}
            disabled={loading || loadingAccounts}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingAccounts ? 'Carregando...' : 'Nenhuma'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Nenhuma —</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          disabled={loading}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => set('isActive', e.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-indigo-600"
          />
          <span className="text-slate-700 dark:text-slate-200">Ativo</span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.allowsRecapitulative ?? false}
            onChange={(e) => set('allowsRecapitulative', e.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-indigo-600"
          />
          <span className="text-slate-700 dark:text-slate-200">Permite recapitulativo</span>
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
            'Criar documento'
          )}
        </Button>
      </div>
    </form>
  );
}
