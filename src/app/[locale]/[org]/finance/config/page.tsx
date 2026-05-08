"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Globe, Loader2, Settings2 } from "lucide-react";
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
  COUNTRY_OPTIONS,
  FinanceConfig,
  TaxMode,
  UpdateFinanceConfigDTO,
  financeConfigService,
} from "@/services/partiesService";
import CurrencySelect from "@/components/financeiro/CurrencySelect";

const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2";

const LOCALE_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "pt-AO", label: "Português (Angola)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TAX_MODE_OPTIONS: ReadonlyArray<{ value: TaxMode; label: string; help: string }> = [
  { value: "exclusive", label: "Exclusivo", help: "Impostos somam-se ao valor (mais comum: BR, US)" },
  { value: "inclusive", label: "Inclusivo", help: "Preços já incluem o imposto (UE — IVA incluído)" },
  { value: "none", label: "Sem impostos", help: "Sistema não calcula impostos automaticamente" },
];

export default function FinanceConfigPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";

  const [config, setConfig] = useState<FinanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    financeConfigService
      .get(abortRef.current.signal)
      .then(setConfig)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => abortRef.current?.abort();
  }, []);

  const set = <K extends keyof FinanceConfig>(key: K, value: FinanceConfig[K]) =>
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const dto: UpdateFinanceConfigDTO = {
        locale: config.locale,
        defaultCurrency: config.default_currency,
        country: config.country,
        fiscalYearStartMonth: config.fiscal_year_start_month,
        taxMode: config.tax_mode,
        decimalSeparator: config.decimal_separator,
        thousandsSeparator: config.thousands_separator,
      };
      const updated = await financeConfigService.update(dto);
      setConfig(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configuração");
    } finally {
      setSaving(false);
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
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Configuração</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-blue-600" />
                Configuração Regional
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Defina locale, moeda padrão, país, ano fiscal e modo de imposto da organização. Estas
                configurações afetam formatação de valores, defaults nos formulários e comportamento dos relatórios.
              </p>
            </section>

            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 text-rose-900 dark:text-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <span>Configuração salva com sucesso.</span>
              </div>
            )}

            {loading || !config ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando configuração...</span>
              </div>
            ) : (
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div>
                    <label className={labelCls}>
                      <Globe className="inline w-4 h-4 mr-1 text-slate-400" />
                      País principal
                    </label>
                    <Select value={config.country} onValueChange={(v) => set("country", v)} disabled={saving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} · {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      Define defaults razoáveis para impostos e templates.
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>Locale (idioma e região)</label>
                    <Select value={config.locale} onValueChange={(v) => set("locale", v)} disabled={saving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCALE_OPTIONS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Formatação de datas e textos.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Moeda padrão</label>
                    <CurrencySelect
                      value={config.default_currency}
                      onChange={(v) => set("default_currency", v)}
                      disabled={saving}
                    />
                    <p className="text-xs text-slate-500 mt-1">Moeda usada por padrão em novos lançamentos.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Início do exercício fiscal</label>
                    <Select
                      value={String(config.fiscal_year_start_month)}
                      onValueChange={(v) => set("fiscal_year_start_month", parseInt(v))}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      BR/PT/AO Janeiro · US frequentemente Outubro.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Modo de imposto</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TAX_MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("tax_mode", opt.value)}
                        disabled={saving}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          config.tax_mode === opt.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{opt.label}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.help}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className={labelCls}>Separador decimal</label>
                    <Input
                      maxLength={1}
                      value={config.decimal_separator}
                      onChange={(e) => set("decimal_separator", e.target.value || ",")}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Separador de milhares</label>
                    <Input
                      maxLength={1}
                      value={config.thousands_separator}
                      onChange={(e) => set("thousands_separator", e.target.value || ".")}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Configuração"
                    )}
                  </Button>
                </div>
              </section>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
