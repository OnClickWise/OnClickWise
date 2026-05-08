"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  TriangleAlert,
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
  CreateTaxRateDTO,
  COUNTRY_OPTIONS,
  TaxRate,
  TaxType,
  taxRatesService,
} from "@/services/partiesService";

const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1";

const TAX_TYPE_OPTIONS: ReadonlyArray<{ value: TaxType; label: string }> = [
  { value: "vat", label: "IVA / TVA / VAT (universal)" },
  { value: "sales_tax", label: "Sales Tax (US)" },
  { value: "withholding", label: "Retenção na Fonte" },
  { value: "icms", label: "ICMS (BR)" },
  { value: "iss", label: "ISS (BR)" },
  { value: "ipi", label: "IPI (BR)" },
  { value: "pis", label: "PIS (BR)" },
  { value: "cofins", label: "COFINS (BR)" },
  { value: "other", label: "Outro" },
];

const NONE = "__none__";

export default function TaxRatesPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";

  const [items, setItems] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [formOpen, setFormOpen] = useState<{ open: boolean; editing?: TaxRate | null }>({ open: false });
  const [removeTarget, setRemoveTarget] = useState<TaxRate | null>(null);
  const [removing, setRemoving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const data = await taxRatesService.list(
        { isActive: showInactive ? undefined : true },
        abortRef.current.signal,
      );
      setItems(data);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await taxRatesService.remove(removeTarget.id);
      setRemoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
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
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Impostos</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="w-6 h-6 text-emerald-600" />
                    Impostos
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure alíquotas (IVA, ICMS, TVA, Sales Tax, retenções...) aplicáveis em lançamentos e faturas.
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
                    onClick={() => setFormOpen({ open: true, editing: null })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Novo Imposto
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
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-slate-300 accent-emerald-600"
                  />
                  Mostrar inativos
                </label>
                <span className="text-xs text-slate-400 ml-auto">{items.length} imposto(s)</span>
              </div>

              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center">
                  <Percent className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Nenhum imposto cadastrado</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Crie alíquotas (ex.: IVA 14% Angola, ICMS 18% São Paulo, TVA 20% França) para usar em lançamentos.
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-right">Alíquota</th>
                      <th className="px-4 py-3 text-left">País</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((t) => (
                      <tr key={t.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${t.is_active ? "" : "opacity-50"}`}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">
                          {t.code}
                          {t.is_default && (
                            <span title="Padrão deste tipo" className="ml-1 text-yellow-500">
                              <Star className="inline w-3 h-3 fill-yellow-400" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white">{t.name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {taxRatesService.taxTypeLabel(t.tax_type)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                          {Number(t.rate).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-slate-500">{t.country ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              title="Editar"
                              onClick={() => setFormOpen({ open: true, editing: t })}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              title="Excluir"
                              onClick={() => setRemoveTarget(t)}
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

      {formOpen.open && (
        <ModalShell
          title={formOpen.editing ? `Editar ${formOpen.editing.code}` : "Novo Imposto"}
          onClose={() => setFormOpen({ open: false })}
        >
          <TaxRateFormInline
            initial={formOpen.editing ?? null}
            onCancel={() => setFormOpen({ open: false })}
            onSuccess={async () => {
              setFormOpen({ open: false });
              await load();
            }}
          />
        </ModalShell>
      )}

      {removeTarget && (
        <ModalShell title="Confirmar exclusão" onClose={() => setRemoveTarget(null)} maxWidth="max-w-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Excluir o imposto <strong>{removeTarget.code} — {removeTarget.name}</strong>?
            <br />
            Se houver lançamentos usando, será inativado em vez de apagado.
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

/* ─── Subcomponentes ─────────────────────────────────────────────────── */

function TaxRateFormInline({
  initial,
  onCancel,
  onSuccess,
}: {
  initial: TaxRate | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<CreateTaxRateDTO>(() => ({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    taxType: initial?.tax_type ?? "vat",
    rate: Number(initial?.rate ?? 0),
    country: initial?.country ?? undefined,
    isDefault: initial?.is_default ?? false,
    isActive: initial?.is_active ?? true,
    description: initial?.description ?? "",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateTaxRateDTO>(k: K, v: CreateTaxRateDTO[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.code.trim()) throw new Error("Código é obrigatório");
      if (!form.name.trim()) throw new Error("Nome é obrigatório");
      if (form.rate < 0 || form.rate > 100) throw new Error("Alíquota deve ser entre 0 e 100");

      if (isEdit && initial) await taxRatesService.update(initial.id, form);
      else await taxRatesService.create(form);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar imposto");
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Código *</label>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="IVA-14"
            maxLength={30}
            disabled={loading}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Nome *</label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="IVA 14% (Angola)"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Tipo *</label>
          <Select value={form.taxType} onValueChange={(v) => set("taxType", v as TaxType)} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={labelCls}>Alíquota (%) *</label>
          <Input
            type="number"
            step="0.001"
            min="0"
            max="100"
            value={form.rate}
            onChange={(e) => set("rate", parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>País (opcional)</label>
        <Select
          value={form.country ?? NONE}
          onValueChange={(v) => set("country", v === NONE ? undefined : v)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Aplicável a qualquer país" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sem restrição de país</SelectItem>
            {COUNTRY_OPTIONS.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} · {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          disabled={loading}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => set("isActive", e.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-emerald-600"
          />
          <span className="text-slate-700 dark:text-slate-200">Ativo</span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDefault ?? false}
            onChange={(e) => set("isDefault", e.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-yellow-500"
          />
          <span className="text-slate-700 dark:text-slate-200">Padrão deste tipo</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : isEdit ? (
            "Salvar alterações"
          ) : (
            "Criar imposto"
          )}
        </Button>
      </div>
    </form>
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
