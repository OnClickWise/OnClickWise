"use client";

import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TransactionItem = {
  id: string;
  amount: number;
  date: string;
  label: string;
};

export function RecentTransactions({ items }: { items: TransactionItem[] }) {
  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Ultimas Movimentacoes</CardTitle>
        <CardDescription>Entradas recentes de ativos nas carteiras</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem movimentacoes recentes.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center bg-blue-100">
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold">+ {money(item.amount)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
