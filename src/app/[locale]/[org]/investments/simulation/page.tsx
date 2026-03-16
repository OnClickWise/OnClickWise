"use client";

import { use, useEffect, useMemo, useState } from "react";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { ProjectionTool } from "@/components/investments/ProjectionTool";
import { investmentService } from "@/services/investmentService";

export default function InvestmentsSimulationPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const [totalPatrimony, setTotalPatrimony] = useState(0);
  const [monthlyBase, setMonthlyBase] = useState(1200);

  useEffect(() => {
    const load = async () => {
      try {
        const portfolios = await investmentService.getPortfolios();
        const patrimony = portfolios.reduce((acc, item) => acc + item.totalValue, 0);
        const invested = portfolios.reduce((acc, item) => acc + item.investedTotal, 0);

        setTotalPatrimony(patrimony);
        setMonthlyBase(Math.max(1200, Math.round(invested / 12)));
      } catch {
        setTotalPatrimony(0);
        setMonthlyBase(1200);
      }
    };

    load();
  }, []);

  const initialBase = useMemo(() => Math.max(25000, Math.round(totalPatrimony)), [totalPatrimony]);

  return (
    <InvestmentsModuleShell org={org} section="Simulacao">
      <div>
        <h1 className="text-2xl font-bold">Simulador Financeiro</h1>
        <p className="text-sm text-muted-foreground">Projecao de crescimento com aportes e juros compostos.</p>
      </div>
      <ProjectionTool initialAmount={initialBase} monthlyContribution={monthlyBase} />
    </InvestmentsModuleShell>
  );
}
