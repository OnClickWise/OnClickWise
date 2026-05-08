"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  XCircle,
  X,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BankStatement,
  BankStatementLine,
  ImportStatementDTO,
  MatchSuggestion,
  ReconcileDecision,
  reconciliationService,
} from "@/services/fxService";
import { BankAccount, treasuryService } from "@/services/treasuryService";

const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  uploaded: "bg-amber-100 text-amber-700",
  reconciled: "bg-emerald-100 text-emerald-700",
  approved: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  uploaded: "Importado",
  reconciled: "Reconciliado",
  approved: "Aprovado",
};

export default function ReconciliationPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";

  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const [stmts, accs] = await Promise.all([
        reconciliationService.listStatements(undefined, abortRef.current.signal),
        treasuryService.listAccounts(undefined, abortRef.current.signal),
      ]);
      setStatements(stmts);
      setAccounts(accs);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Finanças</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Reconciliação Bancária</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-violet-600" />
                    Reconciliação Bancária
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Importe extratos bancários e concilie com os movimentos do sistema. O matching automático sugere
                    correspondências por valor + data.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                  <Button
                    onClick={() => setImportOpen(true)}
                    disabled={accounts.filter((a) => a.is_active).length === 0}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Importar Extrato
                  </Button>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">{error}</div>
                <button onClick={() => setError(null)} className="text-amber-700 hover:text-amber-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Extratos importados ({statements.length})
                </h2>
              </div>
              {loading && statements.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </div>
              ) : statements.length === 0 ? (
                <div className="py-16 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Nenhum extrato importado</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Importe um extrato bancário para iniciar a reconciliação.
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-left">Conta</th>
                      <th className="px-4 py-3 text-left">Período</th>
                      <th className="px-4 py-3 text-right">Saldo final</th>
                      <th className="px-4 py-3 text-center">Linhas</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {statements.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-slate-500">{s.bank_code}</p>
                          <p className="font-medium text-slate-900 dark:text-white">{s.bank_name}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {new Date(s.start_date).toLocaleDateString("pt-BR")}
                          {" → "}
                          {new Date(s.end_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                          {Number(s.closing_balance).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {s.lines_reconciled ?? 0} / {s.lines_total ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status]}`}>
                            {STATUS_LABEL[s.status] ?? s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setSelectedStatement(s)}
                              className="px-3 py-1.5 rounded text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50"
                            >
                              Reconciliar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {importOpen && (
        <ModalShell title="Importar Extrato Bancário" onClose={() => setImportOpen(false)} maxWidth="max-w-3xl">
          <ImportForm
            accounts={accounts}
            onCancel={() => setImportOpen(false)}
            onSuccess={async () => {
              setImportOpen(false);
              await load();
            }}
          />
        </ModalShell>
      )}

      {selectedStatement && (
        <ReconcileModal
          statement={selectedStatement}
          onClose={() => setSelectedStatement(null)}
          onReconciled={async () => {
            setSelectedStatement(null);
            await load();
          }}
        />
      )}
    </AuthGuard>
  );
}

/* ─── Sub: Form de importação ───────────────────────────────────────── */

function ImportForm({
  accounts,
  onCancel,
  onSuccess,
}: {
  accounts: BankAccount[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const activeAccounts = accounts.filter((a) => a.is_active);
  const [bankAccountId, setBankAccountId] = useState(activeAccounts[0]?.id ?? "");
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [lines, setLines] = useState<ImportStatementDTO["lines"]>([
    { transactionDate: firstDay, amount: 0, transactionType: "credit", description: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setLine(idx: number, patch: Partial<ImportStatementDTO["lines"][number]>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { transactionDate: startDate, amount: 0, transactionType: "credit", description: "" },
    ]);
  }

  function removeLine(idx: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  const totalSum = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const expectedClosing = openingBalance + totalSum;
  const balanced = Math.abs(expectedClosing - closingBalance) < 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!bankAccountId) throw new Error("Selecione a conta bancária");
      if (lines.length === 0) throw new Error("Adicione ao menos 1 linha");
      for (const l of lines) {
        if (!l.description?.trim()) throw new Error("Todas as linhas precisam de descrição");
        if (Number(l.amount) === 0) throw new Error("Valor da linha não pode ser zero");
      }
      if (!balanced) {
        throw new Error(
          `Saldo inicial + linhas = ${expectedClosing.toFixed(2)} ≠ saldo final ${closingBalance.toFixed(2)}`,
        );
      }
      await reconciliationService.importStatement({
        bankAccountId,
        startDate,
        endDate,
        openingBalance,
        closingBalance,
        sourceType: "manual",
        lines,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar extrato");
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

      <div>
        <label className={labelCls}>Conta Bancária *</label>
        <Select value={bankAccountId} onValueChange={setBankAccountId} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar conta..." />
          </SelectTrigger>
          <SelectContent>
            {activeAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.bank_code} · {a.bank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Período Inicial *</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
        </div>
        <div>
          <label className={labelCls}>Período Final *</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Saldo Inicial *</label>
          <Input
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
        </div>
        <div>
          <label className={labelCls}>Saldo Final *</label>
          <Input
            type="number"
            step="0.01"
            value={closingBalance}
            onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
        </div>
      </div>

      {/* Linhas */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_110px_120px_40px] items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
          <div>Data</div>
          <div>Descrição</div>
          <div>Tipo</div>
          <div className="text-right">Valor (±)</div>
          <div />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[110px_1fr_110px_120px_40px] items-center gap-2 px-3 py-2"
            >
              <Input
                type="date"
                value={line.transactionDate}
                onChange={(e) => setLine(idx, { transactionDate: e.target.value })}
                className="h-8 text-xs"
                disabled={loading}
              />
              <Input
                value={line.description}
                onChange={(e) => setLine(idx, { description: e.target.value })}
                placeholder="Ex.: TED recebido..."
                className="h-8 text-sm"
                disabled={loading}
              />
              <Input
                value={line.transactionType}
                onChange={(e) => setLine(idx, { transactionType: e.target.value })}
                placeholder="credit"
                className="h-8 text-xs"
                disabled={loading}
              />
              <Input
                type="number"
                step="0.01"
                value={line.amount}
                onChange={(e) => setLine(idx, { amount: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.currentTarget.select()}
                placeholder="±0,00"
                className="h-8 text-right tabular-nums text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => removeLine(idx)}
                disabled={loading || lines.length <= 1}
                className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700 text-sm">
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300 hover:underline"
          >
            <Plus className="w-3 h-3" /> Linha
          </button>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Soma das linhas: <strong className="tabular-nums">{totalSum.toFixed(2)}</strong>
            </span>
            <span className="text-slate-500">
              Saldo final esperado: <strong className="tabular-nums">{expectedClosing.toFixed(2)}</strong>
            </span>
            <span className={`font-semibold ${balanced ? "text-emerald-600" : "text-rose-600"}`}>
              {balanced ? "✓ Balanceado" : "✗ Não balanceado"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !balanced}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            "Importar Extrato"
          )}
        </Button>
      </div>
    </form>
  );
}

/* ─── Sub: Modal de reconciliação linha-a-linha ──────────────────────── */

interface DecisionState {
  matchStatus: ReconcileDecision["matchStatus"];
  matchedTransactionId?: string;
}

function ReconcileModal({
  statement,
  onClose,
  onReconciled,
}: {
  statement: BankStatement;
  onClose: () => void;
  onReconciled: () => void;
}) {
  const [lines, setLines] = useState<BankStatementLine[]>([]);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      reconciliationService.getStatement(statement.id),
      reconciliationService.suggestMatches(statement.id),
    ])
      .then(([detail, suggs]) => {
        if (cancelled) return;
        setLines(detail.lines);
        setSuggestions(suggs);

        // Pré-preenche decisões com sugestões "exact".
        const init: Record<string, DecisionState> = {};
        for (const line of detail.lines) {
          const sug = suggs.find((s) => s.statementLineId === line.id);
          if (line.is_reconciled) {
            init[line.id] = {
              matchStatus: "matched",
              matchedTransactionId: line.matched_transaction_id ?? undefined,
            };
          } else if (sug?.matchType === "exact" && sug.candidateTransactionId) {
            init[line.id] = {
              matchStatus: "matched",
              matchedTransactionId: sug.candidateTransactionId,
            };
          } else {
            init[line.id] = { matchStatus: "pending" };
          }
        }
        setDecisions(init);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar extrato");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statement.id]);

  function setDecision(lineId: string, patch: Partial<DecisionState>) {
    setDecisions((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const list: ReconcileDecision[] = lines.map((line) => ({
        statementLineId: line.id,
        matchStatus: decisions[line.id]?.matchStatus ?? "pending",
        matchedTransactionId: decisions[line.id]?.matchedTransactionId,
      }));
      await reconciliationService.reconcile(statement.id, list);
      onReconciled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reconciliar");
    } finally {
      setSaving(false);
    }
  }

  const summary = (() => {
    const counts = { matched: 0, pending: 0, discrepancy: 0, unmatched: 0 };
    for (const id of Object.keys(decisions)) {
      counts[decisions[id].matchStatus]++;
    }
    return counts;
  })();

  return (
    <ModalShell
      title={`Reconciliar — ${statement.bank_name} (${new Date(statement.start_date).toLocaleDateString("pt-BR")} → ${new Date(statement.end_date).toLocaleDateString("pt-BR")})`}
      onClose={onClose}
      maxWidth="max-w-5xl"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando linhas e sugestões...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <SummaryStat icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" label="Matched" value={summary.matched} />
            <SummaryStat icon={<Clock className="w-4 h-4" />} color="amber" label="Pendente" value={summary.pending} />
            <SummaryStat icon={<TriangleAlert className="w-4 h-4" />} color="orange" label="Discrepância" value={summary.discrepancy} />
            <SummaryStat icon={<XCircle className="w-4 h-4" />} color="rose" label="Sem match" value={summary.unmatched} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Descrição</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-left">Sugestão</th>
                  <th className="px-3 py-2 text-left">Decisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.map((line) => {
                  const sug = suggestions.find((s) => s.statementLineId === line.id);
                  const dec = decisions[line.id];
                  return (
                    <tr key={line.id}>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {new Date(line.transaction_date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                        {line.description}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${Number(line.amount) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {Number(line.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {sug?.candidateTransactionId ? (
                          <div>
                            <span
                              className={`text-[10px] uppercase font-bold ${
                                sug.matchType === "exact" ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {sug.matchType === "exact" ? "Match exato" : "Mesmo valor"}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {sug.candidateDescription}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sem sugestão</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={dec?.matchStatus ?? "pending"}
                          onValueChange={(v) =>
                            setDecision(line.id, {
                              matchStatus: v as ReconcileDecision["matchStatus"],
                              matchedTransactionId:
                                v === "matched" ? sug?.candidateTransactionId ?? undefined : undefined,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="matched" disabled={!sug?.candidateTransactionId}>
                              ✓ Matched
                            </SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="discrepancy">Discrepância</SelectItem>
                            <SelectItem value="unmatched">Sem match</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
              Fechar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Reconciliação"
              )}
            </Button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

function SummaryStat({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: "emerald" | "amber" | "orange" | "rose";
  label: string;
  value: number;
}) {
  const cls = {
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
  }[color];
  return (
    <div className={`rounded-lg p-3 flex items-center gap-2 ${cls}`}>
      {icon}
      <div>
        <p className="text-[10px] uppercase tracking-wide font-semibold opacity-80">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
