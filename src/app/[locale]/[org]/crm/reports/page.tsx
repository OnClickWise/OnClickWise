'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { use } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import AuthGuard from '@/components/AuthGuard'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pipelineService, PipelineStage } from '@/services/pipelineService'
import { apiService, Lead } from '@/services/LeadService'
import {
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  BarChart3,
  Loader2,
} from 'lucide-react'

interface StageReport {
  id: string
  name: string
  color: string
  stage_type: string | null
  count: number
  value: number
  conversionRate: number
}

export default function CrmReportsPage({
  params,
}: {
  params: Promise<{ org: string; locale: string }>
}) {
  const { org, locale } = use(params)
  const [loading, setLoading] = React.useState(true)
  const [stages, setStages] = React.useState<StageReport[]>([])
  const [totalLeads, setTotalLeads] = React.useState(0)
  const [totalValue, setTotalValue] = React.useState(0)
  const [wonLeads, setWonLeads] = React.useState(0)
  const [lostLeads, setLostLeads] = React.useState(0)
  const [error, setError] = React.useState('')
  const reportRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const stagesRes = await pipelineService.getStages()
      // Only error on genuine failures, not on empty data
      if (stagesRes.success === false) {
        setError('Não foi possível carregar os dados do funil.')
        return
      }

      const rawStages = (stagesRes.data ?? stagesRes ?? []) as (PipelineStage & { leads?: Lead[] })[]

      // Empty pipeline — show zero state without error
      if (!Array.isArray(rawStages) || rawStages.length === 0) {
        setStages([])
        setTotalLeads(0)
        setTotalValue(0)
        setWonLeads(0)
        setLostLeads(0)
        return
      }

      // Try to get all leads for richer data
      let allLeads: Lead[] = []
      try {
        const leadsRes = await apiService.getLeads({ limit: 9999 })
        if (leadsRes.success && leadsRes.data?.leads) {
          allLeads = leadsRes.data.leads
        }
      } catch {
        // proceed with stage data only
      }

      const totalCount = allLeads.length
      setTotalLeads(totalCount)

      const totalVal = allLeads.reduce((sum, l) => sum + (l.value || 0), 0)
      setTotalValue(totalVal)

      // Count won/lost by stage_type
      const stageMap: Record<string, PipelineStage & { leads?: Lead[] }> = {}
      rawStages.forEach((s) => { stageMap[s.id] = s })

      const stageReports: StageReport[] = rawStages.map((stage) => {
        const stageLeads = allLeads.filter((l) => {
          const leadStatus = (l.status || '').toLowerCase().trim()
          const stageSlug = (stage.slug || '').toLowerCase().trim()
          return leadStatus === stageSlug || leadStatus.replace(/-/g, '') === stageSlug.replace(/-/g, '')
        })
        const count = stageLeads.length
        const value = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0)
        const conversionRate = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color || '',
          stage_type: (stage as any).stage_type || null,
          count,
          value,
          conversionRate,
        }
      })

      const wonCount = stageReports
        .filter((s) => s.stage_type === 'won')
        .reduce((sum, s) => sum + s.count, 0)
      const lostCount = stageReports
        .filter((s) => s.stage_type === 'lost')
        .reduce((sum, s) => sum + s.count, 0)

      setWonLeads(wonCount)
      setLostLeads(lostCount)
      setStages(stageReports)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar relatório.')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    window.print()
  }

  const exportExcel = () => {
    const rows = [
      ['Relatório CRM - Funil de Vendas', '', '', '', ''],
      ['Gerado em:', new Date().toLocaleString('pt-BR'), '', '', ''],
      [],
      ['Etapa', 'Leads', 'Valor Total (R$)', 'Distribuição (%)', 'Tipo'],
      ...stages.map((s) => [
        s.name,
        s.count,
        s.value,
        s.conversionRate,
        s.stage_type || '-',
      ]),
      [],
      ['RESUMO', '', '', '', ''],
      ['Total de Leads', totalLeads, '', '', ''],
      ['Valor Total (R$)', totalValue, '', '', ''],
      ['Leads Ganhos', wonLeads, '', '', ''],
      ['Leads Perdidos', lostLeads, '', '', ''],
      [
        'Taxa de Conversão (%)',
        totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
        '',
        '',
        '',
      ],
    ]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório CRM')
    XLSX.writeFile(wb, `relatorio-crm-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const conversionRate =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  const getStageBarColor = (stage_type: string | null) => {
    switch (stage_type) {
      case 'won': return 'bg-green-500'
      case 'lost': return 'bg-red-400'
      case 'entry': return 'bg-blue-400'
      default: return 'bg-primary'
    }
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 print:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/dashboard`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/crm/pipeline`}>CRM</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Relatórios</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Export buttons */}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={exportPDF} disabled={loading}>
                <FileText className="w-4 h-4 mr-1.5" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel} disabled={loading}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Exportar Excel
              </Button>
            </div>
          </header>

          {/* MAIN */}
          <div ref={reportRef} className="flex flex-col gap-6 p-6">

            {/* Title row */}
            <div className="flex items-center justify-between print:block">
              <div>
                <h1 className="text-2xl font-bold">Relatório CRM</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Funil de vendas — {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                </p>
              </div>
              {/* Print-only export buttons */}
              <div className="hidden print:flex gap-2 mt-2">
                <span className="text-sm text-gray-500">Gerado em: {new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && !loading && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalLeads}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ganhos / Perdidos</CardTitle>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xl">
                          <CheckCircle2 className="w-4 h-4" />{wonLeads}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="flex items-center gap-1 text-red-500 font-bold text-xl">
                          <XCircle className="w-4 h-4" />{lostLeads}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Conversão</CardTitle>
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{conversionRate}%</div>
                      <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${conversionRate}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stage breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Distribuição por Etapa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stages.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4 text-center">
                        Nenhuma etapa encontrada. Configure o funil em CRM → Funil.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {stages.map((stage) => (
                          <div key={stage.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${getStageBarColor(stage.stage_type)}`} />
                                <span className="font-medium">{stage.name}</span>
                                {stage.stage_type && (
                                  <span className="text-xs text-muted-foreground capitalize">({stage.stage_type})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <span>{stage.count} leads</span>
                                {stage.value > 0 && (
                                  <span className="text-green-600 font-medium">
                                    {stage.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                  </span>
                                )}
                                <span className="w-10 text-right">{stage.conversionRate}%</span>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getStageBarColor(stage.stage_type)}`}
                                style={{ width: `${stage.conversionRate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tabela Resumo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Etapa</th>
                            <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Leads</th>
                            <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Valor</th>
                            <th className="text-right py-2 px-3 font-semibold text-muted-foreground">%</th>
                            <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stages.map((stage) => (
                            <tr key={stage.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3 font-medium">{stage.name}</td>
                              <td className="py-2 px-3 text-right">{stage.count}</td>
                              <td className="py-2 px-3 text-right text-green-600">
                                {stage.value > 0
                                  ? stage.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right">{stage.conversionRate}%</td>
                              <td className="py-2 px-3 text-right capitalize text-muted-foreground">
                                {stage.stage_type || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold bg-muted/30">
                            <td className="py-2 px-3">Total</td>
                            <td className="py-2 px-3 text-right">{totalLeads}</td>
                            <td className="py-2 px-3 text-right text-green-600">
                              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                            </td>
                            <td className="py-2 px-3 text-right">100%</td>
                            <td className="py-2 px-3" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
