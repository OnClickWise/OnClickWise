"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRightLeft,
  Calculator,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExchangeRate, exchangeRatesService } from "@/services/fxService";
import CurrencySelect from "@/components/financeiro/CurrencySelect";

const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2";

export default function ExchangeRatesPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";

  const [items, setItems] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ExchangeRate | null>(null);
  const [removing, setRemoving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const data = await exchangeRatesService.list(
        {
          fromCurrency: filterFrom || undefined,
          toCurrency: filterTo || undefined,
          limit: 200,
        },
        abortRef.current.signal,
      );
      setItems(data);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const stats = useMemo(() => {
    const pairs = new Set(items.map((i) => `${i.from_currency}→${i.to_currency}`));
    return { total: items.length, pairs: pairs.size };
  }, [items]);

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await exchangeRatesService.remove(removeTarget.id);
      setRemoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover câmbio");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Finanças</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Câmbios</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-6 h-6 text-amber-600" />
                    Câmbios
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Cotações entre moedas por data. Usado para conversão automática em lançamentos
                    multi-moeda. Lookup por par+data + fallback para taxa anterior ou inversa.
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
                  <Button onClick={() => setFormOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Nova Cotação
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total cotações</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pares cadastrados</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.pairs}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Mais recente</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {items[0] ? new Date(items[0].rate_date).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
            </section>

            <ConverterCard />

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
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">De</span>
                  <div className="w-32">
                    <CurrencySelect value={filterFrom} onChange={setFilterFrom} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Para</span>
                  <div className="w-32">
                    <CurrencySelect value={filterTo} onChange={setFilterTo} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterFrom("");
                    setFilterTo("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Limpar filtros
                </button>
                <span className="text-xs text-slate-400 ml-auto">{items.length} cotação(ões)</span>
              </div>

              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center">
                  <ArrowRightLeft className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Nenhuma cotação cadastrada</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Cadastre cotações entre as moedas que sua organização opera para suportar lançamentos multi-moeda.
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Par</th>
                      <th className="px-4 py-3 text-right">Taxa</th>
                      <th className="px-4 py-3 text-left">Fonte</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(r.rate_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                            {r.from_currency}
                          </span>
                          <ArrowRightLeft className="inline w-3 h-3 mx-1 text-slate-400" />
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                            {r.to_currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                          {Number(r.rate).toLocaleString("pt-BR", { maximumFractionDigits: 6 })}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.source}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              title="Excluir"
                              onClick={() => setRemoveTarget(r)}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {formOpen && (
        <ModalShell title="Nova Cotação" onClose={() => setFormOpen(false)}>
          <CreateRateForm
            onCancel={() => setFormOpen(false)}
            onSuccess={async () => {
              setFormOpen(false);
              await load();
            }}
          />
        </ModalShell>
      )}

      {removeTarget && (
        <ModalShell title="Confirmar exclusão" onClose={() => setRemoveTarget(null)} maxWidth="max-w-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Excluir cotação <strong>{removeTarget.from_currency}→{removeTarget.to_currency}</strong> de{" "}
            {new Date(removeTarget.rate_date).toLocaleDateString("pt-BR")}?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>
              Cancelar
            </Button>
            <Button onClick={confirmRemove} disabled={removing} className="bg-red-600 hover:bg-red-700 text-white">
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </ModalShell>
      )}
    </AuthGuard>
  );
}

/* ─── Sub: Form criar cotação ────────────────────────────────────────── */

function CreateRateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    fromCurrency: "USD",
    toCurrency: "BRL",
    rateDate: new Date().toISOString().slice(0, 10),
    rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (form.fromCurrency === form.toCurrency) {
        throw new Error("Moedas de origem e destino devem ser diferentes");
      }
      if (form.rate <= 0) throw new Error("Taxa deve ser maior que zero");
      await exchangeRatesService.create(form);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cotação");
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>De</label>
          <CurrencySelect
            value={form.fromCurrency}
            onChange={(v) => setForm((p) => ({ ...p, fromCurrency: v }))}
            disabled={loading}
          />
        </div>
        <div>
          <label className={labelCls}>Para</label>
          <CurrencySelect
            value={form.toCurrency}
            onChange={(v) => setForm((p) => ({ ...p, toCurrency: v }))}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data da cotação *</label>
          <Input
            type="date"
            value={form.rateDate}
            onChange={(e) => setForm((p) => ({ ...p, rateDate: e.target.value }))}
            disabled={loading}
          />
        </div>
        <div>
          <label className={labelCls}>Taxa *</label>
          <Input
            type="number"
            step="0.000001"
            min="0"
            value={form.rate}
            onChange={(e) => setForm((p) => ({ ...p, rate: parseFloat(e.target.value) || 0 }))}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            1 {form.fromCurrency} = {form.rate || "?"} {form.toCurrency}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Cotação"
          )}
        </Button>
      </div>
    </form>
  );
}

/* ─── Sub: Conversor inline ──────────────────────────────────────────── */

function ConverterCard() {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BRL");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await exchangeRatesService.convert(amount, from, to, date);
      setResult(
        `${r.amount} ${r.fromCurrency} = ${r.convertedAmount.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} ${r.toCurrency} (taxa ${r.rate.toFixed(6)} de ${new Date(r.rateDate).toLocaleDateString("pt-BR")}${r.rateSource !== "direct" ? ` · ${r.rateSource === "older" ? "anterior" : "inversa"}` : ""})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao converter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-amber-600" />
        Conversor rápido
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Valor</label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">De</label>
          <CurrencySelect value={from} onChange={setFrom} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Para</label>
          <CurrencySelect value={to} onChange={setTo} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Data</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Converter"}
          </Button>
        </div>
      </div>
      {result && (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium">{result}</p>
      )}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </section>
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
