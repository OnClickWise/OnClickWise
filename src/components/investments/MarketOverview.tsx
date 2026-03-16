"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrazilianMarketData, type MarketItem } from "@/lib/investments-market";

const defaultCurrencies: MarketItem[] = [
  { symbol: "USD/BRL", name: "Dolar", price: "5.08", changePercent: 0.31 },
  { symbol: "EUR/BRL", name: "Euro", price: "5.54", changePercent: -0.19 },
  { symbol: "BTC/BRL", name: "Bitcoin", price: "373.000", changePercent: 1.11 },
  { symbol: "ETH/BRL", name: "Ethereum", price: "18.200", changePercent: 0.72 },
];

const defaultStocks: MarketItem[] = [
  { symbol: "PETR4", name: "Petrobras", price: "39.10", changePercent: 0.88 },
  { symbol: "VALE3", name: "Vale", price: "60.37", changePercent: -0.41 },
  { symbol: "ITUB4", name: "Itau", price: "33.25", changePercent: 0.56 },
  { symbol: "BBDC4", name: "Bradesco", price: "14.18", changePercent: 0.23 },
];

function Row({ item }: { item: MarketItem }) {
  const positive = item.changePercent >= 0;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.symbol}</p>
        <p className="truncate text-xs text-muted-foreground">{item.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">{item.price}</p>
        <p className={`text-xs flex items-center justify-end gap-1 ${positive ? "text-emerald-600" : "text-rose-600"}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {positive ? "+" : ""}
          {item.changePercent.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

export function MarketOverview() {
  const [currencies, setCurrencies] = useState(defaultCurrencies);
  const [stocks, setStocks] = useState(defaultStocks);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getBrazilianMarketData();
      if (data?.currencies?.length) setCurrencies(data.currencies);
      if (data?.stocks?.length) setStocks(data.stocks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <CardTitle>Mercado</CardTitle>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1 rounded hover:bg-muted disabled:opacity-50"
              aria-label="Atualizar mercado"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Badge variant="outline">Tempo real</Badge>
          </div>
        </div>
        <CardDescription>Cotacoes da B3 e moedas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 min-w-0">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">Moedas e Cripto</p>
          {currencies.map((item) => (
            <Row key={item.symbol} item={item} />
          ))}
        </div>
        <div className="pt-3 border-t">
          <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-1">Acoes B3</p>
          {stocks.map((item) => (
            <Row key={item.symbol} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
