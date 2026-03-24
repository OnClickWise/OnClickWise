"use client";

import { use, useEffect, useMemo, useState } from "react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { investmentService } from "@/services/investmentService";
import { Contribution, FinancialFlow, InvestmentAsset, Portfolio } from "@/types/investments";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ChartFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function MiniLegend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="flex flex-wrap gap-3 pt-3 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className={`block h-0.5 w-5 shrink-0 rounded-full ${item.dashed ? "border-t-2 border-dashed bg-transparent" : ""}`}
            style={item.dashed ? { borderColor: item.color } : { backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function InvestmentsReportsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [flows, setFlows] = useState<FinancialFlow[]>([]);

  useEffect(() => {
    const load = async () => {
      const [portfolioData, assetsData, contributionData, flowData] = await Promise.all([
        investmentService.getPortfolios(),
        investmentService.getInvestments(),
        investmentService.getContributions(),
        investmentService.getFinancialFlows(),
      ]);

      setPortfolios(portfolioData);
      setAssets(assetsData);
      setContributions(contributionData);
      setFlows(flowData);
    };

    load();
  }, []);

  const reportSeries = useMemo(() => {
    const dates = [
      ...portfolios.map((item) => item.createdAt),
      ...assets.map((item) => item.createdAt),
      ...contributions.map((item) => item.date),
      ...flows.map((item) => item.date),
    ].filter(Boolean);

    if (dates.length === 0) return [] as Array<{ label: string; patrimonio: number; investido: number; rentabilidade: number; receitas: number; despesas: number }>;

    const start = new Date(dates.sort()[0]);
    const end = new Date();
    const months: Date[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= end) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months.map((monthStart) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
      const initial = portfolios.filter((item) => new Date(item.createdAt) <= monthEnd).reduce((acc, item) => acc + item.initialAmount, 0);
      const investedMovements = contributions.filter((item) => new Date(item.date) <= monthEnd).reduce((acc, item) => acc + (item.type === "aporte" ? item.value : -item.value), 0);
      const patrimonioAtivos = assets.filter((item) => new Date(item.createdAt) <= monthEnd).reduce((acc, item) => acc + item.currentValue, 0);
      const receitas = flows.filter((item) => new Date(item.date) <= monthEnd && item.type === "income").reduce((acc, item) => acc + item.value, 0);
      const despesas = flows.filter((item) => new Date(item.date) <= monthEnd && item.type === "expense").reduce((acc, item) => acc + item.value, 0);
      const investido = initial + investedMovements;
      const patrimonio = initial + patrimonioAtivos;
      const rentabilidade = investido > 0 ? ((patrimonio - investido) / investido) * 100 : 0;

      return {
        label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(monthStart),
        patrimonio: Number(patrimonio.toFixed(2)),
        investido: Number(investido.toFixed(2)),
        rentabilidade: Number(rentabilidade.toFixed(2)),
        receitas: Number(receitas.toFixed(2)),
        despesas: Number(despesas.toFixed(2)),
      };
    });
  }, [portfolios, assets, contributions, flows]);

  const topAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 8)
      .map((item) => ({
        name: item.assetName,
        valor: item.currentValue,
        rentabilidade: item.profitPercentage,
      }));
  }, [assets]);

  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <InvestmentsModuleShell org={org} section="Relatorios">
      <div>
        <h1 className="text-2xl font-bold">Relatorios e graficos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe a evolucao do patrimonio, a rentabilidade e o impacto do fluxo financeiro.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Evolucao do patrimonio</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {reportSeries.length < 2 ? (
              <div className="h-[260px] sm:h-[340px]">
                <ChartFallback message="Os graficos comparativos precisam de pelo menos 2 periodos para exibicao adequada." />
              </div>
            ) : (
              <>
                <div className="h-[260px] sm:h-[340px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
                      <YAxis width={72} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                      <Tooltip formatter={(value: number) => money(value)} />
                      <Line type="monotone" dataKey="patrimonio" name="Patrimonio" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="investido" name="Investido" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <MiniLegend items={[{ label: "Patrimonio", color: "#2563eb" }, { label: "Investido", color: "#64748b", dashed: true }]} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Rentabilidade mensal</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {reportSeries.length < 2 ? (
              <div className="h-[260px] sm:h-[340px]">
                <ChartFallback message="A rentabilidade mensal sera exibida quando houver mais de um periodo no historico." />
              </div>
            ) : (
              <div className="h-[260px] sm:h-[340px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
                    <YAxis width={72} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                    <Tooltip formatter={(value: number) => `${Number(value).toFixed(2)}%`} />
                    <Bar dataKey="rentabilidade" name="Rentabilidade" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Fluxo financeiro acumulado</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {reportSeries.length < 2 ? (
              <div className="h-[260px] sm:h-[340px]">
                <ChartFallback message="O fluxo acumulado depende de historico mensal para comparacao entre receitas e despesas." />
              </div>
            ) : (
              <>
                <div className="h-[260px] sm:h-[340px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
                      <YAxis width={72} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                      <Tooltip formatter={(value: number) => money(value)} />
                      <Bar dataKey="receitas" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={28} />
                      <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <MiniLegend items={[{ label: "Receitas", color: "#16a34a" }, { label: "Despesas", color: "#ef4444" }]} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Top ativos da carteira</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[340px]">
            {topAssets.length === 0 ? (
              <ChartFallback message="Cadastre ativos na carteira para visualizar os maiores pesos do portfolio." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAssets} layout="vertical" margin={{ left: 0, right: 20, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                  <YAxis type="category" dataKey="name" width={84} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name) => name === 'valor' ? money(value) : `${Number(value).toFixed(2)}%`} />
                  <Bar dataKey="valor" name="valor" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </InvestmentsModuleShell>
  );
}