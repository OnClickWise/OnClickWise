"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import AuthGuard from "@/components/AuthGuard";
import { AppSidebar } from "@/components/app-sidebar";
import { AllocationChart } from "@/components/investments/AllocationChart";
import { MarketOverview } from "@/components/investments/MarketOverview";
import { ProjectionTool } from "@/components/investments/ProjectionTool";
import { RecentTransactions } from "@/components/investments/RecentTransactions";
import { investmentService } from "@/services/investmentService";
import { Contribution, FinancialGoal, InvestmentAsset, Portfolio } from "@/types/investments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function getAssetTypeLabel(assetType: string) {
  const labelMap: Record<string, string> = {
    renda_fixa: "Renda fixa",
    acao: "Acoes",
    fii: "FII",
    cripto: "Cripto",
  };

  return labelMap[assetType] || assetType;
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function InvestmentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const locale = useLocale();
  const tSidebar = useTranslations("Sidebar");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  useEffect(() => {
    const load = async () => {
      const portfolioData = await investmentService.getPortfolios();
      setPortfolios(portfolioData);

      const [assetData, contributionData] = await Promise.all([
        Promise.all(portfolioData.map((portfolio) => investmentService.getInvestments(portfolio.id))),
        investmentService.getContributions(),
      ]);
      const goalData = await investmentService.getFinancialGoals();

      setAssets(assetData.flat());
      setContributions(contributionData);
      setGoals(goalData);
    };

    load();
  }, []);

  const patrimony = useMemo(() => portfolios.reduce((acc, item) => acc + item.totalValue, 0), [portfolios]);
  const totalInvested = useMemo(() => portfolios.reduce((acc, item) => acc + item.initialAmount + item.investedTotal, 0), [portfolios]);
  const profit = useMemo(() => assets.reduce((acc, item) => acc + item.profit, 0), [assets]);
  const profitability = useMemo(() => (totalInvested > 0 ? (profit / totalInvested) * 100 : 0), [profit, totalInvested]);
  const monthContributions = useMemo(() => {
    const now = new Date();
    return contributions
      .filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && item.type === "aporte";
      })
      .reduce((acc, item) => acc + item.value, 0);
  }, [contributions]);

  const allocationItems = useMemo(() => {
    const grouped = assets.reduce<Record<string, number>>((acc, item) => {
      const label = getAssetTypeLabel(item.assetType);
      acc[label] = (acc[label] || 0) + item.currentValue;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const reportSeries = useMemo(() => {
    const sourceDates = [
      ...portfolios.map((item) => item.createdAt),
      ...assets.map((item) => item.createdAt),
      ...contributions.map((item) => item.date),
    ].filter(Boolean);

    if (sourceDates.length === 0) {
      return [] as Array<{ label: string; patrimonio: number; investido: number; rentabilidade: number }>;
    }

    const firstDate = new Date(sourceDates.sort()[0]);
    const current = new Date();
    const months: Date[] = [];
    const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

    while (cursor <= current) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months.map((monthStart) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
      const invested = portfolios
        .filter((portfolio) => new Date(portfolio.createdAt) <= monthEnd)
        .reduce((acc, portfolio) => acc + portfolio.initialAmount, 0) + contributions
        .filter((item) => new Date(item.date) <= monthEnd)
        .reduce((acc, item) => acc + (item.type === "aporte" ? item.value : -item.value), 0);

      const patrimonioMes = portfolios
        .filter((portfolio) => new Date(portfolio.createdAt) <= monthEnd)
        .reduce((acc, portfolio) => acc + portfolio.initialAmount, 0) + assets
        .filter((asset) => new Date(asset.createdAt) <= monthEnd)
        .reduce((acc, asset) => acc + asset.currentValue, 0);

      const rentabilidade = invested > 0 ? ((patrimonioMes - invested) / invested) * 100 : 0;

      return {
        label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(monthStart),
        patrimonio: Number(patrimonioMes.toFixed(2)),
        investido: Number(invested.toFixed(2)),
        rentabilidade: Number(rentabilidade.toFixed(2)),
      };
    });
  }, [portfolios, assets, contributions]);

  const recentTransactions = useMemo(() => {
    return [...contributions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        amount: item.value,
        date: new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.date)),
        label: `${item.assetName || item.portfolioName || "Movimentacao"} · ${item.type}`,
      }));
  }, [contributions]);

  const monthlyContributionBase = useMemo(() => {
    const months = new Set(contributions.map((item) => new Date(item.date).toISOString().slice(0, 7)));
    return months.size > 0 ? contributions.reduce((acc, item) => acc + item.value, 0) / months.size : 0;
  }, [contributions]);

  const totalGoalProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalTarget = goals.reduce((acc, item) => acc + item.targetAmount, 0);
    const totalCurrent = goals.reduce((acc, item) => acc + item.currentAmount, 0);
    return totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  }, [goals]);

  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/dashboard`}>{tSidebar("dashboard")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{tSidebar("investments")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-muted/40">
            {/* Linha 1: 3 métricas principais */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <MetricCard title="Patrimonio total" value={money(patrimony)} icon={Wallet} />
              <MetricCard title="Total investido" value={money(totalInvested)} icon={PiggyBank} />
              <MetricCard title="Resultado atual" value={money(profit)} icon={TrendingUp} />
            </div>

            {/* Linha 2: 5 métricas secundárias */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Rentabilidade</p><p className={`text-2xl font-bold ${profitability >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{profitability.toFixed(2)}%</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Aportes no mes</p><p className="text-2xl font-bold">{money(monthContributions)}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold">{assets.length}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Carteiras</p><p className="text-2xl font-bold">{portfolios.length}</p></CardContent></Card>
              <Card className="col-span-2 sm:col-span-1"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Preco a mercado</p><p className="text-2xl font-bold">{money(assets.reduce((acc, item) => acc + item.currentValue, 0))}</p></CardContent></Card>
            </div>

            {/* Linha 3: gráfico de evolução + simulador */}
            <div className="grid gap-4 grid-cols-1 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Evolucao patrimonial</CardTitle>
                </CardHeader>
                <CardContent className="h-[260px] sm:h-[320px]">
                  {reportSeries.length < 2 ? (
                    <ChartFallback message="Os graficos de evolucao precisam de pelo menos 2 periodos para comparacao. Cadastre mais movimentacoes para destravar a visualizacao." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
                        <YAxis width={72} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                        <Tooltip formatter={(value: any) => value ? money(value) : ''} />
                        <Line type="monotone" dataKey="patrimonio" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="investido" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <div className="min-w-0">
                <ProjectionTool initialAmount={patrimony} monthlyContribution={monthlyContributionBase} layout="stacked" />
              </div>
            </div>

            {/* Linha 4: módulos */}
            <Card>
              <CardHeader>
                <CardTitle>Modulos de investimento</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                <Link href={`/${locale}/${org}/investments/portfolios`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Carteiras</p>
                  <p className="text-sm text-muted-foreground">Carteiras vinculadas ao usuario autenticado</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/contributions`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Aportes</p>
                  <p className="text-sm text-muted-foreground">Controle de entradas, retiradas e aportes mensais</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/financial-flow`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Fluxo financeiro</p>
                  <p className="text-sm text-muted-foreground">Receitas e despesas integradas ao patrimonio</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/dividends`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Dividendos</p>
                  <p className="text-sm text-muted-foreground">Proventos recebidos por ativo</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/goals`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Metas financeiras</p>
                  <p className="text-sm text-muted-foreground">Acompanhe objetivos patrimoniais</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/simulation`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Simulacao</p>
                  <p className="text-sm text-muted-foreground">Projecoes financeiras por horizonte</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/wealth`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Meu Patrimonio</p>
                  <p className="text-sm text-muted-foreground">Resumo consolidado do portfolio</p>
                </Link>
                <Link href={`/${locale}/${org}/investments/reports`} className="rounded-lg border bg-background p-4 hover:border-primary transition-colors">
                  <p className="font-semibold">Relatorios</p>
                  <p className="text-sm text-muted-foreground">Graficos de evolucao e rentabilidade mensal</p>
                </Link>
              </CardContent>
            </Card>

            {/* Linha 5: gráficos menores */}
            <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
              <AllocationChart items={allocationItems} />
              <RecentTransactions items={recentTransactions} />
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Rentabilidade mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-[260px] sm:h-[320px]">
                  {reportSeries.length < 2 ? (
                    <ChartFallback message="A rentabilidade mensal aparece assim que houver historico suficiente de mais de um periodo." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
                        <YAxis width={72} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                        <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                        <Bar dataKey="rentabilidade" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={44} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Linha 6: metas + mercado */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Metas financeiras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalGoalProgress.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground mt-2">Progresso consolidado das metas cadastradas.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Atualizacao de mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Use a tela de Carteiras para atualizar automaticamente os precos de mercado dos ativos.</p>
                </CardContent>
              </Card>
            </div>

            <MarketOverview />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
