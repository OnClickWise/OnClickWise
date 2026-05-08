"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  FileBarChart,
  Loader2,
  Search,
  TriangleAlert,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { exportsService } from "@/services/exportsService";

interface AccountBalance {
  code: string;
  name: string;
  balance: number;
}

interface DreSection {
  label: string;
  accounts: AccountBalance[];
  total: number;
  comparisonTotal?: number;
}

interface DreReport {
  report: string;
  period: { startDate: string; endDate: string };
  comparisonPeriod?: { startDate: string; endDate: string };
  sections: {
    revenue: DreSection;
    expense: DreSection;
  };
  result: {
    netIncome: number;
    comparisonNetIncome?: number;
    variation?: number;
  };
}

function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function DrePage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall } = useApi();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [compareStart, setCompareStart] = useState("");
  const [compareEnd, setCompareEnd] = useState("");
  const [data, setData] = useState<DreReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [exporting, setExporting] = useState(false);

  const seqRef = useRef(0);

  const load = useCallback(async () => {
    const my = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ startDate, endDate });
      if (compareStart && compareEnd) {
        qs.set("comparisonStartDate", compareStart);
        qs.set("comparisonEndDate", compareEnd);
      }
      const res = await apiCall<DreReport>(`/accounting/reports/dre?${qs}`, { method: "GET" });
      if (my !== seqRef.current) return;
      if (!res.success) throw new Error(res.error || "Falha ao gerar DRE");
      setData((res.data ?? (res as unknown)) as DreReport);
      setSearched(true);
    } catch (err) {
      if (my !== seqRef.current) return;
      setError(err instanceof Error ? err.message : "Erro ao gerar DRE");
    } finally {
      if (my === seqRef.current) setLoading(false);
    }
  }, [apiCall, startDate, endDate, compareStart, compareEnd]);

  useEffect(() => {
    return () => {
      seqRef.current++;
    };
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await exportsService.dre(startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">DRE</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <FileBarChart className="w-6 h-6 text-emerald-600" />
                Demonstração de Resultados
              </h1>
              <p className="text-sm text-slate-500 mb-5">
                Receitas, Despesas e Resultado Líquido do período. Suporta comparação com período anterior.
              </p>

              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Período · de</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">até</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="hidden sm:block w-px self-stretch bg-slate-200 dark:bg-slate-700 mx-1" />
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Comparar com · de (opcional)</label>
                  <input
                    type="date"
                    value={compareStart}
                    onChange={(e) => setCompareStart(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">até</label>
                  <input
                    type="date"
                    value={compareEnd}
                    onChange={(e) => setCompareEnd(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <Button
                  onClick={load}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  {loading ? "Gerando..." : "Gerar"}
                </Button>
                {data && (
                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    variant="outline"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                    Exportar CSV
                  </Button>
                )}
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Erro ao gerar DRE</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
                Selecione o período e clique em Gerar.
              </div>
            )}

            {data && (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Período: {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
                  </h2>
                  {data.comparisonPeriod && (
                    <p className="text-xs text-slate-500 mt-1">
                      Comparado com: {formatDate(data.comparisonPeriod.startDate)} —{" "}
                      {formatDate(data.comparisonPeriod.endDate)}
                    </p>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Receitas */}
                  <SectionTable
                    icon={<ArrowDownCircle className="w-5 h-5 text-emerald-600" />}
                    color="emerald"
                    section={data.sections.revenue}
                  />

                  {/* Despesas */}
                  <SectionTable
                    icon={<ArrowUpCircle className="w-5 h-5 text-rose-600" />}
                    color="rose"
                    section={data.sections.expense}
                    invertSign
                  />

                  {/* Resultado */}
                  <div
                    className={`rounded-xl border-2 ${
                      data.result.netIncome >= 0
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-rose-300 bg-rose-50 dark:bg-rose-900/20"
                    } p-5`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300">
                          Resultado Líquido do Período
                        </p>
                        <p
                          className={`text-3xl font-bold mt-1 tabular-nums ${
                            data.result.netIncome >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {formatCurrency(data.result.netIncome)}
                        </p>
                      </div>
                      {typeof data.result.comparisonNetIncome === "number" && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Período anterior</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatCurrency(data.result.comparisonNetIncome)}
                          </p>
                          {typeof data.result.variation === "number" && (
                            <p
                              className={`text-xs font-semibold mt-1 ${
                                data.result.variation >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {data.result.variation >= 0 ? "▲" : "▼"} {formatCurrency(Math.abs(data.result.variation))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

function SectionTable({
  icon,
  color,
  section,
  invertSign = false,
}: {
  icon: React.ReactNode;
  color: "emerald" | "rose";
  section: DreSection;
  invertSign?: boolean;
}) {
  const colorClass = color === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300";
  const bgClass = color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 ${bgClass}`}>
        {icon}
        <h3 className={`font-semibold ${colorClass}`}>{section.label}</h3>
        <span className={`ml-auto font-bold tabular-nums ${colorClass}`}>
          {invertSign ? "−" : ""}
          {formatCurrency(section.total)}
        </span>
        {typeof section.comparisonTotal === "number" && (
          <span className="text-xs text-slate-500 tabular-nums">
            (anterior: {invertSign ? "−" : ""}
            {formatCurrency(section.comparisonTotal)})
          </span>
        )}
      </div>
      {section.accounts.length === 0 ? (
        <div className="px-5 py-3 text-xs text-slate-400 italic">Nenhum lançamento no período.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Conta</th>
              <th className="px-4 py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {section.accounts.map((acc) => (
              <tr key={acc.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-5 py-2 font-mono text-xs text-slate-500">{acc.code}</td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{acc.name}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-900 dark:text-white">
                  {invertSign ? "−" : ""}
                  {formatCurrency(acc.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
