"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { investmentService } from "@/services/investmentService";
import { Dividend, InvestmentAsset, Portfolio } from "@/types/investments";
import { parseLocalizedNumber } from "@/lib/number";

export default function InvestmentsDividendsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [investmentId, setInvestmentId] = useState("");
  const [value, setValue] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("dividendo");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextPortfolioId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const portfolioData = await investmentService.getPortfolios();
      const selected = nextPortfolioId || portfolioId || portfolioData[0]?.id || "";
      const assetData = selected ? await investmentService.getInvestments(selected) : [];
      const dividendData = await investmentService.getDividends();
      setPortfolios(portfolioData);
      setPortfolioId(selected);
      setAssets(assetData);
      setDividends(dividendData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dividendos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalDividends = useMemo(() => dividends.reduce((acc, item) => acc + item.value, 0), [dividends]);

  const onEdit = (item: Dividend) => {
    setEditingId(item.id);
    setValue(item.value);
    setDate(new Date(item.date).toISOString().slice(0, 10));
    setType(item.type);
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setValue(0);
    setDate(new Date().toISOString().slice(0, 10));
    setType("dividendo");
    setInvestmentId("");
  };

  const onCreate = async () => {
    try {
      setError(null);
      if (editingId) {
        if (value <= 0) {
          setError("Informe um valor maior que zero para salvar o dividendo.");
          return;
        }
        await investmentService.updateDividend(editingId, { value, date, type });
      } else {
        if (!investmentId || value <= 0) {
          setError("Selecione um ativo e informe um valor maior que zero.");
          return;
        }
        await investmentService.createDividend({ investmentId, value, date, type });
      }
      onCancelEdit();
      await load(portfolioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar dividendo");
    }
  };

  const onDelete = async (id: string) => {
    try {
      setError(null);
      await investmentService.deleteDividend(id);
      if (editingId === id) onCancelEdit();
      await load(portfolioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir dividendo");
    }
  };

  return (
    <InvestmentsModuleShell org={org} section="Dividendos">
      <div>
        <h1 className="text-2xl font-bold">Dividendos</h1>
        <p className="text-sm text-muted-foreground">Registre e acompanhe proventos recebidos pelos seus ativos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total recebido</p><p className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDividends)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Registros</p><p className="text-2xl font-bold">{dividends.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Carteira</Label>
              <select value={portfolioId} onChange={async (e) => { const v = e.target.value; setPortfolioId(v); setInvestmentId(""); setAssets(v ? await investmentService.getInvestments(v) : []); }} disabled={!!editingId} className="h-10 rounded-md border bg-background px-3 text-sm w-full disabled:opacity-50">
                {portfolios.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ativo</Label>
              <select value={investmentId} onChange={(e) => setInvestmentId(e.target.value)} disabled={!!editingId} className="h-10 rounded-md border bg-background px-3 text-sm w-full disabled:opacity-50">
                <option value="">Selecione</option>
                {assets.map((item) => (<option key={item.id} value={item.id}>{item.assetName}</option>))}
              </select>
            </div>
            <div className="space-y-2"><Label>Valor</Label><Input type="number" value={value} onChange={(e) => setValue(parseLocalizedNumber(e.target.value))} /></div>
            <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Tipo</Label><Input value={type} onChange={(e) => setType(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onCreate}>
              {editingId ? <><Pencil className="h-4 w-4 mr-2" />Salvar edicao</> : <><Plus className="h-4 w-4 mr-2" />Registrar dividendo</>}
            </Button>
            {editingId && <Button variant="outline" onClick={onCancelEdit}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando dividendos...</div>
          ) : dividends.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dividendo registrado ainda.</p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Data</th>
                    <th className="text-left px-4 py-2 font-medium">Carteira</th>
                    <th className="text-left px-4 py-2 font-medium">Ativo</th>
                    <th className="text-left px-4 py-2 font-medium">Tipo</th>
                    <th className="text-left px-4 py-2 font-medium">Valor</th>
                    <th className="text-left px-4 py-2 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((item) => (
                    <tr key={item.id} className={`border-t ${editingId === item.id ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-2">{new Intl.DateTimeFormat('pt-BR').format(new Date(item.date))}</td>
                      <td className="px-4 py-2">{item.portfolioName || '-'}</td>
                      <td className="px-4 py-2">{item.assetName || '-'}</td>
                      <td className="px-4 py-2">{item.type}</td>
                      <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </InvestmentsModuleShell>
  );
}