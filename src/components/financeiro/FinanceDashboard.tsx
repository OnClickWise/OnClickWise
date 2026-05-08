'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { financeService } from '@/services/financeService';
import { treasuryService, TreasuryOverview } from '@/services/treasuryService';

interface DashboardStats {
  totalReceivable: number;
  paidReceivable: number;
  outstandingReceivable: number;
  overdueReceivable: number;
  totalPayable: number;
  paidPayable: number;
  outstandingPayable: number;
  overduePayable: number;
  netCashFlow: number;
  arCount: number;
  apCount: number;
}

const initialStats: DashboardStats = {
  totalReceivable: 0,
  paidReceivable: 0,
  outstandingReceivable: 0,
  overdueReceivable: 0,
  totalPayable: 0,
  paidPayable: 0,
  outstandingPayable: 0,
  overduePayable: 0,
  netCashFlow: 0,
  arCount: 0,
  apCount: 0,
};

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [treasury, setTreasury] = useState<TreasuryOverview | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const [receivables, payables, ovw] = await Promise.all([
        financeService.listReceivables(500),
        financeService.listPayables(500),
        treasuryService.overview(abortRef.current.signal).catch(() => null), // tesouraria opcional
      ]);

      const totalReceivable = receivables.reduce((s, r) => s + Number(r.original_amount), 0);
      const paidReceivable = receivables.reduce((s, r) => s + Number(r.paid_amount), 0);
      const outstandingReceivable = receivables.reduce((s, r) => s + Number(r.outstanding_amount), 0);
      const overdueReceivable = receivables
        .filter((r) => financeService.isOverdue(r.due_date, r.status))
        .reduce((s, r) => s + Number(r.outstanding_amount), 0);

      const totalPayable = payables.reduce((s, p) => s + Number(p.original_amount), 0);
      const paidPayable = payables.reduce((s, p) => s + Number(p.paid_amount), 0);
      const outstandingPayable = payables.reduce((s, p) => s + Number(p.outstanding_amount), 0);
      const overduePayable = payables
        .filter((p) => financeService.isOverdue(p.due_date, p.status))
        .reduce((s, p) => s + Number(p.outstanding_amount), 0);

      setStats({
        totalReceivable,
        paidReceivable,
        outstandingReceivable,
        overdueReceivable,
        totalPayable,
        paidPayable,
        outstandingPayable,
        overduePayable,
        netCashFlow: paidReceivable - paidPayable,
        arCount: receivables.length,
        apCount: payables.length,
      });
      setTreasury(ovw);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
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

  const fmt = (v: number) => financeService.formatCurrency(v);
  const arProgress = stats.totalReceivable > 0 ? (stats.paidReceivable / stats.totalReceivable) * 100 : 0;
  const apProgress = stats.totalPayable > 0 ? (stats.paidPayable / stats.totalPayable) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header com ação atualizar */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel Financeiro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visão consolidada de recebíveis, pagáveis e tesouraria.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <TriangleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Erro</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </div>
      )}

      {loading && stats.arCount === 0 && stats.apCount === 0 ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando dashboard...</span>
        </div>
      ) : (
        <>
          {/* Card destaque: Fluxo de caixa líquido */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 shadow-sm text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Fluxo de Caixa Líquido
                </p>
                <p className="text-4xl font-bold mt-2 tabular-nums">{fmt(stats.netCashFlow)}</p>
                <p className="text-xs text-slate-400 mt-2">Recebimentos pagos − Pagamentos efetuados</p>
              </div>
              <div
                className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
                  stats.netCashFlow >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}
              >
                {stats.netCashFlow >= 0 ? (
                  <TrendingUp className="w-7 h-7 text-emerald-300" />
                ) : (
                  <TrendingDown className="w-7 h-7 text-rose-300" />
                )}
              </div>
            </div>

            {/* Saldo de tesouraria por moeda */}
            {treasury && Object.keys(treasury.byCurrency).length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(treasury.byCurrency).map(([currency, data]) => (
                  <div key={currency} className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-300 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Tesouraria · {currency}
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(
                          data.totalBalance,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<ArrowDownCircle className="w-4 h-4" />}
              label="Receitas (total)"
              value={fmt(stats.totalReceivable)}
              hint={`${stats.arCount} lançamento${stats.arCount === 1 ? '' : 's'}`}
              accent="blue"
            />
            <KpiCard
              icon={<Clock className="w-4 h-4" />}
              label="A Receber"
              value={fmt(stats.outstandingReceivable)}
              hint={`Vencidas: ${fmt(stats.overdueReceivable)}`}
              accent="amber"
              hintAccent={stats.overdueReceivable > 0 ? 'rose' : 'slate'}
            />
            <KpiCard
              icon={<ArrowUpCircle className="w-4 h-4" />}
              label="Despesas (total)"
              value={fmt(stats.totalPayable)}
              hint={`${stats.apCount} lançamento${stats.apCount === 1 ? '' : 's'}`}
              accent="indigo"
            />
            <KpiCard
              icon={<Clock className="w-4 h-4" />}
              label="A Pagar"
              value={fmt(stats.outstandingPayable)}
              hint={`Vencidas: ${fmt(stats.overduePayable)}`}
              accent="amber"
              hintAccent={stats.overduePayable > 0 ? 'rose' : 'slate'}
            />
          </div>

          {/* AR + AP detalhe */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DetailCard
              title="Contas a Receber"
              icon={<ArrowDownCircle className="w-5 h-5 text-blue-600" />}
              total={stats.totalReceivable}
              paid={stats.paidReceivable}
              outstanding={stats.outstandingReceivable}
              overdue={stats.overdueReceivable}
              progress={arProgress}
              progressColor="bg-blue-600"
            />
            <DetailCard
              title="Contas a Pagar"
              icon={<ArrowUpCircle className="w-5 h-5 text-indigo-600" />}
              total={stats.totalPayable}
              paid={stats.paidPayable}
              outstanding={stats.outstandingPayable}
              overdue={stats.overduePayable}
              progress={apProgress}
              progressColor="bg-indigo-600"
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Subcomponentes ─────────────────────────────────────────────────── */

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
  hintAccent = 'slate',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: 'blue' | 'amber' | 'indigo' | 'cyan';
  hintAccent?: 'slate' | 'rose';
}) {
  const accentClass = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30',
  }[accent];
  const hintClass = hintAccent === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400';
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center rounded-lg w-7 h-7 ${accentClass}`}>{icon}</span>
        <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className={`text-xs mt-1 ${hintClass}`}>{hint}</p>
    </div>
  );
}

function DetailCard({
  title,
  icon,
  total,
  paid,
  outstanding,
  overdue,
  progress,
  progressColor,
}: {
  title: string;
  icon: React.ReactNode;
  total: number;
  paid: number;
  outstanding: number;
  overdue: number;
  progress: number;
  progressColor: string;
}) {
  const fmt = (v: number) => financeService.formatCurrency(v);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>

      <div className="space-y-3 text-sm">
        <Row label="Total" value={fmt(total)} bold />
        <Row label="Pago" value={fmt(paid)} accent="emerald" badge={`${Math.round(progress)}%`} />
        <Row label="Pendente" value={fmt(outstanding)} accent="amber" />
        <Row label="Vencido" value={fmt(overdue)} accent={overdue > 0 ? 'rose' : 'slate'} />
      </div>

      <div className="mt-4">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`${progressColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{Math.round(progress)}% liquidado</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent = 'slate',
  badge,
  bold = false,
}: {
  label: string;
  value: string;
  accent?: 'slate' | 'emerald' | 'amber' | 'rose';
  badge?: string;
  bold?: boolean;
}) {
  const accentClass = {
    slate: 'text-slate-700 dark:text-slate-200',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  }[accent];
  return (
    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
        <span className={`tabular-nums ${bold ? 'font-bold text-slate-900 dark:text-white' : `font-semibold ${accentClass}`}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
