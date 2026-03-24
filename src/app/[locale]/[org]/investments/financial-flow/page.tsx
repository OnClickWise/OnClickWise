"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { investmentService } from "@/services/investmentService";
import { FinancialFlow } from "@/types/investments";
import { parseLocalizedNumber } from "@/lib/number";
import { useInvestmentModals } from "@/hooks/useInvestmentModals";

export default function InvestmentsFinancialFlowPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const { confirmDeleteFinancialFlow } = useInvestmentModals();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flows, setFlows] = useState<FinancialFlow[]>([]);
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await investmentService.getFinancialFlows();
      setFlows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar fluxo financeiro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    return flows.reduce(
      (acc, item) => {
        if (item.type === "income") acc.income += item.value;
        if (item.type === "expense") acc.expense += item.value;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [flows]);

  const onCreate = async () => {
    if (!category || value <= 0) {
      setError("Informe categoria e valor maior que zero para salvar o lancamento.");
      return;
    }
    try {
      setError(null);
      if (editingId) {
        await investmentService.updateFinancialFlow(editingId, { type, category, description, value, date });
      } else {
        await investmentService.createFinancialFlow({ type, category, description, value, date });
      }
      setCategory("");
      setDescription("");
      setValue(0);
      setType("income");
      setDate(new Date().toISOString().slice(0, 10));
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar lancamento");
    }
  };

  const onEdit = (item: FinancialFlow) => {
    setEditingId(item.id);
    setType(item.type as "income" | "expense");
    setCategory(item.category);
    setDescription(item.description || "");
    setValue(item.value);
    setDate(new Date(item.date).toISOString().slice(0, 10));
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setType("income");
    setCategory("");
    setDescription("");
    setValue(0);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const onDelete = async (id: string) => {
    const flow = flows.find(f => f.id === id);
    if (!flow) return;

    const confirmed = await confirmDeleteFinancialFlow(
      flow.category,
      flow.value,
      flow.type,
    );
    
    if (!confirmed) return;

    try {
      setError(null);
      await investmentService.deleteFinancialFlow(id);
      if (editingId === id) onCancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir lancamento");
    }
  };

  return (
    <InvestmentsModuleShell org={org} section="Fluxo financeiro">
      <div>
        <h1 className="text-2xl font-bold">Fluxo financeiro</h1>
        <p className="text-sm text-muted-foreground">Receitas e despesas do usuario para integrar o acompanhamento patrimonial.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Receitas</p><p className="text-2xl font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.income)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Despesas</p><p className="text-2xl font-bold text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.expense)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Saldo</p><p className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.income - totals.expense)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} className="h-10 rounded-md border bg-background px-3 text-sm w-full">
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Salario, Moradia" />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhe opcional" />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" value={value} onChange={(e) => setValue(parseLocalizedNumber(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onCreate}>
              {editingId ? <><Pencil className="h-4 w-4 mr-2" />Salvar edicao</> : <><Plus className="h-4 w-4 mr-2" />Adicionar lancamento</>}
            </Button>
            {editingId && <Button variant="outline" onClick={onCancelEdit}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando fluxo...</div>
          ) : flows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lancamento financeiro registrado.</p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Data</th>
                    <th className="text-left px-4 py-2 font-medium">Tipo</th>
                    <th className="text-left px-4 py-2 font-medium">Categoria</th>
                    <th className="text-left px-4 py-2 font-medium">Descricao</th>
                    <th className="text-left px-4 py-2 font-medium">Valor</th>
                    <th className="text-left px-4 py-2 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.map((item) => (
                    <tr key={item.id} className={`border-t ${editingId === item.id ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-2">{new Intl.DateTimeFormat('pt-BR').format(new Date(item.date))}</td>
                      <td className="px-4 py-2">{item.type === 'income' ? 'Receita' : 'Despesa'}</td>
                      <td className="px-4 py-2">{item.category}</td>
                      <td className="px-4 py-2">{item.description || '-'}</td>
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