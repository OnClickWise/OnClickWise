"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useApi } from "@/hooks/useApi";
import {
  BookOpen, Search, RefreshCw, TriangleAlert, Loader2,
  ChevronRight, ChevronDown, Database, Download,
} from "lucide-react";
import { exportsService } from "@/services/exportsService";

type ChartAccount = {
  id: string;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_balance: "debit" | "credit";
  level: number;
  is_active: boolean;
  allows_posting: boolean;
  parent_id: string | null;
};

const TYPE_CONFIG: Record<ChartAccount["account_type"], { label: string; color: string; badge: string }> = {
  asset:     { label: "Ativo",               color: "text-blue-700 dark:text-blue-400",    badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  liability: { label: "Passivo",             color: "text-orange-700 dark:text-orange-400", badge: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  equity:    { label: "Patrimônio Líquido",  color: "text-purple-700 dark:text-purple-400", badge: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  revenue:   { label: "Receita",             color: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  expense:   { label: "Despesa",             color: "text-rose-700 dark:text-rose-400",    badge: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
};

const TYPE_ORDER: ChartAccount["account_type"][] = ["asset", "liability", "equity", "revenue", "expense"];

const TEMPLATE_OPTIONS: Array<{
  value: "angola" | "brazil" | "portugal" | "spain" | "france" | "us";
  title: string;
  flag: string;
  description: string;
}> = [
  {
    value: "angola",
    flag: "🇦🇴",
    title: "PGC Angola",
    description: "Plano Geral de Contabilidade angolano. Classes 1–8 (Imob., Existências, Terceiros, Meios, Capital, Proveitos, Custos, Resultados).",
  },
  {
    value: "portugal",
    flag: "🇵🇹",
    title: "SNC Portugal",
    description: "Sistema de Normalização Contabilística português. Classes 1–8 com IVA Suportado/Liquidado.",
  },
  {
    value: "brazil",
    flag: "🇧🇷",
    title: "NBC TG Brasil",
    description: "Padrão CFC brasileiro. 1–5 (Ativo, Passivo, PL, Receitas, Despesas) com 4 níveis hierárquicos.",
  },
  {
    value: "spain",
    flag: "🇪🇸",
    title: "PGC España",
    description: "Plan General de Contabilidad. Grupos 1–7 (Financiación, No Corriente, Existencias, Acreedores, Financieras, Compras, Ventas).",
  },
  {
    value: "france",
    flag: "🇫🇷",
    title: "PCG France",
    description: "Plan Comptable Général. Classes 1–7 incluindo TVA Déductible/Collectée e contas Sécurité Sociale.",
  },
  {
    value: "us",
    flag: "🇺🇸",
    title: "US Standard",
    description: "Standard Chart of Accounts (US GAAP-compatible). Estrutura 1000–8999 (Assets, Liab., Equity, Revenue, COGS, OpEx).",
  },
];

export default function PlanoDeContasPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const { apiCall, isClient } = useApi();

  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(false);
  const [seedTemplate, setSeedTemplate] = useState<
    "angola" | "brazil" | "portugal" | "spain" | "france" | "us"
  >("angola");

  // Guard de race condition: ignora resposta de fetch anterior se o componente
  // foi remontado ou load() foi chamado novamente.
  const requestSeqRef = useRef(0);

  const load = useCallback(async () => {
    const myReq = ++requestSeqRef.current;
    try {
      setLoading(true);
      setError(null);
      const res = await apiCall<ChartAccount[]>("/accounting/chart-of-accounts?limit=500", { method: "GET" });
      if (myReq !== requestSeqRef.current) return; // descarta resultado obsoleto
      if (!res.success) throw new Error(res.error || "Falha ao carregar plano de contas");
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      if (myReq !== requestSeqRef.current) return;
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      if (myReq === requestSeqRef.current) setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    if (isClient) load();
    // Cleanup: bumpa o seq pra invalidar qualquer fetch em voo.
    return () => {
      requestSeqRef.current++;
    };
  }, [load, isClient]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setError(null);
      const res = await apiCall("/accounting/seed/chart-of-accounts", {
        method: "POST",
        body: JSON.stringify({ template: seedTemplate }),
      });
      if (!res.success) throw new Error(res.error || "Falha ao inicializar plano de contas");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao inicializar");
    } finally {
      setSeeding(false);
    }
  };

  const filtered = useMemo(() => {
    let list = accounts;
    if (!showInactive) list = list.filter((a) => a.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    return list;
  }, [accounts, search, showInactive]);

  const grouped = useMemo(() => {
    const map = new Map<ChartAccount["account_type"], ChartAccount[]>();
    for (const type of TYPE_ORDER) map.set(type, []);
    for (const acc of filtered) {
      map.get(acc.account_type)?.push(acc);
    }
    return map;
  }, [filtered]);

  const summary = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((a) => a.is_active).length,
    posting: accounts.filter((a) => a.allows_posting).length,
  }), [accounts]);

  const toggleType = (type: string) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Plano de Contas</span>
          </header>

          <main className="p-6 space-y-6">
            {/* Cabeçalho */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    Plano de Contas
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Estrutura hierárquica de contas contábeis da organização.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {accounts.length > 0 && (
                    <button
                      onClick={() => exportsService.chartOfAccounts().catch((err) => setError(err instanceof Error ? err.message : "Erro ao exportar"))}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4" />
                      Exportar CSV
                    </button>
                  )}
                  <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="mt-5 grid grid-cols-3 gap-4">
                {[
                  { label: "Total de contas", value: summary.total },
                  { label: "Contas ativas", value: summary.active },
                  { label: "Permitem lançamento", value: summary.posting },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{kpi.label}</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
                  </div>
                ))}
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Erro</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            )}

            {/* Conteúdo principal */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Barra de filtros */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código ou nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-slate-300 accent-indigo-600"
                  />
                  Mostrar inativas
                </label>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando plano de contas...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 gap-5 max-w-2xl mx-auto">
                  <Database className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                  <div className="text-center">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Plano de contas vazio</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Escolha um modelo base para inicializar. Você pode editar, adicionar e remover contas depois.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                    {TEMPLATE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeedTemplate(opt.value)}
                        disabled={seeding}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          seedTemplate === opt.value
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        } disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{opt.flag}</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">{opt.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {seeding
                      ? "Inicializando..."
                      : `Inicializar com ${TEMPLATE_OPTIONS.find((t) => t.value === seedTemplate)?.title}`}
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Nenhuma conta encontrada para a busca.</div>
              ) : (
                <div>
                  {TYPE_ORDER.map((type) => {
                    const typeAccounts = grouped.get(type) ?? [];
                    if (typeAccounts.length === 0) return null;
                    const cfg = TYPE_CONFIG[type];
                    const collapsed = collapsedTypes.has(type);

                    return (
                      <div key={type}>
                        {/* Header do grupo */}
                        <button
                          onClick={() => toggleType(type)}
                          className="w-full flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {collapsed
                            ? <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          }
                          <span className={`text-sm font-bold uppercase tracking-wider ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="ml-auto text-xs text-slate-400 font-normal">{typeAccounts.length} conta(s)</span>
                        </button>

                        {/* Linhas das contas */}
                        {!collapsed && (
                          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {typeAccounts.map((acc) => {
                              const indent = Math.max(0, acc.level - 1) * 20;
                              const isParent = !acc.allows_posting;
                              return (
                                <div
                                  key={acc.id}
                                  className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                                    isParent
                                      ? "bg-white dark:bg-slate-900"
                                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                  } ${!acc.is_active ? "opacity-40" : ""}`}
                                  style={{ paddingLeft: `${20 + indent}px` }}
                                >
                                  {/* Código */}
                                  <span className={`font-mono text-xs shrink-0 ${isParent ? "font-bold text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                                    {acc.code}
                                  </span>

                                  {/* Nome */}
                                  <span className={`flex-1 truncate ${isParent ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                                    {acc.name}
                                  </span>

                                  {/* Badges */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`hidden sm:inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                                      {cfg.label}
                                    </span>
                                    <span className="hidden md:inline text-xs text-slate-400 dark:text-slate-500 w-14 text-right">
                                      {acc.normal_balance === "debit" ? "Devedor" : "Credor"}
                                    </span>
                                    {acc.allows_posting ? (
                                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                                        Analítica
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Sintética
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
