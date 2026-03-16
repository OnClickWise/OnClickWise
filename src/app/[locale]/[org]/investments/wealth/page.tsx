"use client";

import { use, useEffect, useMemo, useState } from "react";
import { AllocationChart } from "@/components/investments/AllocationChart";
import { RecentTransactions } from "@/components/investments/RecentTransactions";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { investmentService } from "@/services/investmentService";
import { InvestmentAsset, Portfolio } from "@/types/investments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, PiggyBank, Wallet } from "lucide-react";

type PeriodFilter = "7d" | "30d" | "90d";

function getAssetTypeLabel(assetType: string) {
  const labels: Record<string, string> = {
    renda_fixa: "Renda fixa",
    acao: "Acoes",
    fii: "FII",
    cripto: "Cripto",
  };

  return labels[assetType] || assetType;
}

function getPeriodStartDate(period: PeriodFilter) {
  const now = new Date();
  const map: Record<PeriodFilter, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const start = new Date(now);
  start.setDate(now.getDate() - map[period]);
  return start;
}

export default function InvestmentsWealthPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("30d");

  useEffect(() => {
    const load = async () => {
      const portfolioData = await investmentService.getPortfolios();
      setPortfolios(portfolioData);

      if (portfolioData.length === 0) {
        setAssets([]);
        return;
      }

      const byPortfolio = await Promise.all(
        portfolioData.map((portfolio) => investmentService.getInvestments(portfolio.id)),
      );
      setAssets(byPortfolio.flat());
    };

    load();
  }, []);

  const total = useMemo(() => portfolios.reduce((acc, item) => acc + item.totalValue, 0), [portfolios]);
  const totalInitial = useMemo(() => portfolios.reduce((acc, item) => acc + item.initialAmount, 0), [portfolios]);
  const totalProfit = useMemo(() => assets.reduce((acc, item) => acc + item.profit, 0), [assets]);
  const profitability = useMemo(() => {
    const invested = portfolios.reduce((acc, item) => acc + item.initialAmount + item.investedTotal, 0);
    return invested > 0 ? (totalProfit / invested) * 100 : 0;
  }, [portfolios, totalProfit]);

  const filteredAssets = useMemo(() => {
    const startDate = getPeriodStartDate(period);
    return assets.filter((item) => new Date(item.createdAt).getTime() >= startDate.getTime());
  }, [assets, period]);

  const filteredAllocated = useMemo(
    () => filteredAssets.reduce((acc, item) => acc + item.totalInvested, 0),
    [filteredAssets],
  );

  const allocationData = useMemo(() => {
    const grouped = filteredAssets.reduce<Record<string, number>>((acc, item) => {
      const label = getAssetTypeLabel(item.assetType);
      acc[label] = (acc[label] || 0) + item.totalInvested;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAssets]);

  const recentTransactions = useMemo(() => {
    return [...filteredAssets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((asset) => ({
        id: asset.id,
        amount: asset.totalInvested,
        date: new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(asset.createdAt)),
        label: `${asset.assetName}${asset.portfolioName ? ` - ${asset.portfolioName}` : ""}`,
      }));
  }, [filteredAssets]);

  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <InvestmentsModuleShell org={org} section="Meu patrimonio">
      <h1 className="text-2xl font-bold">Meu Patrimonio</h1>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">Periodo:</p>
        <Button variant={period === "7d" ? "default" : "outline"} size="sm" onClick={() => setPeriod("7d")}>7 dias</Button>
        <Button variant={period === "30d" ? "default" : "outline"} size="sm" onClick={() => setPeriod("30d")}>30 dias</Button>
        <Button variant={period === "90d" ? "default" : "outline"} size="sm" onClick={() => setPeriod("90d")}>90 dias</Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo total</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{money(total)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">Capital inicial</CardTitle>
            <PiggyBank className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{money(totalInitial)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total alocado no periodo</CardTitle>
            <Layers className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{money(filteredAllocated)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rentabilidade atual</CardTitle>
            <Layers className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className={`text-2xl font-bold ${profitability >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{profitability.toFixed(2)}%</div><p className="text-xs text-muted-foreground mt-1">Lucro atual: {money(totalProfit)}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <AllocationChart items={allocationData} />
        <RecentTransactions items={recentTransactions} />
      </div>
    </InvestmentsModuleShell>
  );
}
