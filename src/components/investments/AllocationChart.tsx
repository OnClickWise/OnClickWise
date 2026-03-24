"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#0ea5e9", "#64748b", "#ef4444", "#14b8a6", "#8b5cf6"];

type AllocationItem = {
  name: string;
  value: number;
};

export function AllocationChart({ items }: { items: AllocationItem[] }) {
  const data = items.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Alocacao da Carteira</CardTitle>
        <CardDescription>Distribuicao atual por classe de ativo</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full min-w-0 flex-col gap-4">
        {data.length === 0 || total <= 0 ? (
          <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sem ativos suficientes para montar a alocacao.
          </div>
        ) : (
          <>
            <div className="min-h-[220px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={2}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => {
                      const percent = total > 0 ? (Number(value) / total) * 100 : 0;
                      return [`${money(Number(value))} (${percent.toFixed(1)}%)`, "Valor"];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.map((item) => {
                const percent = total > 0 ? (item.value / total) * 100 : 0;

                return (
                  <div key={item.name} className="flex min-w-0 items-start gap-2 rounded-md border bg-muted/20 px-3 py-2">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {money(item.value)} · {percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
