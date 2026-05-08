"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpCircle,
  Loader2,
  RefreshCw,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  BankAccount,
  BankStatement,
  treasuryService,
} from "@/services/treasuryService";
import CashMovementForm from "@/components/financeiro/CashMovementForm";
import TransferForm from "@/components/financeiro/TransferForm";

const MOVEMENT_TYPE_LABEL: Record<string, { label: string; sign: "+" | "-" | "="; color: string }> = {
  treasury_movement: { label: "Movimento", sign: "=", color: "text-slate-700 dark:text-slate-200" },
  treasury_transfer_in: { label: "Transferência recebida", sign: "+", color: "text-emerald-600" },
  treasury_transfer_out: { label: "Transferência enviada", sign: "-", color: "text-rose-600" },
  bank_account_opening: { label: "Saldo de abertura", sign: "+", color: "text-blue-600" },
};

export default function TreasuryAccountDetailPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const id = typeof params?.id === "string" ? params.id : "";
  const locale = useLocale();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [allAccounts, setAllAccounts] = useState<BankAccount[]>([]);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [movementModal, setMovementModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const [stmt, accs] = await Promise.all([
        treasuryService.getStatement(id, { startDate, endDate, limit: 200 }, abortRef.current.signal),
        treasuryService.listAccounts(undefined, abortRef.current.signal),
      ]);
      setStatement(stmt);
      setAllAccounts(accs);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, startDate, endDate]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const account = statement?.account;

  // Calcula entradas/saídas no período (a partir das categorias)
  const periodStats = (() => {
    if (!statement) return { inflows: 0, outflows: 0, count: 0 };
    let inflows = 0;
    let outflows = 0;
    for (const m of statement.movements) {
      const type = MOVEMENT_TYPE_LABEL[m.reference_type ?? ""];
      if (!type) continue;
      const amt = Number(m.amount);
      if (type.sign === "+") inflows += amt;
      else if (type.sign === "-") outflows += amt;
    }
    return { inflows, outflows, count: statement.movements.length };
  })();

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <Link
              href={`/${locale}/${org}/finance/treasury`}
              className="text-slate-400 text-sm hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Tesouraria
            </Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm truncate">
              {account ? `${account.bank_code} · ${account.bank_name}` : "Conta"}
            </span>
          </header>

          <main className="p-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Erro</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            )}

            {loading && !statement ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando extrato...</span>
              </div>
            ) : account ? (
              <>
                {/* Cabeçalho */}
                <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-cyan-50 via-blue-50 to-white dark:from-cyan-900/20 dark:via-blue-900/10 dark:to-slate-900 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white shrink-0">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                          {treasuryService.accountTypeLabel(account.account_type)}
                        </p>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                          {account.bank_name}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                          {account.bank_code} · Conta nº {account.account_number} · {account.account_holder}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Saldo Atual
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                        {treasuryService.currencyFormat(account.current_balance, account.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      onClick={() => setMovementModal(true)}
                      disabled={!account.is_active}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-1.5" />
                      Movimento
                    </Button>
                    <Button
                      onClick={() => setTransferModal(true)}
                      variant="outline"
                      disabled={!account.is_active || allAccounts.filter((a) => a.is_active).length < 2}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                      Transferir
                    </Button>
                    <button
                      onClick={load}
                      disabled={loading}
                      className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      Atualizar
                    </button>
                  </div>
                </section>

                {/* KPIs do período */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <ArrowDownCircle className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Entradas</span>
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {treasuryService.currencyFormat(periodStats.inflows, account.currency)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center gap-2 text-rose-600">
                      <ArrowUpCircle className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Saídas</span>
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {treasuryService.currencyFormat(periodStats.outflows, account.currency)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-xs uppercase tracking-wider font-semibold">Movimentos</span>
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {periodStats.count}
                    </div>
                  </div>
                </div>

                {/* Filtros + Extrato */}
                <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="flex flex-wrap items-end gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
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
                  </div>

                  {statement && statement.movements.length === 0 ? (
                    <div className="py-16 text-center text-sm text-slate-400">
                      Nenhum movimento no período selecionado.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800/60">
                          <tr className="text-xs uppercase tracking-wide text-slate-500">
                            <th className="py-3 px-5 text-left">Data</th>
                            <th className="py-3 px-4 text-left">Tipo</th>
                            <th className="py-3 px-4 text-left">Descrição</th>
                            <th className="py-3 px-4 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {statement?.movements.map((mov) => {
                            const type = MOVEMENT_TYPE_LABEL[mov.reference_type ?? ""] ?? {
                              label: mov.transaction_type,
                              sign: "=",
                              color: "text-slate-700 dark:text-slate-200",
                            };
                            return (
                              <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-5 text-slate-500 whitespace-nowrap">
                                  {treasuryService.dateFormat(mov.occurred_at)}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className={`text-xs font-medium ${type.color}`}>
                                    {type.label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 max-w-md truncate text-slate-700 dark:text-slate-200">
                                  {mov.description}
                                </td>
                                <td
                                  className={`py-2.5 px-4 text-right font-semibold tabular-nums ${type.color}`}
                                >
                                  {type.sign !== "=" && type.sign}
                                  {treasuryService.currencyFormat(mov.amount, account.currency)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400">Conta não encontrada.</div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Modais */}
      {movementModal && account && (
        <ModalShell title="Registrar Movimento" onClose={() => setMovementModal(false)}>
          <CashMovementForm
            account={account}
            onCancel={() => setMovementModal(false)}
            onSuccess={async () => {
              setMovementModal(false);
              await load();
            }}
          />
        </ModalShell>
      )}

      {transferModal && account && (
        <ModalShell title="Transferência" onClose={() => setTransferModal(false)}>
          <TransferForm
            accounts={allAccounts}
            initialFromId={account.id}
            onCancel={() => setTransferModal(false)}
            onSuccess={async () => {
              setTransferModal(false);
              await load();
            }}
          />
        </ModalShell>
      )}
    </AuthGuard>
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
