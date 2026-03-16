"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { investmentService } from "@/services/investmentService";
import { FinancialGoal } from "@/types/investments";
import { parseLocalizedNumber } from "@/lib/number";

export default function InvestmentsGoalsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [targetDate, setTargetDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setGoals(await investmentService.getFinancialGoals());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar metas");
    }
  };

  useEffect(() => { load(); }, []);

  const globalProgress = useMemo(() => {
    const target = goals.reduce((acc, item) => acc + item.targetAmount, 0);
    const current = goals.reduce((acc, item) => acc + item.currentAmount, 0);
    return target > 0 ? (current / target) * 100 : 0;
  }, [goals]);

  const onCreate = async () => {
    if (!name || !category || targetAmount <= 0) {
      setError("Preencha nome, categoria e uma meta maior que zero.");
      return;
    }
    try {
      setError(null);
      if (editingId) {
        await investmentService.updateFinancialGoal(editingId, { name, category, targetAmount, currentAmount, targetDate: targetDate || undefined });
      } else {
        await investmentService.createFinancialGoal({ name, category, targetAmount, currentAmount, targetDate: targetDate || undefined });
      }
      setName(""); setCategory(""); setTargetAmount(0); setCurrentAmount(0); setTargetDate(""); setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar meta");
    }
  };

  const onEdit = (item: FinancialGoal) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setTargetAmount(item.targetAmount);
    setCurrentAmount(item.currentAmount);
    setTargetDate(item.targetDate ? new Date(item.targetDate).toISOString().slice(0, 10) : "");
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setName(""); setCategory(""); setTargetAmount(0); setCurrentAmount(0); setTargetDate("");
  };

  const onDelete = async (id: string) => {
    try {
      setError(null);
      await investmentService.deleteFinancialGoal(id);
      if (editingId === id) onCancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir meta");
    }
  };

  return (
    <InvestmentsModuleShell org={org} section="Metas financeiras">
      <div>
        <h1 className="text-2xl font-bold">Metas financeiras</h1>
        <p className="text-sm text-muted-foreground">Acompanhe objetivos como aposentadoria, casa propria e reserva de emergencia.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Metas ativas</p><p className="text-2xl font-bold">{goals.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Progresso consolidado</p><p className="text-2xl font-bold">{globalProgress.toFixed(1)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Aposentadoria, Casa, Reserva" /></div>
            <div className="space-y-2"><Label>Meta</Label><Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(parseLocalizedNumber(e.target.value))} /></div>
            <div className="space-y-2"><Label>Atual</Label><Input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(parseLocalizedNumber(e.target.value))} /></div>
            <div className="space-y-2"><Label>Data alvo</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onCreate}>
              {editingId ? <><Pencil className="h-4 w-4 mr-2" />Salvar edicao</> : <><Plus className="h-4 w-4 mr-2" />Adicionar meta</>}
            </Button>
            {editingId && <Button variant="outline" onClick={onCancelEdit}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((item) => {
          const progress = item.targetAmount > 0 ? (item.currentAmount / item.targetAmount) * 100 : 0;
          return (
            <Card key={item.id} className={editingId === item.id ? "ring-2 ring-primary" : ""}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                <p className="text-sm font-medium">{progress.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.currentAmount)}</p>
                <p className="text-sm text-muted-foreground">Meta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.targetAmount)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </InvestmentsModuleShell>
  );
}