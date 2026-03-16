"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { investmentService } from "@/services/investmentService";
import { InvestmentAsset, Portfolio } from "@/types/investments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseLocalizedNumber } from "@/lib/number";

function getAssetTypeLabel(assetType: string) {
  const labels: Record<string, string> = {
    renda_fixa: "Renda fixa",
    acao: "Acoes",
    fii: "FII",
    cripto: "Cripto",
  };
  return labels[assetType] || assetType;
}

const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function InvestmentsPortfoliosPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [loading, setLoading] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);

  // Portfolio form (create / edit)
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [pfName, setPfName] = useState("");
  const [pfDescription, setPfDescription] = useState("");
  const [pfInitialAmount, setPfInitialAmount] = useState(0);

  // Asset form (create / edit)
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("renda_fixa");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetBroker, setAssetBroker] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [averagePrice, setAveragePrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const selectedPortfolio = useMemo(
    () => portfolios.find((p) => p.id === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId],
  );

  const loadAssets = async (portfolioId: string) => {
    if (!portfolioId) { setAssets([]); return; }
    try {
      setLoadingAssets(true);
      setAssets(await investmentService.getInvestments(portfolioId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar ativos");
    } finally {
      setLoadingAssets(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const pf = await investmentService.getPortfolios();
      setPortfolios(pf);
      const preferred = selectedPortfolioId || pf[0]?.id || "";
      setSelectedPortfolioId(preferred);
      if (preferred) await loadAssets(preferred);
      else setAssets([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar carteiras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(() => portfolios.reduce((acc, p) => acc + p.totalValue, 0), [portfolios]);

  // ── Portfolio CRUD ─────────────────────────────────────────────
  const openCreatePortfolio = () => {
    setEditingPortfolioId(null);
    setPfName("");
    setPfDescription("");
    setPfInitialAmount(0);
    setPortfolioDialogOpen(true);
  };

  const openEditPortfolio = (pf: Portfolio) => {
    setEditingPortfolioId(pf.id);
    setPfName(pf.name);
    setPfDescription("");
    setPfInitialAmount(pf.initialAmount);
    setPortfolioDialogOpen(true);
  };

  const onSavePortfolio = async () => {
    if (!pfName || pfInitialAmount < 0) {
      setError("Preencha um nome valido e um aporte inicial maior ou igual a zero.");
      return;
    }
    try {
      setError(null);
      if (editingPortfolioId) {
        await investmentService.updatePortfolio(editingPortfolioId, { name: pfName, description: pfDescription, initialAmount: pfInitialAmount });
      } else {
        await investmentService.createPortfolio({ name: pfName, description: pfDescription, initialAmount: pfInitialAmount });
      }
      setPortfolioDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar carteira");
    }
  };

  const onDeletePortfolio = async (id: string) => {
    if (!confirm("Excluir esta carteira? Todos os ativos vinculados também serão removidos.")) return;
    try {
      setError(null);
      await investmentService.deletePortfolioCascade(id);
      if (selectedPortfolioId === id) setSelectedPortfolioId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir carteira");
    }
  };

  // ── Asset CRUD ─────────────────────────────────────────────────
  const onEditAsset = (asset: InvestmentAsset) => {
    setEditingAssetId(asset.id);
    setAssetName(asset.assetName);
    setAssetType(asset.assetType);
    setAssetCategory(asset.category || "");
    setAssetBroker(asset.broker || "");
    setQuantity(asset.quantity);
    setAveragePrice(asset.averagePrice);
    setCurrentPrice(asset.currentPrice);
  };

  const onCancelEditAsset = () => {
    setEditingAssetId(null);
    setAssetName("");
    setAssetType("renda_fixa");
    setAssetCategory("");
    setAssetBroker("");
    setQuantity(0);
    setAveragePrice(0);
    setCurrentPrice(0);
  };

  const onSaveAsset = async () => {
    if (!selectedPortfolioId || !assetName || !assetType || quantity <= 0 || averagePrice <= 0) {
      setError("Informe carteira, nome, tipo, quantidade e preco medio validos para salvar o ativo.");
      return;
    }
    try {
      setError(null);
      const payload = {
        assetName, assetType,
        category: assetCategory || undefined,
        broker: assetBroker || undefined,
        quantity, averagePrice,
        currentPrice: currentPrice > 0 ? currentPrice : averagePrice,
      };
      if (editingAssetId) {
        await investmentService.updateInvestment(editingAssetId, payload);
      } else {
        await investmentService.createInvestment({ portfolioId: selectedPortfolioId, ...payload });
      }
      onCancelEditAsset();
      await Promise.all([load(), loadAssets(selectedPortfolioId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar ativo");
    }
  };

  const onDeleteAsset = async (assetId: string) => {
    try {
      setError(null);
      await investmentService.deleteInvestment(assetId);
      if (editingAssetId === assetId) onCancelEditAsset();
      await Promise.all([load(), loadAssets(selectedPortfolioId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir ativo");
    }
  };

  const onRefreshPrices = async () => {
    try {
      setRefreshingPrices(true);
      setError(null);
      await investmentService.refreshInvestmentPrices();
      await Promise.all([load(), loadAssets(selectedPortfolioId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar precos");
    } finally {
      setRefreshingPrices(false);
    }
  };

  return (
    <InvestmentsModuleShell org={org} section="Carteiras">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carteiras</h1>
          <p className="text-sm text-muted-foreground">Controle de carteiras e custodia por usuario.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefreshPrices} disabled={refreshingPrices}>
            {refreshingPrices && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atualizar precos
          </Button>
          <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreatePortfolio}><Plus className="h-4 w-4 mr-2" />Nova carteira</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPortfolioId ? "Editar carteira" : "Criar carteira"}</DialogTitle>
                <DialogDescription>Essa carteira sera vinculada ao usuario autenticado.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={pfName} onChange={(e) => setPfName(e.target.value)} /></div>
                <div className="space-y-1"><Label>Descricao</Label><Input value={pfDescription} onChange={(e) => setPfDescription(e.target.value)} placeholder="Ex.: carteira de longo prazo" /></div>
                <div className="space-y-1"><Label>Aporte inicial</Label><Input type="number" value={pfInitialAmount} onChange={(e) => setPfInitialAmount(parseLocalizedNumber(e.target.value))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>Cancelar</Button>
                <Button onClick={onSavePortfolio}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total em custodia</p><p className="text-2xl font-bold">{money(total)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Carteiras</p><p className="text-2xl font-bold">{portfolios.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Ticket medio</p><p className="text-2xl font-bold">{portfolios.length ? money(total / portfolios.length) : "R$ 0,00"}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando carteiras...</div>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Carteira</th>
                    <th className="text-left px-4 py-2 font-medium">Titular</th>
                    <th className="text-left px-4 py-2 font-medium">Aporte inicial</th>
                    <th className="text-left px-4 py-2 font-medium">Valor atual</th>
                    <th className="text-left px-4 py-2 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t cursor-pointer hover:bg-muted/40 ${selectedPortfolioId === item.id ? "bg-muted/40" : ""}`}
                      onClick={() => { setSelectedPortfolioId(item.id); loadAssets(item.id); }}
                    >
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2">{item.ownerName}</td>
                      <td className="px-4 py-2">{money(item.initialAmount)}</td>
                      <td className="px-4 py-2">{money(item.totalValue)}</td>
                      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditPortfolio(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => onDeletePortfolio(item.id)}><Trash2 className="h-4 w-4" /></Button>
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

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Ativos da carteira</h2>
            <p className="text-sm text-muted-foreground">
              {selectedPortfolio ? `Carteira selecionada: ${selectedPortfolio.name}` : "Selecione uma carteira para visualizar os ativos."}
            </p>
          </div>

          {selectedPortfolio && (
            <div className="mb-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <Input placeholder="Nome do ativo" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="renda_fixa">Renda fixa</option>
                  <option value="acao">Acoes</option>
                  <option value="fii">FII</option>
                  <option value="cripto">Cripto</option>
                </select>
                <Input placeholder="Categoria" value={assetCategory} onChange={(e) => setAssetCategory(e.target.value)} />
                <Input placeholder="Corretora" value={assetBroker} onChange={(e) => setAssetBroker(e.target.value)} />
                <Input type="number" placeholder="Quantidade" value={quantity} onChange={(e) => setQuantity(parseLocalizedNumber(e.target.value))} />
                <Input type="number" placeholder="Preco medio" value={averagePrice} onChange={(e) => setAveragePrice(parseLocalizedNumber(e.target.value))} />
                <Input type="number" placeholder="Preco atual" value={currentPrice} onChange={(e) => setCurrentPrice(parseLocalizedNumber(e.target.value))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={onSaveAsset}>{editingAssetId ? "Salvar edicao" : "Adicionar ativo"}</Button>
                {editingAssetId && <Button variant="outline" onClick={onCancelEditAsset}>Cancelar</Button>}
              </div>
            </div>
          )}

          {!selectedPortfolio ? (
            <p className="text-sm text-muted-foreground">Nenhuma carteira selecionada.</p>
          ) : loadingAssets ? (
            <div className="h-28 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando ativos...</div>
          ) : assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Essa carteira ainda nao possui ativos.</p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Ativo</th>
                    <th className="text-left px-4 py-2 font-medium">Tipo</th>
                    <th className="text-left px-4 py-2 font-medium">Qtd</th>
                    <th className="text-left px-4 py-2 font-medium">Preco medio</th>
                    <th className="text-left px-4 py-2 font-medium">Preco atual</th>
                    <th className="text-left px-4 py-2 font-medium">Total investido</th>
                    <th className="text-left px-4 py-2 font-medium">Valor atual</th>
                    <th className="text-left px-4 py-2 font-medium">Resultado</th>
                    <th className="text-left px-4 py-2 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((item) => (
                    <tr key={item.id} className={`border-t ${editingAssetId === item.id ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-2 font-medium">{item.assetName}</td>
                      <td className="px-4 py-2">{getAssetTypeLabel(item.assetType)}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{money(item.averagePrice)}</td>
                      <td className="px-4 py-2">{money(item.currentPrice)}</td>
                      <td className="px-4 py-2">{money(item.totalInvested)}</td>
                      <td className="px-4 py-2">{money(item.currentValue)}</td>
                      <td className={`px-4 py-2 ${item.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {money(item.profit)} ({item.profitPercentage.toFixed(2)}%)
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => onEditAsset(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => onDeleteAsset(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
