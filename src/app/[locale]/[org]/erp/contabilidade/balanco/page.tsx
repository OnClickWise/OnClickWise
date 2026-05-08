"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Building,
  CheckCircle2,
  Download,
  Loader2,
  Scale,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { exportsService } from "@/services/exportsService";

interface BalanceLine {
  account_id: string;
  code: string;
  name: string;
  account_type: string;
  level: number;
  balance: number;
}

interface BalanceSection {
  label: string;
  accounts: BalanceLine[];
  total: number;
}

interface BalanceReport {
  report: string;
  referenceDate: string;
  sections: {
    asset: BalanceSection;
    liability: BalanceSection;
    equity: BalanceSection;
  };
  netIncome: { label: string; value: number };
  totals: {
    totalAsset: number;
    totalLiabilityPlusEquity: number;
    balanced: boolean;
    difference: number;
  };
}

function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function BalancoPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall } = useApi();

  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<BalanceReport | null>(null);
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
      const qs = new URLSearchParams({ referenceDate });
      const res = await apiCall<BalanceReport>(`/accounting/reports/balanco?${qs}`, { method: "GET" });
      if (my !== seqRef.current) return;
      if (!res.success) throw new Error(res.error || "Falha ao gerar Balanço");
      setData((res.data ?? (res as unknown)) as BalanceReport);
      setSearched(true);
    } catch (err) {
      if (my !== seqRef.current) return;
      setError(err instanceof Error ? err.message : "Erro ao gerar Balanço");
    } finally {
      if (my === seqRef.current) setLoading(false);
    }
  }, [apiCall, referenceDate]);

  useEffect(() => {
    return () => {
      seqRef.current++;
    };
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await exportsService.balanco(referenceDate);
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
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Balanço Patrimonial</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Scale className="w-6 h-6 text-blue-600" />
                Balanço Patrimonial
              </h1>
              <p className="text-sm text-slate-500 mb-5">
                Posição patrimonial na data de referência. Verifica a equação contábil
                Ativo = Passivo + Patrimônio Líquido + Resultado.
              </p>

              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Data de referência</label>
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <Button onClick={load} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Search className="w-4 h-4 mr-1.5" />
                  {loading ? "Gerando..." : "Gerar"}
                </Button>
                {data && (
                  <Button onClick={handleExport} disabled={exporting} variant="outline">
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
                  <div className="font-semibold">Erro ao gerar Balanço</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            )}

            {!searched && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
                Selecione a data de referência e clique em Gerar.
              </div>
            )}

            {data && (
              <>
                {/* Status do balanço */}
                <div
                  className={`rounded-xl border-2 ${
                    data.totals.balanced
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-rose-300 bg-rose-50 dark:bg-rose-900/20"
                  } p-5`}
                >
                  <div className="flex items-center gap-3">
                    {data.totals.balanced ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-rose-600" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-bold ${
                          data.totals.balanced ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {data.totals.balanced ? "Balanço Equilibrado" : "Balanço DESEQUILIBRADO"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Posição em {formatDate(data.referenceDate)} ·{" "}
                        Ativo {formatCurrency(data.totals.totalAsset)} ={" "}
                        Passivo+PL+Resultado {formatCurrency(data.totals.totalLiabilityPlusEquity)}
                        {!data.totals.balanced && (
                          <>
                            {" · "}
                            <span className="font-semibold text-rose-600">
                              Diferença: {formatCurrency(data.totals.difference)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Ativo */}
                  <SectionTable
                    icon={<Building className="w-5 h-5 text-blue-600" />}
                    section={data.sections.asset}
                    color="blue"
                  />
                  {/* Passivo + PL */}
                  <div className="space-y-4">
                    <SectionTable
                      icon={<Building className="w-5 h-5 text-orange-600" />}
                      section={data.sections.liability}
                      color="orange"
                    />
                    <SectionTable
                      icon={<Building className="w-5 h-5 text-violet-600" />}
                      section={data.sections.equity}
                      color="violet"
                    />
                    <div
                      className={`rounded-xl border-2 ${
                        data.netIncome.value >= 0
                          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-rose-300 bg-rose-50 dark:bg-rose-900/20"
                      } p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {data.netIncome.label}
                        </p>
                        <p
                          className={`font-bold text-lg tabular-nums ${
                            data.netIncome.value >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {formatCurrency(data.netIncome.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

function SectionTable({
  icon,
  section,
  color,
}: {
  icon: React.ReactNode;
  section: BalanceSection;
  color: "blue" | "orange" | "violet";
}) {
  const bg = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
    violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300",
  }[color];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 ${bg}`}>
        {icon}
        <h3 className="font-semibold flex-1">{section.label}</h3>
        <span className="font-bold tabular-nums">{formatCurrency(section.total)}</span>
      </div>
      {section.accounts.length === 0 ? (
        <div className="px-5 py-3 text-xs text-slate-400 italic">Sem saldos.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Conta</th>
              <th className="px-4 py-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {section.accounts.map((acc) => {
              const indent = Math.max(0, acc.level - 1) * 12;
              return (
                <tr key={acc.account_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-2 font-mono text-xs text-slate-500">{acc.code}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200" style={{ paddingLeft: `${16 + indent}px` }}>
                    {acc.name}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(acc.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
