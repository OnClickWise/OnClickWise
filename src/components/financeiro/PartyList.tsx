'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2, TriangleAlert, Users, X } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import AuthGuard from '@/components/AuthGuard';
import { useParams } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  COUNTRY_OPTIONS,
  Customer,
  Supplier,
  customersService,
  suppliersService,
} from '@/services/partiesService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PartyForm, { PartyKind } from './PartyForm';

interface Props {
  kind: PartyKind;
}

const NONE = '__none__';

/**
 * Página completa Customers OU Suppliers — passa kind no router.
 */
export default function PartyList({ kind }: Props) {
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';
  const isSupplier = kind === 'supplier';
  const title = isSupplier ? 'Fornecedores' : 'Clientes';

  const [items, setItems] = useState<Array<Customer | Supplier>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [formOpen, setFormOpen] = useState<{ open: boolean; editing?: Customer | Supplier | null }>({
    open: false,
  });
  const [removeTarget, setRemoveTarget] = useState<Customer | Supplier | null>(null);
  const [removing, setRemoving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const filters = {
        query: search || undefined,
        country: country || undefined,
        isActive: showInactive ? undefined : true,
      };
      const fn = isSupplier ? suppliersService.list : customersService.list;
      const data = await fn(filters, abortRef.current.signal);
      setItems(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [search, country, showInactive, isSupplier]);

  // Debounce de search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((i) => i.is_active).length,
    }),
    [items],
  );

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const fn = isSupplier ? suppliersService.remove : customersService.remove;
      await fn(removeTarget.id);
      setRemoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setRemoving(false);
    }
  }

  const accent = isSupplier ? 'indigo' : 'blue';
  const accentBtn = isSupplier ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700';
  const accentIcon = isSupplier ? 'text-indigo-600' : 'text-blue-600';

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset className="bg-slate-100 dark:bg-slate-950 min-h-screen">
          <header className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <SidebarTrigger className="-ml-1" />
            <span className="text-slate-400 text-sm">Finanças</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">{title}</span>
          </header>

          <main className="p-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className={`w-6 h-6 ${accentIcon}`} />
                    {title}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {isSupplier
                      ? 'Cadastro de fornecedores com identificação fiscal e dados bancários.'
                      : 'Cadastro de clientes com identificação fiscal e condições comerciais.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                  <Button
                    onClick={() => setFormOpen({ open: true, editing: null })}
                    className={`text-white ${accentBtn}`}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Novo {isSupplier ? 'Fornecedor' : 'Cliente'}
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Ativos</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
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
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nome, código, e-mail ou identificação..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={country || NONE} onValueChange={(v) => setCountry(v === NONE ? '' : v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="País" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Todos os países</SelectItem>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} · {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-slate-300 accent-blue-600"
                  />
                  Mostrar inativos
                </label>
              </div>

              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Nenhum {isSupplier ? 'fornecedor' : 'cliente'} cadastrado</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Use o botão "Novo {isSupplier ? 'Fornecedor' : 'Cliente'}" para começar.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                      <tr className="text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 text-left">Código</th>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Identificação</th>
                        <th className="px-4 py-3 text-left">Contato</th>
                        <th className="px-4 py-3 text-left">País</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((p) => (
                        <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${p.is_active ? '' : 'opacity-50'}`}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.code ?? '—'}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                            {p.legal_name && <p className="text-xs text-slate-400 mt-0.5">{p.legal_name}</p>}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {p.tax_id ? (
                              <>
                                <span className="font-mono text-xs">{p.tax_id}</span>
                                {p.tax_id_type && (
                                  <span className="ml-1 text-[10px] uppercase text-slate-400">{p.tax_id_type}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                            {p.email && <p>{p.email}</p>}
                            {p.phone && <p className="text-slate-400">{p.phone}</p>}
                            {!p.email && !p.phone && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {p.country ?? <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                title="Editar"
                                onClick={() => setFormOpen({ open: true, editing: p })}
                                className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                title="Excluir"
                                onClick={() => setRemoveTarget(p)}
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
                </div>
              )}
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {formOpen.open && (
        <ModalShell
          title={formOpen.editing ? `Editar ${isSupplier ? 'Fornecedor' : 'Cliente'}` : `Novo ${isSupplier ? 'Fornecedor' : 'Cliente'}`}
          onClose={() => setFormOpen({ open: false })}
          maxWidth="max-w-2xl"
        >
          <PartyForm
            kind={kind}
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
            Excluir <strong>{removeTarget.name}</strong>?
            <br />
            Se houver lançamentos vinculados, será inativado em vez de apagado.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>
              Cancelar
            </Button>
            <Button onClick={confirmRemove} disabled={removing} className="bg-red-600 hover:bg-red-700 text-white">
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
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
  maxWidth = 'max-w-lg',
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
