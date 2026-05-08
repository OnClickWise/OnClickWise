"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Banknote,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
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
  BankAccountType,
  treasuryService,
  TreasuryOverview,
} from "@/services/treasuryService";
import BankAccountForm from "@/components/financeiro/BankAccountForm";
import CashMovementForm from "@/components/financeiro/CashMovementForm";
import TransferForm from "@/components/financeiro/TransferForm";

const TYPE_BADGE: Record<BankAccountType, string> = {
  cash: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  checking: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  savings: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  investment: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  credit: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

export default function TreasuryPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";
  const locale = useLocale();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [overview, setOverview] = useState<TreasuryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Modais
  const [accountModal, setAccountModal] = useState<{ open: boolean; editing?: BankAccount | null }>({
    open: false,
  });
  const [movementModal, setMovementModal] = useState<{ open: boolean; account: BankAccount | null }>({
    open: false,
    account: null,
  });
  const [transferModal, setTransferModal] = useState<{ open: boolean; fromId?: string }>({ open: false });
  const [deleteAccount, setDeleteAccount] = useState<BankAccount | null>(null);
  const [removing, setRemoving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const [accs, ov] = await Promise.all([
        treasuryService.listAccounts(undefined, abortRef.current.signal),
        treasuryService.overview(abortRef.current.signal),
      ]);
      setAccounts(accs);
      setOverview(ov);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const filtered = useMemo(
    () => (showInactive ? accounts : accounts.filter((a) => a.is_active)),
    [accounts, showInactive],
  );

  async function confirmDeleteAccount() {
    if (!deleteAccount) return;
    setRemoving(true);
    try {
      await treasuryService.removeAccount(deleteAccount.id);
      setDeleteAccount(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir conta");
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
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Tesouraria</span>
          </header>

          <main className="p-6 space-y-6">
            {/* Cabeçalho */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-cyan-600" />
                    Tesouraria
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Gerencie caixas, contas bancárias, movimentos e transferências.
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
                    onClick={() => setTransferModal({ open: true })}
                    variant="outline"
                    disabled={accounts.filter((a) => a.is_active).length < 2}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                    Transferir
                  </Button>
                  <Button
                    onClick={() => setAccountModal({ open: true, editing: null })}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Nova Conta
                  </Button>
                </div>
              </div>

              {/* Overview por moeda */}
              {overview && Object.keys(overview.byCurrency).length > 0 && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(overview.byCurrency).map(([currency, data]) => (
                    <div
                      key={currency}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-5"
                    >
                      <div className="text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-300 font-semibold">
                        Saldo Total · {currency}
                      </div>
                      <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {treasuryService.currencyFormat(data.totalBalance, currency)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {data.accounts} conta{data.accounts === 1 ? "" : "s"} ativa{data.accounts === 1 ? "" : "s"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {error && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Erro</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
                <button onClick={() => setError(null)} className="text-amber-700 hover:text-amber-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Lista de contas */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Contas ({filtered.length})
                </h2>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-slate-300 accent-cyan-600"
                  />
                  Mostrar inativas
                </label>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando contas...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Banknote className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {accounts.length === 0
                      ? "Nenhuma conta cadastrada"
                      : "Nenhuma conta corresponde aos filtros"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {accounts.length === 0
                      ? "Crie uma caixa ou conta bancária para começar"
                      : "Marque 'Mostrar inativas' para ver todas"}
                  </p>
                  {accounts.length === 0 && (
                    <Button
                      onClick={() => setAccountModal({ open: true, editing: null })}
                      className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Criar Primeira Conta
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((acc) => (
                    <li
                      key={acc.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                        acc.is_active ? "" : "opacity-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            {acc.bank_code}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {acc.bank_name}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${TYPE_BADGE[acc.account_type]}`}
                          >
                            {treasuryService.accountTypeLabel(acc.account_type)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Conta nº {acc.account_number} · Titular: {acc.account_holder}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Saldo atual</div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white tabular-nums">
                          {treasuryService.currencyFormat(acc.current_balance, acc.currency)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/${locale}/${org}/finance/treasury/${acc.id}`}
                          title="Extrato"
                          className="px-2.5 py-1.5 rounded text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
                        >
                          Extrato
                        </Link>
                        <button
                          type="button"
                          title="Registrar entrada"
                          disabled={!acc.is_active}
                          onClick={() => setMovementModal({ open: true, account: acc })}
                          className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-30"
                        >
                          <ArrowDownCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => setAccountModal({ open: true, editing: acc })}
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Excluir / inativar"
                          onClick={() => setDeleteAccount(acc)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal: criar/editar conta */}
      {accountModal.open && (
        <ModalShell
          title={accountModal.editing ? `Editar ${accountModal.editing.bank_name}` : "Nova Conta"}
          onClose={() => setAccountModal({ open: false })}
        >
          <BankAccountForm
            initial={accountModal.editing ?? null}
            onCancel={() => setAccountModal({ open: false })}
            onSuccess={async () => {
              setAccountModal({ open: false });
              await load();
            }}
          />
        </ModalShell>
      )}

      {/* Modal: movimento */}
      {movementModal.open && movementModal.account && (
        <ModalShell
          title="Registrar Movimento"
          onClose={() => setMovementModal({ open: false, account: null })}
        >
          <CashMovementForm
            account={movementModal.account}
            onCancel={() => setMovementModal({ open: false, account: null })}
            onSuccess={async () => {
              setMovementModal({ open: false, account: null });
              await load();
            }}
          />
        </ModalShell>
      )}

      {/* Modal: transferência */}
      {transferModal.open && (
        <ModalShell title="Transferência entre Contas" onClose={() => setTransferModal({ open: false })}>
          <TransferForm
            accounts={accounts}
            initialFromId={transferModal.fromId}
            onCancel={() => setTransferModal({ open: false })}
            onSuccess={async () => {
              setTransferModal({ open: false });
              await load();
            }}
          />
        </ModalShell>
      )}

      {/* Confirmação de exclusão */}
      {deleteAccount && (
        <ModalShell title="Confirmar exclusão" onClose={() => setDeleteAccount(null)} maxWidth="max-w-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Excluir a conta <strong>{deleteAccount.bank_code} — {deleteAccount.bank_name}</strong>?
            <br />
            Se houver movimentos ou saldo, ela será <strong>inativada</strong> em vez de apagada.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteAccount(null)} disabled={removing}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteAccount}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
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
