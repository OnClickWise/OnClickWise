"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Point = {
  label: string;
  saldo: number;
  investido: number;
};

function buildProjection(initial: number, monthly: number, annualRate: number, years: number): Point[] {
  const points: Point[] = [];
  const monthlyRate = annualRate / 100 / 12;
  let balance = initial;
  let invested = initial;
  const baseYear = new Date().getFullYear();

  for (let year = 0; year <= years; year += 1) {
    points.push({
      label: String(baseYear + year),
      saldo: Math.round(balance),
      investido: Math.round(invested),
    });

    for (let month = 0; month < 12; month += 1) {
      balance = balance * (1 + monthlyRate) + monthly;
      invested += monthly;
    }
  }

  return points;
}

type ProjectionToolProps = {
  initialAmount?: number;
  monthlyContribution?: number;
  layout?: "split" | "stacked";
};

export function ProjectionTool({
  initialAmount = 25000,
  monthlyContribution = 1200,
  layout = "split",
}: ProjectionToolProps) {
  const [initial, setInitial] = useState(initialAmount);
  const [monthly, setMonthly] = useState(monthlyContribution);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(8);

  useEffect(() => {
    setInitial(initialAmount);
  }, [initialAmount]);

  useEffect(() => {
    setMonthly(monthlyContribution);
  }, [monthlyContribution]);

  const data = useMemo(() => buildProjection(initial, monthly, rate, years), [initial, monthly, rate, years]);
  const finalAmount = data[data.length - 1]?.saldo ?? 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  const isStacked = layout === "stacked";

  return (
    <div className={isStacked ? "grid grid-cols-1 gap-6 min-w-0" : "grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 min-w-0"}>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Simulador</CardTitle>
          <CardDescription>Use a mesma logica de projecao do invest-front</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Capital inicial</Label>
            <Input type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Aporte mensal</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Rentabilidade anual (%)</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Horizonte (anos)</Label>
            <Input type="number" min={1} value={years} onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))} />
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Patrimonio projetado</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(finalAmount)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Evolucao da carteira</CardTitle>
          <CardDescription>Comparativo entre saldo e capital investido</CardDescription>
        </CardHeader>
        <CardContent className={isStacked ? "h-[280px] sm:h-[340px] lg:h-[380px]" : "h-[320px] lg:h-[380px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
              <YAxis width={72} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Area type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={2.5} fill="url(#saldoGradient)" />
              <Line type="monotone" dataKey="investido" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
