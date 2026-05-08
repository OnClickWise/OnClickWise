"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/AuthGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { journalsService } from "@/services/journalsService";
import {
  AccountingJournal,
  AccountingJournalDocument,
  JournalType,
} from "@/types/types";
import JournalForm from "@/components/financeiro/JournalForm";
import JournalDocumentForm from "@/components/financeiro/JournalDocumentForm";

const JOURNAL_TYPE_BADGE: Record<JournalType, string> = {
  sales: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  purchases: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  cash: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  bank: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  diverse: "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  opening: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  regularization: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  closing: "bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800",
  depreciation: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  payroll: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  taxes: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

export default function DiariosPage() {
  const params = useParams();
  const org = typeof params?.org === "string" ? params.org : "";

  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Estado de diários expandidos (com seus documentos)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [docsByJournal, setDocsByJournal] = useState<Record<string, AccountingJournalDocument[]>>({});
  const [docsLoading, setDocsLoading] = useState<Record<string, boolean>>({});

  // Modais
  const [journalModal, setJournalModal] = useState<{ open: boolean; editing?: AccountingJournal | null }>({ open: false });
  const [docModal, setDocModal] = useState<{
    open: boolean;
    journal: AccountingJournal | null;
    editing?: AccountingJournalDocument | null;
  }>({ open: false, journal: null });
  const [deleteJournal, setDeleteJournal] = useState<AccountingJournal | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<{ journalId: string; doc: AccountingJournalDocument } | null>(null);
  const [removing, setRemoving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const list = await journalsService.list(undefined, abortRef.current.signal);
      setJournals(list);
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

  const filtered = useMemo(() => {
    let list = journals;
    if (!showInactive) list = list.filter((j) => j.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) => j.code.toLowerCase().includes(q) || j.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [journals, search, showInactive]);

  const summary = useMemo(
    () => ({
      total: journals.length,
      active: journals.filter((j) => j.is_active).length,
      documents: journals.reduce((sum, j) => sum + (j.documents_count ?? 0), 0),
      entries: journals.reduce((sum, j) => sum + (j.entries_count ?? 0), 0),
    }),
    [journals],
  );

  const toggleExpand = useCallback(async (journal: AccountingJournal) => {
    const isExpanded = expanded[journal.id];
    if (isExpanded) {
      setExpanded((prev) => ({ ...prev, [journal.id]: false }));
      return;
    }
    setExpanded((prev) => ({ ...prev, [journal.id]: true }));

    // Lazy-load documentos só quando expandido pela primeira vez
    if (!docsByJournal[journal.id]) {
      setDocsLoading((prev) => ({ ...prev, [journal.id]: true }));
      try {
        const docs = await journalsService.listDocuments(journal.id);
        setDocsByJournal((prev) => ({ ...prev, [journal.id]: docs }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar documentos");
      } finally {
        setDocsLoading((prev) => ({ ...prev, [journal.id]: false }));
      }
    }
  }, [expanded, docsByJournal]);

  const refreshJournalDocuments = useCallback(async (journalId: string) => {
    setDocsLoading((prev) => ({ ...prev, [journalId]: true }));
    try {
      const docs = await journalsService.listDocuments(journalId);
      setDocsByJournal((prev) => ({ ...prev, [journalId]: docs }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao recarregar documentos");
    } finally {
      setDocsLoading((prev) => ({ ...prev, [journalId]: false }));
    }
  }, []);

  async function confirmDeleteJournal() {
    if (!deleteJournal) return;
    setRemoving(true);
    try {
      await journalsService.remove(deleteJournal.id);
      setDeleteJournal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir diário");
    } finally {
      setRemoving(false);
    }
  }

  async function confirmDeleteDocument() {
    if (!deleteDoc) return;
    setRemoving(true);
    try {
      await journalsService.removeDocument(deleteDoc.journalId, deleteDoc.doc.id);
      setDeleteDoc(null);
      await Promise.all([load(), refreshJournalDocuments(deleteDoc.journalId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir documento");
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
            <span className="text-slate-400 text-sm">Contabilidade</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Diários</span>
          </header>

          <main className="p-6 space-y-6">
            {/* Cabeçalho */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    Diários Contábeis
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Organize lançamentos por natureza (vendas, compras, caixa, bancos…) com numeração
                    sequencial automática por diário/período.
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
                    onClick={() => setJournalModal({ open: true, editing: null })}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Novo Diário
                  </Button>
                </div>
              </div>

              {/* KPIs */}
              <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label="Diários" value={summary.total} />
                <Kpi label="Ativos" value={summary.active} />
                <Kpi label="Documentos" value={summary.documents} />
                <Kpi label="Lançamentos" value={summary.entries} />
              </div>
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

            {/* Conteúdo */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Filtros */}
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
                  Mostrar inativos
                </label>
              </div>

              {/* Lista */}
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando diários...</span>
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState onCreate={() => setJournalModal({ open: true, editing: null })} hasJournals={journals.length > 0} />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((journal) => {
                    const isOpen = !!expanded[journal.id];
                    const docs = docsByJournal[journal.id] ?? [];
                    const docsLoadingThis = !!docsLoading[journal.id];
                    return (
                      <li key={journal.id} className={journal.is_active ? "" : "opacity-50"}>
                        <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <button
                            type="button"
                            onClick={() => toggleExpand(journal)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                            aria-label={isOpen ? "Recolher" : "Expandir"}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>

                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 w-12 shrink-0">
                            {journal.code}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {journal.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {journalsService.numberingModeLabel(journal.numbering_mode)} · {journal.entries_count ?? 0} lançamento(s)
                            </p>
                          </div>

                          <span className={`hidden sm:inline-flex rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${JOURNAL_TYPE_BADGE[journal.journal_type]}`}>
                            {journalsService.journalTypeLabel(journal.journal_type)}
                          </span>

                          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 shrink-0 w-24 justify-end">
                            <FileText className="w-3.5 h-3.5" />
                            {journal.documents_count ?? 0} doc(s)
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Adicionar documento"
                              onClick={() => setDocModal({ open: true, journal, editing: null })}
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Editar diário"
                              onClick={() => setJournalModal({ open: true, editing: journal })}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title={journal.entries_count ? "Inativar diário" : "Excluir diário"}
                              onClick={() => setDeleteJournal(journal)}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Documentos expandidos */}
                        {isOpen && (
                          <div className="border-l-2 border-indigo-100 dark:border-indigo-900/40 ml-9 mr-4 mb-3">
                            {docsLoadingThis ? (
                              <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Carregando documentos...
                              </div>
                            ) : docs.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-slate-500 italic">
                                Nenhum documento neste diário ainda. Use o botão "+" acima para criar.
                              </div>
                            ) : (
                              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {docs.map((doc) => (
                                  <li
                                    key={doc.id}
                                    className={`flex items-center gap-3 px-4 py-2 ${doc.is_active ? "" : "opacity-50"}`}
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 w-12 shrink-0">
                                      {doc.code}
                                    </span>
                                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
                                      {doc.name}
                                    </span>
                                    {doc.allows_recapitulative && (
                                      <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400">
                                        Recapitulativo
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        title="Editar documento"
                                        onClick={() => setDocModal({ open: true, journal, editing: doc })}
                                        className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Excluir documento"
                                        onClick={() => setDeleteDoc({ journalId: journal.id, doc })}
                                        className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal: criar/editar diário */}
      {journalModal.open && (
        <ModalShell
          title={journalModal.editing ? `Editar Diário ${journalModal.editing.code}` : "Novo Diário"}
          onClose={() => setJournalModal({ open: false })}
        >
          <JournalForm
            initial={journalModal.editing ?? null}
            onCancel={() => setJournalModal({ open: false })}
            onSuccess={async () => {
              setJournalModal({ open: false });
              await load();
            }}
          />
        </ModalShell>
      )}

      {/* Modal: criar/editar documento */}
      {docModal.open && docModal.journal && (
        <ModalShell
          title={docModal.editing ? `Editar Documento ${docModal.editing.code}` : "Novo Documento"}
          onClose={() => setDocModal({ open: false, journal: null })}
        >
          <JournalDocumentForm
            journal={docModal.journal}
            initial={docModal.editing ?? null}
            onCancel={() => setDocModal({ open: false, journal: null })}
            onSuccess={async () => {
              const journalId = docModal.journal!.id;
              setDocModal({ open: false, journal: null });
              await Promise.all([load(), refreshJournalDocuments(journalId)]);
            }}
          />
        </ModalShell>
      )}

      {/* Confirmação: excluir diário */}
      {deleteJournal && (
        <ModalShell
          title="Confirmar exclusão"
          onClose={() => setDeleteJournal(null)}
          maxWidth="max-w-sm"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Excluir o diário <strong>{deleteJournal.code} — {deleteJournal.name}</strong>?
            {deleteJournal.entries_count ? (
              <>
                {" "}
                Este diário já tem <strong>{deleteJournal.entries_count}</strong> lançamento(s) — em vez
                de apagar, ele será <strong>inativado</strong>.
              </>
            ) : (
              " Esta ação não pode ser desfeita."
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteJournal(null)} disabled={removing}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteJournal}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </ModalShell>
      )}

      {/* Confirmação: excluir documento */}
      {deleteDoc && (
        <ModalShell
          title="Confirmar exclusão"
          onClose={() => setDeleteDoc(null)}
          maxWidth="max-w-sm"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Excluir o documento <strong>{deleteDoc.doc.code} — {deleteDoc.doc.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDoc(null)} disabled={removing}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteDocument}
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

/* ─── Subcomponentes ──────────────────────────────────────────────────── */

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function EmptyState({ onCreate, hasJournals }: { onCreate: () => void; hasJournals: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
      <div className="text-center max-w-md">
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {hasJournals ? "Nenhum diário corresponde aos filtros" : "Nenhum diário cadastrado"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {hasJournals
            ? "Ajuste a busca ou exiba os inativos."
            : "Crie diários (Vendas, Compras, Caixa, Bancos...) para organizar seus lançamentos com numeração sequencial."}
        </p>
      </div>
      {!hasJournals && (
        <Button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          Criar primeiro diário
        </Button>
      )}
    </div>
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
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full ${maxWidth}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
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
