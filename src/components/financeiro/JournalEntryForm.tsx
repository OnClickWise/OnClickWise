'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { journalsService } from '@/services/journalsService';
import {
  AccountingJournal,
  AccountingJournalDocument,
  ChartOfAccount,
  CreateJournalEntryDTO,
} from '@/types/types';

const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

interface LineDraft {
  id: string; // local id pra re-render
  accountId: string;
  lineType: 'debit' | 'credit';
  amount: number;
  memo?: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyLine(type: 'debit' | 'credit'): LineDraft {
  return { id: genId(), accountId: '', lineType: type, amount: 0 };
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Form para criar lançamento contábil manual com partida dobrada.
 * Inspirado no Primavera (Movimentos): Diário + Documento + Linhas D/C.
 *
 * Regras:
 *  - Mín. 2 linhas, pelo menos 1 débito e 1 crédito.
 *  - Soma de débitos = soma de créditos antes de habilitar submit.
 *  - Diário e Documento são opcionais; se Diário escolhido, recebe numeração sequencial.
 *  - Conta default do Documento pré-preenche linhas vazias quando o usuário seleciona o documento.
 */
export default function JournalEntryForm({ onSuccess, onCancel }: Props) {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [documents, setDocuments] = useState<AccountingJournalDocument[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [journalId, setJournalId] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [lines, setLines] = useState<LineDraft[]>([emptyLine('debit'), emptyLine('credit')]);

  // Carrega contas + diários ativos
  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    setLoadingMeta(true);
    Promise.all([financeService.listChartOfAccounts(), journalsService.list({ isActive: true }, ctrl.signal)])
      .then(([accs, jrs]) => {
        if (cancelled) return;
        setAccounts(accs.filter((a) => a.allows_posting && a.is_active));
        setJournals(jrs);
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      })
      .finally(() => {
        if (!cancelled) setLoadingMeta(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  // Quando trocar de diário, carrega documentos vinculados
  useEffect(() => {
    if (!journalId) {
      setDocuments([]);
      setDocumentId('');
      return;
    }
    const ctrl = new AbortController();
    let cancelled = false;
    journalsService
      .listDocuments(journalId, ctrl.signal)
      .then((docs) => {
        if (cancelled) return;
        setDocuments(docs.filter((d) => d.is_active));
        setDocumentId('');
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar documentos');
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [journalId]);

  // Quando trocar de documento, sugerir contas-padrão em linhas vazias
  useEffect(() => {
    if (!documentId) return;
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    setLines((prev) => {
      const next = [...prev];
      // Linha de débito vazia → conta padrão D
      if (doc.default_debit_account_id) {
        const debIdx = next.findIndex((l) => l.lineType === 'debit' && !l.accountId);
        if (debIdx >= 0) next[debIdx] = { ...next[debIdx], accountId: doc.default_debit_account_id };
      }
      // Linha de crédito vazia → conta padrão C
      if (doc.default_credit_account_id) {
        const credIdx = next.findIndex((l) => l.lineType === 'credit' && !l.accountId);
        if (credIdx >= 0) next[credIdx] = { ...next[credIdx], accountId: doc.default_credit_account_id };
      }
      return next;
    });
  }, [documentId, documents]);

  const totals = useMemo(() => {
    const debit = lines.filter((l) => l.lineType === 'debit').reduce((s, l) => s + Number(l.amount || 0), 0);
    const credit = lines.filter((l) => l.lineType === 'credit').reduce((s, l) => s + Number(l.amount || 0), 0);
    return {
      debit,
      credit,
      diff: debit - credit,
      balanced: debit > 0 && Math.abs(debit - credit) < 0.001,
    };
  }, [lines]);

  function setLine<K extends keyof LineDraft>(id: string, key: K, value: LineDraft[K]) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  }

  function addLine(type: 'debit' | 'credit') {
    setLines((prev) => [...prev, emptyLine(type)]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.id !== id) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!description.trim()) throw new Error('Descrição é obrigatória');
      if (lines.length < 2) throw new Error('Mínimo de 2 linhas (1 débito + 1 crédito)');
      const hasD = lines.some((l) => l.lineType === 'debit');
      const hasC = lines.some((l) => l.lineType === 'credit');
      if (!hasD || !hasC) throw new Error('É preciso ao menos 1 débito e 1 crédito');

      for (const l of lines) {
        if (!l.accountId) throw new Error('Todas as linhas devem ter uma conta selecionada');
        if (!l.amount || l.amount <= 0) throw new Error('Todas as linhas devem ter valor maior que zero');
      }
      if (!totals.balanced) {
        throw new Error(
          `Lançamento desbalanceado: D=${totals.debit.toFixed(2)} ≠ C=${totals.credit.toFixed(2)}`,
        );
      }

      const payload: CreateJournalEntryDTO & { journalId?: string; documentId?: string } = {
        description: description.trim(),
        entry_date: new Date(entryDate).toISOString(),
        lines: lines.map((l) => ({
          account_id: l.accountId,
          line_type: l.lineType,
          amount: l.amount,
          memo: l.memo?.trim() || undefined,
        })),
        ...(journalId ? { journalId } : {}),
        ...(documentId ? { documentId } : {}),
      };

      // financeService.createJournalEntry usa snake_case no body, mas o backend
      // espera camelCase (accountId/lineType/journalId). Por isso aqui usamos fetch direto.
      const { getApiBaseUrl } = await import('@/lib/api-url');
      const { getAuthToken } = await import('@/lib/cookies');
      const res = await fetch(`${getApiBaseUrl()}/accounting/journal-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          description: payload.description,
          entryDate: payload.entry_date,
          journalId: payload.journalId,
          documentId: payload.documentId,
          lines: payload.lines.map((l) => ({
            accountId: l.account_id,
            lineType: l.line_type,
            amount: l.amount,
            memo: l.memo,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = Array.isArray(body.message) ? body.message.join('; ') : body.message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lançamento');
    } finally {
      setLoading(false);
    }
  }

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando contas e diários...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
        Nenhuma conta analítica disponível. Crie ou importe um plano de contas antes de lançar movimentos.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className={labelCls}>Descrição *</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Pagamento de aluguel · Compra de mercadoria..."
            disabled={loading}
            maxLength={1000}
          />
        </div>
        <div>
          <label className={labelCls}>Data *</label>
          <Input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Diário (opcional)</label>
          <Select value={journalId || '_none'} onValueChange={(v) => setJournalId(v === '_none' ? '' : v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Sem diário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Sem diário —</SelectItem>
              {journals.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.code} · {j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelCls}>Documento (opcional)</label>
          <Select
            value={documentId || '_none'}
            onValueChange={(v) => setDocumentId(v === '_none' ? '' : v)}
            disabled={loading || !journalId}
          >
            <SelectTrigger>
              <SelectValue placeholder={journalId ? 'Sem documento' : 'Escolha um diário primeiro'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Sem documento —</SelectItem>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.code} · {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linhas */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_120px_1fr_40px] items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
          <div>Tipo</div>
          <div>Conta</div>
          <div className="text-right">Valor</div>
          <div>Memo</div>
          <div />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-[40px_1fr_120px_1fr_40px] items-center gap-2 px-3 py-2"
            >
              <span
                className={`text-[10px] font-bold rounded px-1.5 py-0.5 text-center ${
                  line.lineType === 'debit'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {line.lineType === 'debit' ? 'D' : 'C'}
              </span>
              <Select
                value={line.accountId}
                onValueChange={(v) => setLine(line.id, 'accountId', v)}
                disabled={loading}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Selecionar conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="font-mono text-[11px] mr-1">{a.code}</span> {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={line.amount}
                onChange={(e) => setLine(line.id, 'amount', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.currentTarget.select()}
                disabled={loading}
                className="h-8 text-right tabular-nums text-sm"
              />
              <Input
                value={line.memo ?? ''}
                onChange={(e) => setLine(line.id, 'memo', e.target.value)}
                placeholder="Histórico..."
                disabled={loading}
                className="h-8 text-sm"
                maxLength={500}
              />
              <button
                type="button"
                title="Remover linha"
                onClick={() => removeLine(line.id)}
                disabled={loading || lines.length <= 2}
                className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700 text-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addLine('debit')}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              <Plus className="w-3 h-3" /> Débito
            </button>
            <button
              type="button"
              onClick={() => addLine('credit')}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300 hover:underline"
            >
              <Plus className="w-3 h-3" /> Crédito
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">
              D:{' '}
              <strong className="text-slate-900 dark:text-white tabular-nums">
                {totals.debit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <span className="text-slate-500">
              C:{' '}
              <strong className="text-slate-900 dark:text-white tabular-nums">
                {totals.credit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <span
              className={`font-semibold ${
                totals.balanced ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totals.balanced ? '✓ Balanceado' : `✗ Diferença ${totals.diff.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !totals.balanced}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Postando...
            </>
          ) : (
            'Postar Lançamento'
          )}
        </Button>
      </div>
    </form>
  );
}
