"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useApi } from "@/hooks/useApi";
import { Scale, Search, TriangleAlert, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { exportsService } from "@/services/exportsService";

type BalanceteLine = {
  account_id: string;
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  level: number;
  total_debit: number;
  total_credit: number;
  balance: number;
  has_movements: boolean;
};

type BalanceteData = {
  period: { startDate: string; endDate: string };
  lines: BalanceteLine[];
  totals: { total_debit: number; total_credit: number; balanced: boolean };
};

const accountTypeLabel: Record<string, string> = {
  asset: "Ativo", liability: "Passivo", equity: "Patrimônio", revenue: "Receita", expense: "Despesa",
};

const accountTypeBadge: Record<string, string> = {
  asset: "bg-blue-50 text-blue-700",
  liability: "bg-orange-50 text-orange-700",
  equity: "bg-purple-50 text-purple-700",
  revenue: "bg-emerald-50 text-emerald-700",
  expense: "bg-rose-50 text-rose-700",
};

function formatCurrency(v: number) {
  if (v === 0) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function BalancetePage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall } = useApi();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [accountType, setAccountType] = useState("");
  const [onlyWithMovements, setOnlyWithMovements] = useState(false);
  const [data, setData] = useState<BalanceteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportsService.balancete(startDate, endDate, accountType || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({ startDate, endDate });
      if (accountType) qs.append("accountType", accountType);
      if (onlyWithMovements) qs.append("onlyWithMovements", "true");
      const res = await apiCall(`/accounting/reports/balancete?${qs}`, { method: "GET" });
      if (!res.success) throw new Error(res.error || "Falha ao gerar balancete");
      setData(res.data ?? res);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [apiCall, startDate, endDate, accountType, onlyWithMovements]);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Balancete</span>
          </header>

          <main className="p-6 space-y-6">
            {/* Filtros */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Scale className="w-6 h-6 text-amber-600" />
                Balancete de Verificação
              </h1>
              <p className="text-sm text-slate-500 mb-5">
                Saldos devedores e credores de todas as contas no período. O total de débitos deve igualar o total de créditos.
              </p>
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
                  <label className="text-xs text-slate-500">Tipo de conta</label>
                  <select value={accountType} onChange={(e) => setAccountType(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    <option value="">Todos</option>
                    <option value="asset">Ativo</option>
                    <option value="liability">Passivo</option>
                    <option value="equity">Patrimônio Líquido</option>
                    <option value="revenue">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer self-end pb-1.5">
                  <input type="checkbox" checked={onlyWithMovements} onChange={(e) => setOnlyWithMovements(e.target.checked)}
                    className="rounded border-slate-300" />
                  Só com movimentos
                </label>
                <button onClick={load} disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 self-end">
                  <Search className="w-4 h-4" />
                  {loading ? "Gerando..." : "Gerar"}
                </button>
                {data && (
                  <button onClick={handleExport} disabled={exporting}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 self-end">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Exportar CSV
                  </button>
                )}
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div><div className="font-semibold">Erro ao gerar balancete</div><div className="text-sm mt-1">{error}</div></div>
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
                Selecione o período e clique em Gerar para visualizar o Balancete.
              </div>
            )}

            {data && (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Cabeçalho do relatório */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      Período: {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{data.lines.length} conta(s)</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${data.totals.balanced ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {data.totals.balanced ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {data.totals.balanced ? "Balancete equilibrado" : "Balancete DESEQUILIBRADO"}
                  </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/60">
                      <tr className="text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 px-6 text-left">Código</th>
                        <th className="py-3 px-4 text-left">Conta</th>
                        <th className="py-3 px-4 text-left">Tipo</th>
                        <th className="py-3 px-4 text-right">Débito</th>
                        <th className="py-3 px-4 text-right">Crédito</th>
                        <th className="py-3 px-4 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {data.lines.map((line) => {
                        const indent = Math.max(0, line.level - 1) * 16;
                        return (
                          <tr
                            key={line.account_id}
                            className={`text-slate-700 dark:text-slate-200 ${line.has_movements ? "" : "opacity-50"} ${line.level === 1 ? "font-semibold bg-slate-50/50 dark:bg-slate-800/20" : ""}`}
                          >
                            <td className="py-2.5 px-6 font-medium whitespace-nowrap">{line.code}</td>
                            <td className="py-2.5 px-4" style={{ paddingLeft: `${indent + 16}px` }}>{line.name}</td>
                            <td className="py-2.5 px-4">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${accountTypeBadge[line.account_type] ?? "bg-slate-100 text-slate-600"}`}>
                                {accountTypeLabel[line.account_type] ?? line.account_type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums">{formatCurrency(line.total_debit)}</td>
                            <td className="py-2.5 px-4 text-right tabular-nums">{formatCurrency(line.total_credit)}</td>
                            <td className={`py-2.5 px-4 text-right tabular-nums font-medium ${line.balance < 0 ? "text-rose-600" : line.balance > 0 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                              {line.balance === 0 ? "—" : formatCurrency(Math.abs(line.balance))}
                              {line.balance < 0 ? " (C)" : line.balance > 0 ? " (D)" : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Totais */}
                    <tfoot className="bg-slate-100 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-600">
                      <tr className="font-bold text-slate-900 dark:text-white text-sm">
                        <td colSpan={3} className="py-3 px-6 uppercase tracking-wide text-slate-600 dark:text-slate-300 text-xs">Total Geral</td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {data.totals.total_debit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {data.totals.total_credit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className={`py-3 px-4 text-right text-xs ${data.totals.balanced ? "text-emerald-600" : "text-rose-600"}`}>
                          {data.totals.balanced ? "✓ Equilibrado" : "✗ Diferença"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
