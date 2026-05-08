"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useApi } from "@/hooks/useApi";
import { BookOpen, Search, TriangleAlert, TrendingUp, TrendingDown } from "lucide-react";

type Movement = {
  date: string;
  journal_entry_id: string;
  description: string;
  memo: string | null;
  debit: number;
  credit: number;
  running_balance: number;
};

type AccountRazao = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  total_debit: number;
  total_credit: number;
  balance: number;
  movements: Movement[];
};

type ChartAccount = { id: string; code: string; name: string };

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

const accountTypeLabel: Record<string, string> = {
  asset: "Ativo", liability: "Passivo", equity: "Patrimônio", revenue: "Receita", expense: "Despesa",
};

export default function LivroRazaoPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall, isClient } = useApi();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [data, setData] = useState<AccountRazao[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    apiCall("/accounting/chart-of-accounts?limit=200&isActive=true", { method: "GET" }).then((res) => {
      if (res.success) setAccounts(Array.isArray(res.data) ? res.data : []);
    });
  }, [apiCall, isClient]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({ startDate, endDate, limit: "1000" });
      if (accountId) qs.append("accountId", accountId);
      const res = await apiCall(`/accounting/reports/livro-razao?${qs}`, { method: "GET" });
      if (!res.success) throw new Error(res.error || "Falha ao gerar relatório");
      const payload = res.data ?? res;
      setData(payload.accounts ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [apiCall, startDate, endDate, accountId]);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Livro Razão</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <BookOpen className="w-6 h-6 text-violet-600" />
                Livro Razão
              </h1>
              <p className="text-sm text-slate-500 mb-5">Movimentos por conta com saldo acumulado.</p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Data inicial</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Data final</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Conta (opcional)</label>
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 min-w-[220px]">
                    <option value="">Todas as contas</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={load} disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                  <Search className="w-4 h-4" />
                  {loading ? "Gerando..." : "Gerar"}
                </button>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div><div className="font-semibold">Erro ao gerar relatório</div><div className="text-sm mt-1">{error}</div></div>
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
                Selecione o período e clique em Gerar para visualizar o Livro Razão.
              </div>
            )}

            {data && data.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-400">
                Nenhum movimento encontrado no período.
              </div>
            )}

            {data && data.map((acc) => (
              <section key={acc.account_id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Cabeçalho da conta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{acc.account_code}</span>
                      <span className="text-slate-600 dark:text-slate-300">{acc.account_name}</span>
                      <span className="text-xs rounded-full px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {accountTypeLabel[acc.account_type] ?? acc.account_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Saldo normal: {acc.normal_balance === "debit" ? "Devedor" : "Credor"}</div>
                  </div>
                  <div className="flex gap-6 text-sm shrink-0">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Total Débitos</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(acc.total_debit)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Total Créditos</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(acc.total_credit)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Saldo</div>
                      <div className={`font-bold tabular-nums flex items-center gap-1 ${acc.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {acc.balance >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {formatCurrency(Math.abs(acc.balance))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Movimentos */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-700">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2 px-5 text-left">Data</th>
                        <th className="py-2 px-4 text-left">Histórico</th>
                        <th className="py-2 px-4 text-left">Memo</th>
                        <th className="py-2 px-4 text-right">Débito</th>
                        <th className="py-2 px-4 text-right">Crédito</th>
                        <th className="py-2 px-4 text-right">Saldo Acum.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {acc.movements.map((mov, i) => (
                        <tr key={i} className="text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-5 whitespace-nowrap">{formatDate(mov.date)}</td>
                          <td className="py-2 px-4 max-w-xs truncate">{mov.description}</td>
                          <td className="py-2 px-4 text-slate-400">{mov.memo ?? "—"}</td>
                          <td className="py-2 px-4 text-right tabular-nums">{mov.debit ? formatCurrency(mov.debit) : ""}</td>
                          <td className="py-2 px-4 text-right tabular-nums">{mov.credit ? formatCurrency(mov.credit) : ""}</td>
                          <td className={`py-2 px-4 text-right tabular-nums font-medium ${mov.running_balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatCurrency(mov.running_balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
