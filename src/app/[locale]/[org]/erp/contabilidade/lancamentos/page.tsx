"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useApi } from "@/hooks/useApi";
import {
  BookOpen,
  RefreshCw,
  TriangleAlert,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import JournalEntryForm from "@/components/financeiro/JournalEntryForm";
import { Button } from "@/components/ui/button";

type JournalEntryLine = {
  id: string;
  line_type: "debit" | "credit";
  amount: string;
  memo: string | null;
  account_code: string;
  account_name: string;
  account_type: string;
};

type JournalEntry = {
  id: string;
  description: string;
  status: "posted" | "reversed";
  entry_date: string;
  reference_type: string | null;
  reference_id: string | null;
  reversal_of_entry_id: string | null;
  created_at: string;
  lines?: JournalEntryLine[];
};

const statusConfig = {
  posted: { label: "Postado", className: "bg-emerald-50 text-emerald-700" },
  reversed: { label: "Estornado", className: "bg-rose-50 text-rose-700" },
};

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function EntryRow({ entry, onExpand }: { entry: JournalEntry; onExpand: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[entry.status] ?? statusConfig.posted;
  const totalDebit = (entry.lines ?? [])
    .filter((l) => l.line_type === "debit")
    .reduce((s, l) => s + Number(l.amount), 0);

  const handleToggle = () => {
    if (!open && !entry.lines) onExpand(entry.id);
    setOpen((v) => !v);
  };

  return (
    <>
      <tr
        className="text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
        onClick={handleToggle}
      >
        <td className="py-3 pr-4 pl-2">
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </td>
        <td className="py-3 pr-4">{formatDate(entry.entry_date)}</td>
        <td className="py-3 pr-4 font-medium max-w-xs truncate">{entry.description}</td>
        <td className="py-3 pr-4">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}>
            {entry.status === "posted" ? <CheckCircle2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
            {cfg.label}
          </span>
        </td>
        <td className="py-3 pr-4 text-right font-medium tabular-nums">{formatCurrency(totalDebit)}</td>
        <td className="py-3 pr-4 text-slate-400 text-xs">{entry.reference_type ?? "—"}</td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} className="px-2 pb-3">
            <div className="ml-6 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {!entry.lines ? (
                <div className="p-4 text-sm text-slate-500">Carregando linhas...</div>
              ) : entry.lines.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Sem linhas.</div>
              ) : (
                <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 px-4 text-left">Conta</th>
                      <th className="py-2 px-4 text-left">Nome</th>
                      <th className="py-2 px-4 text-left">Memo</th>
                      <th className="py-2 px-4 text-right">Débito</th>
                      <th className="py-2 px-4 text-right">Crédito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                    {entry.lines.map((line) => (
                      <tr key={line.id} className="text-slate-700 dark:text-slate-200">
                        <td className="py-2 px-4 font-medium">{line.account_code}</td>
                        <td className="py-2 px-4">{line.account_name}</td>
                        <td className="py-2 px-4 text-slate-500">{line.memo ?? "—"}</td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {line.line_type === "debit" ? formatCurrency(line.amount) : ""}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {line.line_type === "credit" ? formatCurrency(line.amount) : ""}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-slate-800/40 font-semibold text-slate-700 dark:text-slate-200">
                      <td colSpan={3} className="py-2 px-4 text-right text-xs uppercase tracking-wide text-slate-500">Total</td>
                      <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(totalDebit)}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(totalDebit)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function LancamentosPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall, isClient } = useApi();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: "100", startDate, endDate });
      if (statusFilter) params.append("status", statusFilter);
      const res = await apiCall(`/accounting/journal-entries?${params}`, { method: "GET" });
      if (!res.success) throw new Error(res.error || "Falha ao carregar lançamentos");
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [apiCall, startDate, endDate, statusFilter]);

  useEffect(() => {
    if (isClient) load();
  }, [isClient, load]);

  const expandEntry = useCallback(
    async (id: string) => {
      const res = await apiCall(`/accounting/journal-entries/${id}`, { method: "GET" });
      if (!res.success) return;
      const full = res.data ?? res;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, lines: full.lines ?? [] } : e))
      );
    },
    [apiCall]
  );

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Lançamentos</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    Lançamentos Contábeis
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">Partidas dobradas registradas no período.</p>
                </div>
                <div className="flex flex-wrap gap-3 sm:ml-auto">
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Novo Lançamento
                  </Button>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">De</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Até</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">Todos</option>
                      <option value="posted">Postado</option>
                      <option value="reversed">Estornado</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={load}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      Filtrar
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              {loading ? (
                <div className="py-10 text-center text-sm text-slate-500">Carregando lançamentos...</div>
              ) : error ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
                  <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Não foi possível carregar os lançamentos</div>
                    <div className="text-sm mt-1">{error}</div>
                  </div>
                </div>
              ) : entries.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Nenhum lançamento encontrado no período.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 pl-2 pr-4 w-8" />
                        <th className="py-3 pr-4">Data</th>
                        <th className="py-3 pr-4">Descrição</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4 text-right">Valor</th>
                        <th className="py-3 pr-4">Referência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {entries.map((entry) => (
                        <EntryRow key={entry.id} entry={entry} onExpand={expandEntry} />
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-xs text-slate-400 text-right">{entries.length} lançamento(s)</div>
                </div>
              )}
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Novo Lançamento Contábil</h2>
              <button
                onClick={() => setCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <JournalEntryForm
                onCancel={() => setCreateOpen(false)}
                onSuccess={async () => {
                  setCreateOpen(false);
                  await load();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
