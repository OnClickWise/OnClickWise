"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvestmentsModuleShell } from "@/components/investments/InvestmentsModuleShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InvestmentsInvestorsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = use(params);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(`/${"pt"}/${org}/investments/portfolios`);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <InvestmentsModuleShell org={org} section="Carteiras">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold">Fluxo atualizado do modulo</h1>
            <p className="text-sm text-muted-foreground">A area de Investidores foi descontinuada. Agora as carteiras pertencem diretamente ao usuario autenticado.</p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href={`/${"pt"}/${org}/investments/portfolios`}>Ir para Carteiras</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </InvestmentsModuleShell>
  );
}
