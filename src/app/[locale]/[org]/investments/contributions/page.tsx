"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { investmentService } from "@/services/investmentService";
import { Contribution, InvestmentAsset, Portfolio } from "@/types/investments";
import { parseLocalizedNumber } from "@/lib/number";

export default function InvestmentsContributionsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [investmentId, setInvestmentId] = useState("");
  const [type, setType] = useState<"aporte" | "retirada">("aporte");
  const [value, setValue] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async (preferredPortfolioId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const portfolioData = await investmentService.getPortfolios();
      setPortfolios(portfolioData);

      const selected = preferredPortfolioId || portfolioId || portfolioData[0]?.id || "";
      setPortfolioId(selected);

      const [contributionData, assetData] = await Promise.all([
        investmentService.getContributions(),
        selected ? investmentService.getInvestments(selected) : Promise.resolve([]),
      ]);

      setContributions(contributionData);
      setAssets(assetData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar aportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const monthTotal = useMemo(() => {
    const now = new Date();
    return contributions
      .filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear() && item.type === "aporte";
      })
      .reduce((acc, item) => acc + item.value, 0);
  }, [contributions]);

  const onPortfolioChange = async (nextPortfolioId: string) => {
    setPortfolioId(nextPortfolioId);
    setInvestmentId("");
    if (!nextPortfolioId) { setAssets([]); return; }
    setAssets(await investmentService.getInvestments(nextPortfolioId));
  };

  const onEdit = (item: Contribution) => {
    setEditingId(item.id);
    setType(item.type as "aporte" | "retirada");
    setValue(item.value);
    setQuantity((item as any).quantity || 0);
    setPrice((item as any).price || 0);
    setDate(new Date(item.date).toISOString().slice(0, 10));
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setType("aporte");
    setValue(0);
    setQuantity(0);
    setPrice(0);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const onCreate = async () => {
    if (!portfolioId || value <= 0) {
      setError("Selecione a carteira e informe um valor maior que zero.");
      return;
    }
    try {
      setError(null);
      if (editingId) {
        await investmentService.updateContribution(editingId, {
          type, value,
          quantity: quantity > 0 ? quantity : undefined,
          price: price > 0 ? price : undefined,
          date,
        });
      } else {
        await investmentService.createContribution({
          portfolioId,
          investmentId: investmentId || undefined,
          type, value,
          quantity: quantity > 0 ? quantity : undefined,
          price: price > 0 ? price : undefined,
          date,
        });
      }
      onCancelEdit();
      await load(portfolioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar aporte");
    }
  };

  const onDelete = async (id: string) => {
    try {
      setError(null);
      await investmentService.deleteContribution(id);
      if (editingId === id) onCancelEdit();
      await load(portfolioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir aporte");
    }
  };

  return (
    <InvestmentsModuleShell org={org} section="Aportes">
      <div>
        <h1 className="text-2xl font-bold">Aportes mensais</h1>
        <p className="text-sm text-muted-foreground">Controle entradas e retiradas por carteira e ativo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Aportes no mes</p><p className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotal)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lancamentos</p><p className="text-2xl font-bold">{contributions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Carteiras</p><p className="text-2xl font-bold">{portfolios.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="grid gap-3 md:grid-cols-6">
            <div className="space-y-2">
              <Label>Carteira</Label>
              <select value={portfolioId} onChange={(e) => onPortfolioChange(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm w-full">
                {portfolios.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ativo</Label>
              <select value={investmentId} onChange={(e) => setInvestmentId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm w-full">
                <option value="">Sem vinculo</option>
                {assets.map((item) => (
                  <option key={item.id} value={item.id}>{item.assetName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select value={type} onChange={(e) => setType(e.target.value as "aporte" | "retirada")} className="h-10 rounded-md border bg-background px-3 text-sm w-full">
                <option value="aporte">Aporte</option>
                <option value="retirada">Retirada</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" value={value} onChange={(e) => setValue(parseLocalizedNumber(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(parseLocalizedNumber(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Preco</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(parseLocalizedNumber(e.target.value))} />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={onCreate}>
              {editingId ? <><Pencil className="h-4 w-4 mr-2" />Salvar edicao</> : <><Plus className="h-4 w-4 mr-2" />Registrar</>}
            </Button>
            {editingId && <Button variant="outline" onClick={onCancelEdit}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando aportes...</div>
          ) : contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aporte registrado ainda.</p>
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
                  {contributions.map((item) => (
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