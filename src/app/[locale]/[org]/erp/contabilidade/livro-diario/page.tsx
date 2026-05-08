"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useApi } from "@/hooks/useApi";
import { BookOpen, Download, Loader2, Search, TriangleAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { exportsService } from "@/services/exportsService";

type Line = {
  id: string;
  line_type: "debit" | "credit";
  amount: string;
  memo: string | null;
  account_code: string;
  account_name: string;
};

type Entry = {
  id: string;
  entry_date: string;
  description: string;
  status: string;
  lines: Line[];
};

type ReportData = {
  period: { startDate: string; endDate: string };
  pagination: { page: number; limit: number; total: number; totalPages: number };
  entries: Entry[];
};

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function LivroDiarioPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall } = useApi();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [data, setData] = useState<ReportData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportsService.journalEntries(startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({ startDate, endDate, page: String(p), limit: "30" });
      const res = await apiCall(`/accounting/reports/livro-diario?${qs}`, { method: "GET" });
      if (!res.success) throw new Error(res.error || "Falha ao gerar relatório");
      setData(res.data ?? res);
      setPage(p);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [apiCall, startDate, endDate]);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Livro Diário</span>
          </header>

          <main className="p-6 space-y-6">
            {/* Filtros */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Livro Diário
              </h1>
              <p className="text-sm text-slate-500 mb-5">
                Registro cronológico de todos os lançamentos contábeis postados no período.
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
                <button onClick={() => load(1)} disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  <Search className="w-4 h-4" />
                  {loading ? "Gerando..." : "Gerar"}
                </button>
                {data && (
                  <button onClick={handleExport} disabled={exporting}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Exportar CSV
                  </button>
                )}
              </div>
            </section>

            {/* Resultado */}
            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div><div className="font-semibold">Erro ao gerar relatório</div><div className="text-sm mt-1">{error}</div></div>
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
                Selecione o período e clique em Gerar para visualizar o Livro Diário.
              </div>
            )}

            {data && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Período: <strong className="text-slate-700 dark:text-slate-200">{formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}</strong>
                    {" · "}{data.pagination.total} lançamento(s)
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button onClick={() => load(page - 1)} disabled={page <= 1 || loading}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>Pág. {data.pagination.page} / {data.pagination.totalPages || 1}</span>
                    <button onClick={() => load(page + 1)} disabled={page >= (data.pagination.totalPages || 1) || loading}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {data.entries.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-400">
                    Nenhum lançamento postado no período.
                  </div>
                ) : (
                  data.entries.map((entry) => {
                    const totalDebit = entry.lines.filter((l) => l.line_type === "debit").reduce((s, l) => s + Number(l.amount), 0);
                    return (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        <div className="flex items-start justify-between gap-4 px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-sm">{entry.description}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{formatDate(entry.entry_date)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(totalDebit)}</div>
                            <div className={`text-xs mt-0.5 ${entry.status === "reversed" ? "text-rose-500" : "text-emerald-600"}`}>
                              {entry.status === "reversed" ? "Estornado" : "Postado"}
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-700">
                            <thead>
                              <tr className="text-xs uppercase tracking-wide text-slate-400">
                                <th className="py-2 px-5 text-left">Conta</th>
                                <th className="py-2 px-4 text-left">Nome</th>
                                <th className="py-2 px-4 text-left">Memo</th>
                                <th className="py-2 px-4 text-right">Débito</th>
                                <th className="py-2 px-4 text-right">Crédito</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {entry.lines.map((line) => (
                                <tr key={line.id} className="text-slate-700 dark:text-slate-200">
                                  <td className="py-2 px-5 font-medium">{line.account_code}</td>
                                  <td className="py-2 px-4">{line.account_name}</td>
                                  <td className="py-2 px-4 text-slate-400">{line.memo ?? "—"}</td>
                                  <td className="py-2 px-4 text-right tabular-nums">
                                    {line.line_type === "debit" ? formatCurrency(line.amount) : ""}
                                  </td>
                                  <td className="py-2 px-4 text-right tabular-nums">
                                    {line.line_type === "credit" ? formatCurrency(line.amount) : ""}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50 dark:bg-slate-800/40 font-semibold">
                                <td colSpan={3} className="py-2 px-5 text-right text-xs uppercase text-slate-400">Total</td>
                                <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(totalDebit)}</td>
                                <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(totalDebit)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
