"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  ReferenceArea,
  ReferenceDot
} from "recharts"
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  Activity,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Shield,
  Crown,
  User
} from "lucide-react"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils"

// Cores vibrantes para os gráficos (escala 600-700 para melhor contraste e visibilidade)
const COLORS = [
  '#2563eb', // blue-600 - Azul vibrante
  '#4f46e5', // indigo-600 - Índigo vibrante
  '#7c3aed', // violet-600 - Violeta vibrante
  '#9333ea', // purple-600 - Roxo vibrante
  '#c026d3', // fuchsia-600 - Fúcsia vibrante
  '#db2777', // pink-600 - Rosa vibrante
  '#dc2626', // red-600 - Vermelho vibrante
  '#16a34a', // green-600 - Verde vibrante
  '#ea580c', // orange-600 - Laranja vibrante
  '#ca8a04', // yellow-600 - Amarelo vibrante
  '#0891b2', // cyan-600 - Ciano vibrante
  '#64748b', // slate-600 - Cinza (mantido para contraste)
]

interface DashboardStats {
  totalLeads: number
  totalConversations: number
  totalValue: number
  conversionRate: number
  leadsByStatus: { status: string; count: number; value: number; stageType?: string }[]
  leadsBySource: { source: string; count: number }[]
  monthlyTrend: { month: string; fullDate?: string; leads: number; value: number }[]
  conversationStats: { platform: string; count: number; active: number }[]
  leadsByUser?: { userName: string; count: number; value: number }[]
}

// Função helper para processar leads em tendências diárias ou mensais
const processLeadTrend = (
  leads: Lead[], 
  timePeriod: string, 
  customStartDate?: string, 
  customEndDate?: string,
  locale: string = 'pt-BR',
  pipelineStages: any[] = []
): { month: string; fullDate?: string; leads: number; value: number }[] => {
  const now = new Date();
  const monthNames = locale === 'pt-BR' 
    ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Determinar período e se deve usar dias ou meses
  let startDate: Date;
  let endDate: Date = now;
  let useDays = false;
  
  if (timePeriod === 'custom' && customStartDate && customEndDate) {
    // Parse de datas customizadas para evitar problemas de timezone
    const [startYear, startMonth, startDay] = customStartDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = customEndDate.split('-').map(Number);
    
    startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    
    // Validações de segurança
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      // Datas inválidas - retornar array vazio
      return [];
    }
    
    if (startDate.getTime() > endDate.getTime()) {
      // Data inicial maior que final - trocar
      [startDate, endDate] = [endDate, startDate];
    }
    
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Limitar o período máximo a 1 ano (365 dias)
    if (diffDays > 365) {
      // Ajustar a data inicial para 1 ano antes da data final
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 365, 0, 0, 0, 0);
    }
    
    // Recalcular diffDays após possível ajuste
    const finalDiffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    useDays = finalDiffDays <= 60;
  } else if (timePeriod === '7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    useDays = true;
  } else if (timePeriod === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    useDays = true;
  } else if (timePeriod === '3months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    useDays = false;
  } else { // 6months ou default
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    useDays = false;
  }
  
  const result: { month: string; fullDate?: string; leads: number; value: number }[] = [];
  
  if (useDays) {
    // Garantir que startDate e endDate estão normalizados
    const adjustedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
    const adjustedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);
    
    // Processar por dias - calcular dias inclusive
    const days = Math.floor((adjustedEndDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Validação de segurança: limitar a 365 dias
    const safeDays = Math.min(days, 365);
    
    for (let i = 0; i <= safeDays; i++) {
      const date = new Date(adjustedStartDate.getFullYear(), adjustedStartDate.getMonth(), adjustedStartDate.getDate() + i, 0, 0, 0, 0);
      
      // Verificar se a data está dentro do range selecionado
      if (date.getTime() > adjustedEndDate.getTime()) {
        break;
      }
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const dayLeads = leads.filter(lead => {
        if (!lead.created_at) return false;
        const leadDate = new Date(lead.created_at);
        if (isNaN(leadDate.getTime())) return false;
        const leadDateKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}-${String(leadDate.getDate()).padStart(2, '0')}`;
        return leadDateKey === dateKey;
      });
      
      const dayValue = dayLeads.reduce((sum, lead) => {
        // Encontrar a stage correspondente para verificar se é do tipo 'lost'
        const matchingStage = pipelineStages.find((s: any) => s.slug === lead.status)
        if (matchingStage && matchingStage.stage_type === 'lost') return sum;
        return sum + (Number(lead.value) || 0);
      }, 0);
      
      // Label do eixo X: apenas número do dia (sem mês)
      const shortLabel = `${date.getDate()}`;
      
      // Data completa para tooltip (sempre com ano)
      const fullDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      
      result.push({
        month: shortLabel,
        fullDate: fullDate,
        leads: dayLeads.length,
        value: dayValue
      });
    }
  } else {
    // Processar por meses
    const months = Math.ceil((endDate.getFullYear() * 12 + endDate.getMonth()) - (startDate.getFullYear() * 12 + startDate.getMonth()));
    
    // Validação de segurança: limitar a 24 meses (2 anos)
    const safeMonths = Math.min(Math.max(months, 0), 24);
    
    for (let i = 0; i <= safeMonths; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      const currentYear = date.getFullYear();
      
      const monthLeads = leads.filter(lead => {
        if (!lead.created_at) return false;
        const leadDate = new Date(lead.created_at);
        if (isNaN(leadDate.getTime())) return false;
        const leadMonthKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`;
        return leadMonthKey === monthKey;
      });
      
      const monthValue = monthLeads.reduce((sum, lead) => {
        // Encontrar a stage correspondente para verificar se é do tipo 'lost'
        const matchingStage = pipelineStages.find((s: any) => s.slug === lead.status)
        if (matchingStage && matchingStage.stage_type === 'lost') return sum;
        return sum + (Number(lead.value) || 0);
      }, 0);
      
      // Label para eixo X (NUNCA mostra ano no rodapé, só mês)
      const shortLabel = monthName;
      
      // Data completa para tooltip (sempre com ano)
      const fullDate = `${monthName} ${currentYear}`;
      
      result.push({
        month: shortLabel,
        fullDate: fullDate,
        leads: monthLeads.length,
        value: monthValue
      });
    }
  }
  
  return result;
}

// Componente para Dashboard de Admin
const AdminDashboard = ({ stats, leads, pipelineStages }: { stats: DashboardStats; leads: Lead[]; pipelineStages: any[] }) => {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  
  // Usar todas as stages do pipeline (agora são dinâmicas/personalizadas)
  const pipelineData = stats.leadsByStatus;
  
  // Criar mapeamento de status para cor de fundo das stages
  const statusToColorMap = React.useMemo(() => {
    const map = new Map<string, string>()
    
    pipelineData.forEach((entry) => {
      // Tentar encontrar a stage pelo nome ou pelo slug
      const matchingStage = pipelineStages.find((s: any) => {
        return s.name === entry.status || s.slug === entry.status
      })
      
      if (matchingStage && matchingStage.color) {
        const hexColor = extractBgColor(matchingStage.color)
        map.set(entry.status, hexColor)
      } else {
        // Se não encontrar, usar cor padrão da empresa (já normalizada)
        map.set(entry.status, '#2563eb')
      }
    })
    
    return map
  }, [pipelineData, pipelineStages])
  
  // Estado para controlar o segmento selecionado no donut chart
  const [selectedSource, setSelectedSource] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  
  // Estados para comparação no gráfico de evolução
  const [selectedPeriod, setSelectedPeriod] = React.useState<number | null>(null);
  const [dragStart, setDragStart] = React.useState<number | null>(null);
  const [dragEnd, setDragEnd] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Estado para controlar qual métrica está visível no Evolution Chart
  const [visibleMetrics, setVisibleMetrics] = React.useState<{ leads: boolean; value: boolean }>({
    leads: true,
    value: true,
  });
  
  // Estados para filtro de período
  const [timePeriod, setTimePeriod] = React.useState<string>('6months');
  const [customStartDate, setCustomStartDate] = React.useState<string>('');
  const [customEndDate, setCustomEndDate] = React.useState<string>('');
  
  // Estado para controlar exibição de fontes adicionais
  const [showMoreSources, setShowMoreSources] = React.useState(false);
  
  // Refs para os cards
  const leadSourcesCardRef = React.useRef<HTMLDivElement>(null);
  const leadSourcesChartRef = React.useRef<HTMLDivElement>(null);
  const evolutionChartRef = React.useRef<HTMLDivElement>(null);
  
  // Função para alternar seleção de fonte com useCallback para evitar re-renders
  const handleSourceClick = React.useCallback((sourceName: string, index: number) => {
    setSelectedSource(prev => {
      const newValue = prev === sourceName ? null : sourceName;
      setActiveIndex(newValue ? index : null);
      return newValue;
    });
  }, []);
  
  // Função para alternar visibilidade de métrica no Evolution Chart
  const handleMetricToggle = React.useCallback((metric: 'leads' | 'value') => {
    setVisibleMetrics(prev => {
      const currentValue = prev[metric];
      // Se ambas estão visíveis, esconde a outra e deixa só essa
      if (prev.leads && prev.value) {
        return metric === 'leads' 
          ? { leads: true, value: false }
          : { leads: false, value: true };
      }
      // Se só essa está visível, mostra ambas
      if (currentValue && !prev[metric === 'leads' ? 'value' : 'leads']) {
        return { leads: true, value: true };
      }
      // Se a outra está visível, troca
      return metric === 'leads'
        ? { leads: true, value: false }
        : { leads: false, value: true };
    });
  }, []);
  
  // Obter dados da fonte selecionada (usando useMemo para evitar recalcular desnecessariamente)
  const selectedSourceData = React.useMemo(() => {
    return selectedSource 
      ? stats.leadsBySource.find(s => s.source === selectedSource)
      : null;
  }, [selectedSource, stats.leadsBySource]);
  
  // Removido: useEffect de animação explode - mantendo apenas efeito de opacidade
  
  // Adicionar listener para clicar fora do Lead Sources
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leadSourcesCardRef.current && !leadSourcesCardRef.current.contains(event.target as Node)) {
        setSelectedSource(null);
      }
    };
    
    if (selectedSource !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedSource]);
  
  // Adicionar listener para clicar fora do Evolution Chart
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (evolutionChartRef.current && !evolutionChartRef.current.contains(event.target as Node)) {
        setSelectedPeriod(null);
      }
    };
    
    if (selectedPeriod !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedPeriod]);
  
  // Verificar se o período customizado excede 1 ano
  const periodExceeds1Year = React.useMemo(() => {
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      const [startYear, startMonth, startDay] = customStartDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = customEndDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 365;
      }
    }
    return false;
  }, [timePeriod, customStartDate, customEndDate]);
  
  // Processar dados do gráfico Evolution baseado no período selecionado
  const filteredMonthlyTrend = React.useMemo(() => {
    return processLeadTrend(leads, timePeriod, customStartDate, customEndDate, locale, pipelineStages);
  }, [leads, timePeriod, customStartDate, customEndDate, locale, pipelineStages]);
  
  // Calcular dados adicionais usando stage_type
  const wonLeads = stats.leadsByStatus
    .filter(s => s.stageType === 'won')
    .reduce((sum, s) => sum + s.count, 0);
  const lostLeads = stats.leadsByStatus
    .filter(s => s.stageType === 'lost')
    .reduce((sum, s) => sum + s.count, 0);
  const wonValue = stats.leadsByStatus
    .filter(s => s.stageType === 'won')
    .reduce((sum, s) => sum + s.value, 0);
  const winRate = (wonLeads + lostLeads) > 0 ? ((wonLeads / (wonLeads + lostLeads)) * 100) : 0;
  const averageLeadValue = stats.totalLeads > 0 ? (stats.totalValue / stats.totalLeads) : 0;


  return (
  <div className="space-y-4 sm:space-y-6">
      {/* Main Statistics Cards - Admin */}
    <div className="grid auto-rows-min gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t('mainCards.totalLeads')}</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-semibold">{stats.totalLeads}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              {t('mainCards.acrossCompany')}
            </p>
            <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="text-emerald-600 font-medium">{wonLeads} {t('mainCards.won')}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-rose-600 font-medium">{lostLeads} {t('mainCards.lost')}</span>
            </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mainCards.totalPipelineValue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">
              {formatCurrency(stats.totalValue, locale)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('mainCards.averageValue')}: {formatCurrency(averageLeadValue, locale)}
            </p>
            <div className="mt-3 text-xs">
              <span className="text-emerald-600 font-medium">
                {formatCurrency(wonValue, locale)} {t('mainCards.inSales')}
              </span>
            </div>
        </CardContent>
      </Card>

         <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">{t('mainCards.activeConversations')}</CardTitle>
             <MessageSquare className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
             <div className="text-3xl font-semibold">{stats.totalConversations}</div>
             <p className="text-xs text-muted-foreground mt-2">
               {t('mainCards.totalConversations')}
             </p>
             <div className="mt-3 flex items-center gap-2">
               <div className="flex-1">
                 <p className="text-xs text-muted-foreground">{t('mainCards.activeDays')}</p>
                 <p className="text-lg font-semibold text-emerald-600">{stats.conversationStats[0]?.active || 0}</p>
               </div>
             </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mainCards.winRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('mainCards.wonOf', { won: wonLeads, total: wonLeads + lostLeads })}
            </p>
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${winRate}%` }}
              />
            </div>
        </CardContent>
      </Card>
    </div>

      {/* Leads Charts Group */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card ref={evolutionChartRef} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.leadsRevenueEvolution')}</CardTitle>
          <CardDescription>
              {t('charts.selectTimePeriod')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Period Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="time-period" className="text-sm font-medium mb-2 block">
                  {t('charts.timePeriod')}
                </Label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger id="time-period" className="w-full">
                    <SelectValue placeholder={t('charts.selectPeriod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">{t('charts.last7days')}</SelectItem>
                    <SelectItem value="30days">{t('charts.last30days')}</SelectItem>
                    <SelectItem value="3months">{t('charts.last3months')}</SelectItem>
                    <SelectItem value="6months">{t('charts.last6months')}</SelectItem>
                    <SelectItem value="custom">{t('charts.customDates')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {timePeriod === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                      {t('charts.startDate')}
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
                      {t('charts.endDate')}
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
            
            {timePeriod === 'custom' && customStartDate && customEndDate && (
              <>
                <p className="text-xs text-slate-500">
                  {t('charts.showingDataFrom')} {(() => {
                    const [year, month, day] = customStartDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })()} to {(() => {
                    const [year, month, day] = customEndDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })()}
                </p>
                {periodExceeds1Year && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-amber-800">
                      {t('charts.periodLimitedWarning')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Custom Legend */}
          <div className="flex justify-center gap-6 pb-4" style={{ userSelect: 'none' }}>
            <div
              className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicked Leads');
                handleMetricToggle('leads');
              }}
              style={{
                opacity: !visibleMetrics.leads ? 0.4 : 1,
                filter: !visibleMetrics.leads ? 'grayscale(50%)' : 'none',
              }}
            >
              <div
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#3b82f6',
                  boxShadow: visibleMetrics.leads ? '0 0 8px #3b82f6' : 'none',
                  transform: visibleMetrics.leads ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <span
                className="text-xs font-medium transition-all duration-300"
                style={{
                  fontWeight: visibleMetrics.leads ? 600 : 500,
                }}
              >
                {t('charts.leads')}
              </span>
            </div>
            
            <div
              className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicked Revenue');
                handleMetricToggle('value');
              }}
              style={{
                opacity: !visibleMetrics.value ? 0.4 : 1,
                filter: !visibleMetrics.value ? 'grayscale(50%)' : 'none',
              }}
            >
              <div
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#10b981',
                  boxShadow: visibleMetrics.value ? '0 0 8px #10b981' : 'none',
                  transform: visibleMetrics.value ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <span
                className="text-xs font-medium transition-all duration-300"
                style={{
                  fontWeight: visibleMetrics.value ? 600 : 500,
                }}
              >
                {t('charts.revenue')}
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]" style={{ userSelect: 'none' }}>
              <LineChart 
                data={filteredMonthlyTrend}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                style={{ userSelect: 'none' }}
                onMouseDown={(e: any) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setDragStart(e.activeTooltipIndex);
                    setDragEnd(e.activeTooltipIndex);
                    setIsDragging(true);
                  }
                }}
                onMouseMove={(e: any) => {
                  if (isDragging && e && e.activeTooltipIndex !== undefined) {
                    setDragEnd(e.activeTooltipIndex);
                  }
                }}
                onMouseUp={(e: any) => {
                  if (isDragging) {
                    setIsDragging(false);
                    if (dragStart !== null && dragEnd !== null) {
                      if (dragStart === dragEnd) {
                        // Se clicar no mesmo ponto já selecionado, desmarcar
                        if (selectedPeriod === dragStart) {
                          setSelectedPeriod(null);
                        } else {
                          setSelectedPeriod(dragStart);
                        }
                      }
                      // Sempre limpar o drag range ao soltar o mouse
                      setDragStart(null);
                      setDragEnd(null);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                  angle={0}
                  height={30}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 11, fill: '#3b82f6', fontWeight: 600 }}
                  axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }}
                  axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
                  tickFormatter={(value) => `${getCurrencySymbol(locale)}${(value / 1000).toFixed(0)}k`}
                />
                
                {dragStart !== null && dragEnd !== null && (
                  <ReferenceArea
                    yAxisId="left"
                    x1={filteredMonthlyTrend[Math.min(dragStart, dragEnd)]?.month}
                    x2={filteredMonthlyTrend[Math.max(dragStart, dragEnd)]?.month}
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    stroke="#3b82f6"
                    strokeOpacity={0.3}
                  />
                )}
                
                {selectedPeriod !== null && filteredMonthlyTrend[selectedPeriod] && (
                  <>
                    <ReferenceDot
                      yAxisId="left"
                      x={filteredMonthlyTrend[selectedPeriod].month}
                      y={filteredMonthlyTrend[selectedPeriod].leads}
                      r={8}
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <ReferenceDot
                      yAxisId="right"
                      x={filteredMonthlyTrend[selectedPeriod].month}
                      y={filteredMonthlyTrend[selectedPeriod].value}
                      r={8}
                      fill="#10b981"
                      fillOpacity={0.3}
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </>
                )}
                
                <Tooltip 
                  wrapperStyle={{ zIndex: 10000 }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '2px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 10px 10px -5px rgb(0 0 0 / 0.15)',
                    padding: '14px',
                    zIndex: 10000,
                    fontWeight: 500
                  }}
                  content={(props: any) => {
                    if (!props.active || !props.payload) return null;
                    
                    const currentIndex = filteredMonthlyTrend.findIndex(
                      (item) => item.month === props.label
                    );
                    const current = filteredMonthlyTrend[currentIndex];
                    
                    // Usar fullDate se disponível, senão usar month
                    const displayDate = current?.fullDate || props.label;
                    
                    if (selectedPeriod !== null && selectedPeriod !== currentIndex) {
                      const selected = filteredMonthlyTrend[selectedPeriod];
                      const selectedDisplayDate = selected?.fullDate || selected?.month;
                      const leadsDiff = current.leads - selected.leads;
                      const valueDiff = current.value - selected.value;
                      const leadsPercent = selected.leads > 0 
                        ? ((leadsDiff / selected.leads) * 100).toFixed(1)
                        : '0';
                      const valuePercent = selected.value > 0
                        ? ((valueDiff / selected.value) * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div className="text-xs bg-white">
                          <p className="font-semibold mb-2">{displayDate}</p>
                          <div className="space-y-2">
                            {visibleMetrics.leads && (
                              <div>
                                <p className="text-blue-600 font-semibold">{t('charts.leads')}: {current.leads}</p>
                                <p className={`text-xs font-medium ${leadsDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {leadsDiff >= 0 ? '+' : ''}{leadsDiff} ({leadsPercent >= '0' ? '+' : ''}{leadsPercent}%)
                                </p>
                              </div>
                            )}
                            {visibleMetrics.value && (
                              <div>
                                <p className="text-emerald-600 font-semibold">{t('charts.revenue')}: {formatCurrency(current.value, locale, { minimumFractionDigits: 0 })}</p>
                                <p className={`text-xs font-medium ${valueDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {valueDiff >= 0 ? '+' : ''}{formatCurrency(Math.abs(valueDiff), locale, { minimumFractionDigits: 0 })} ({valuePercent >= '0' ? '+' : ''}{valuePercent}%)
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">{t('charts.vs')} {selectedDisplayDate}</p>
                        </div>
                      );
                    }
                    
                    if (dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
                      const start = Math.min(dragStart, dragEnd);
                      const end = Math.max(dragStart, dragEnd);
                      const rangeData = filteredMonthlyTrend.slice(start, end + 1);
                      const startDisplayDate = filteredMonthlyTrend[start]?.fullDate || filteredMonthlyTrend[start]?.month;
                      const endDisplayDate = filteredMonthlyTrend[end]?.fullDate || filteredMonthlyTrend[end]?.month;
                      const totalLeads = rangeData.reduce((sum, item) => sum + item.leads, 0);
                      const totalValue = rangeData.reduce((sum, item) => sum + item.value, 0);
                      const avgLeads = totalLeads / rangeData.length;
                      const avgValue = totalValue / rangeData.length;
                      
                      return (
                        <div className="text-xs bg-white">
                          <p className="font-semibold mb-2">{t('charts.rangeSummary')}</p>
                          <p className="text-slate-600 text-[10px] mb-2 font-medium">
                            {startDisplayDate} - {endDisplayDate}
                          </p>
                          <div className="space-y-1">
                            {visibleMetrics.leads && (
                              <>
                                <p className="text-blue-600 font-semibold">{t('charts.totalLeadsLabel')}: {totalLeads}</p>
                                <p className="text-blue-600 text-[10px] font-medium">{t('charts.avg')}: {avgLeads.toFixed(1)}</p>
                              </>
                            )}
                            {visibleMetrics.value && (
                              <>
                                <p className="text-emerald-600 font-semibold">{t('charts.totalRevenue')}: {formatCurrency(totalValue, locale, { minimumFractionDigits: 0 })}</p>
                                <p className="text-emerald-600 text-[10px] font-medium">{t('charts.avg')}: {formatCurrency(avgValue, locale, { minimumFractionDigits: 0 })}</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="text-xs bg-white">
                        <p className="font-semibold mb-2">{displayDate}</p>
                        {visibleMetrics.leads && (
                          <p className="text-blue-600 font-semibold">{t('charts.leads')}: {current.leads}</p>
                        )}
                        {visibleMetrics.value && (
                          <p className="text-emerald-600 font-semibold">{t('charts.revenue')}: {formatCurrency(current.value, locale, { minimumFractionDigits: 0 })}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">{t('charts.clickToSelect')}</p>
                      </div>
                    );
                  }}
                />
                {visibleMetrics.leads && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ 
                      fill: '#3b82f6', 
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#ffffff'
                    }}
                    activeDot={{ 
                      r: 7,
                      fill: '#3b82f6',
                      stroke: '#ffffff',
                      strokeWidth: 2
                    }}
                    name="leads"
                    isAnimationActive={false}
                  />
                )}
                {visibleMetrics.value && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ 
                      fill: '#10b981', 
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#ffffff'
                    }}
                    activeDot={{ 
                      r: 7,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 2
                    }}
                    name="value"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

        <Card 
          ref={leadSourcesCardRef}
          className="hover:shadow-lg transition-all duration-300 border-slate-200"
          style={{ overflow: 'visible' }}
        >
          <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-xl font-semibold text-slate-900">{t('charts.leadSources')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                {t('charts.distributionAcrossChannels')}
          </CardDescription>
            </div>
        </CardHeader>
          <CardContent className="pt-2 p-3 sm:p-6" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col space-y-4 sm:space-y-6">
              {/* Donut Chart */}
              <div className="relative" style={{ outline: 'none', overflow: 'visible', zIndex: 2 }} ref={leadSourcesChartRef}>
                <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                  <PieChart style={{ outline: 'none' }}>
                    <defs>
                      {COLORS.map((color, index) => (
                        <linearGradient key={`admin-gradient-${index}`} id={`admin-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                        </linearGradient>
                      ))}
                    </defs>
              <Pie
                data={stats.leadsBySource}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="source"
                stroke="none"
                onClick={(data: any, index: number) => handleSourceClick(data.source, index)}
                isAnimationActive={false}
              >
                {stats.leadsBySource.map((entry, index) => {
                  const isSelected = selectedSource === entry.source;
                  const isActive = index === activeIndex;
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#admin-gradient-${index % COLORS.length})`}
                      style={{
                        cursor: 'pointer',
                        outline: 'none',
                        opacity: selectedSource && !isSelected ? 0.35 : 1,
                        transition: 'opacity 0.35s ease-in-out',
                      }}
                      stroke="none"
                      strokeWidth={0}
                    />
                  );
                })}
              </Pie>
                    <Tooltip 
                      wrapperStyle={{ zIndex: 9999 }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px',
                        zIndex: 9999,
                        position: 'relative'
                      }}
                      formatter={(value: any, name: string, props: any) => {
                        const total = stats.leadsBySource.reduce((sum, item) => sum + item.count, 0)
                        const percentage = ((Number(value) / total) * 100).toFixed(1)
                        return [`${value} ${t('charts.leadsPlural')} (${percentage}%)`, props.payload.source]
                      }}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                      itemStyle={{ color: '#64748b', fontSize: '13px' }}
                    />
            </PieChart>
          </ResponsiveContainer>
                
                {/* Center Label - Dynamic based on selection */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                  <div className="text-center transition-all duration-300">
                    {selectedSourceData ? (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-sm font-medium text-slate-500 mb-1">{selectedSourceData.source}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{selectedSourceData.count}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">
                          {((selectedSourceData.count / stats.totalLeads) * 100).toFixed(1)}% {t('charts.ofTotal')}
                        </p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">{t('charts.totalLeads')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Custom Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-slate-100">
                {stats.leadsBySource.slice(0, 6).map((source, index) => {
                  const percentage = ((source.count / stats.totalLeads) * 100).toFixed(1)
                  const isSelected = selectedSource === source.source;
                  return (
                    <div 
                      key={source.source}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSourceClick(source.source, index);
                      }}
                      className={`legend-item flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                        isSelected 
                          ? 'bg-blue-50 ring-2 ring-blue-400 shadow-sm' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-sm transition-all duration-300 ${
                          isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                        }`}
                        style={{ 
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] sm:text-xs font-semibold truncate transition-colors duration-300 ${
                          isSelected ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {source.source}
                        </p>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-[10px] sm:text-xs font-bold transition-colors duration-300 ${
                            isSelected ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {source.count}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500">({percentage}%)</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Show "More" indicator if there are more than 6 sources */}
              {stats.leadsBySource.length > 6 && (
                <div className="text-center pt-2 border-t border-slate-100">
                  <Dialog open={showMoreSources} onOpenChange={setShowMoreSources}>
                    <DialogTrigger asChild>
                      <button 
                        className="text-xs text-slate-500 hover:text-blue-600 transition-colors duration-200 cursor-pointer hover:underline focus:outline-none"
                        onClick={() => setShowMoreSources(true)}
                      >
                        {stats.leadsBySource.length - 6 === 1 
                          ? t('charts.moreSource', { count: stats.leadsBySource.length - 6 })
                          : t('charts.moreSources', { count: stats.leadsBySource.length - 6 })
                        }
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-semibold">{t('charts.additionalLeadSources')}</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-slate-500">
                          {t('charts.otherSourcesNotShown')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-3 sm:mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {stats.leadsBySource.slice(6).map((source, index) => {
                          const percentage = ((source.count / stats.totalLeads) * 100).toFixed(1);
                          const colorIndex = (index + 6) % COLORS.length;
                          return (
                            <div 
                              key={source.source}
                              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div 
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: COLORS[colorIndex] }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                    {source.source}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {percentage}% {t('charts.ofTotal')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900">
                                  {source.count}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-500">
                                  {source.count === 1 ? t('charts.lead') : t('charts.leadsPlural')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>

      {/* Pipeline Charts Group */}
      <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
        <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
          <div className="space-y-1">
              <CardTitle className="text-base sm:text-xl font-semibold text-slate-900">{t('charts.salesPipeline')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                {t('charts.leadDistributionByStage')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2 p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={400} className="sm:h-[550px]">
              <BarChart 
                data={pipelineData} 
                margin={{ top: 10, right: 10, bottom: 60, left: -10 }}
                barGap={8}
              >
                <defs>
                  {pipelineData.map((entry, index) => {
                    const stageColor = statusToColorMap.get(entry.status) || COLORS[index % COLORS.length]
                    return (
                      <linearGradient key={`pipeline-gradient-${index}`} id={`pipeline-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stageColor} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={stageColor} stopOpacity={0.7} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  className="sm:text-[13px]"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  className="sm:text-[12px]"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} ${t('charts.leadsPlural')}`,
                    props.payload.status
                  ]}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ color: '#64748b', fontSize: '13px' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={90}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#pipeline-gradient-${index})`}
                      className="hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.07))'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Summary Statistics */}
            <div className="mt-4 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200">
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1">{t('charts.totalLeads')}</p>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {pipelineData.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1">{t('charts.activeStages')}</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600">
                  {pipelineData.filter(item => item.count > 0).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1">{t('charts.avgPerStage')}</p>
                <p className="text-base sm:text-lg font-bold text-blue-600">
                  {(pipelineData.reduce((sum, item) => sum + item.count, 0) / pipelineData.length).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">{t('charts.valueByPipelineStage')}</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                {t('charts.financialDistribution')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={400} className="sm:h-[550px]">
              <BarChart 
                data={pipelineData} 
                margin={{ top: 10, right: 10, bottom: 50, left: 5 }}
                barGap={6}
              >
                <defs>
                  {pipelineData.map((entry, index) => {
                    const stageColor = statusToColorMap.get(entry.status) || COLORS[index % COLORS.length]
                    return (
                      <linearGradient key={`admin-value-gradient-${index}`} id={`admin-value-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stageColor} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={stageColor} stopOpacity={0.7} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  className="sm:text-[13px]"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${getCurrencySymbol(locale)}${(value / 1000).toFixed(0)}k`}
                  className="sm:text-[12px]"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    formatCurrency(Number(value), locale), 
                    props.payload.status
                  ]}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ color: '#64748b', fontSize: '13px' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar 
                dataKey="value"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={90}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#admin-value-gradient-${index})`}
                      className="hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.07))'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>

      {/* Conversations Charts Group */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{t('charts.chatsByPlatform')}</CardTitle>
          <CardDescription>
            {t('charts.communicationDistribution')}
          </CardDescription>
        </CardHeader>
        <CardContent>
             <div className="space-y-6">
            {stats.conversationStats.map((stat, index) => (
                 <div key={stat.platform} className="space-y-3">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                       <span className="text-sm font-semibold text-slate-900">{stat.platform}</span>
                </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-muted-foreground">{t('charts.totalConversations')}</span>
                <div className="text-right">
                       <div className="text-2xl font-semibold">{stat.count}</div>
                  </div>
                </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] sm:text-sm font-medium text-muted-foreground">{t('charts.activeConversations')}</span>
                     <div className="text-right">
                       <div className="text-xl sm:text-2xl font-semibold text-emerald-600">{stat.active}</div>
                     </div>
                   </div>
                   <div className="pt-3 sm:pt-4 border-t">
                     <div className="flex justify-between items-center">
                       <span className="text-[10px] sm:text-xs text-muted-foreground">{t('charts.activityRate')}</span>
                       <span className="text-[10px] sm:text-xs font-medium">{stat.count > 0 ? ((stat.active / stat.count) * 100).toFixed(0) : 0}%</span>
                     </div>
                     <div className="mt-1.5 sm:mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full transition-all duration-500"
                         style={{ 
                           width: `${stat.count > 0 ? (stat.active / stat.count) * 100 : 0}%`,
                           backgroundColor: COLORS[index % COLORS.length]
                         }}
                       />
                     </div>
                   </div>
                   {index < stats.conversationStats.length - 1 && (
                     <div className="pt-3 sm:pt-4 border-b border-slate-100" />
                   )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-semibold">{t('performance.overallPerformance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.conversionRate')}</span>
              <span className="text-sm sm:text-base font-semibold">{stats.conversionRate.toFixed(1)}%</span>
    </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.averageTicket')}</span>
              <span className="text-sm sm:text-base font-semibold">
                {formatCurrency(averageLeadValue, locale)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.totalSales')}</span>
              <span className="text-sm sm:text-base font-semibold text-emerald-600 truncate">
                {formatCurrency(wonValue, locale)}
              </span>
            </div>
          </CardContent>
        </Card>

         <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-3 sm:p-6">
             <CardTitle className="text-sm sm:text-base font-semibold">{t('employeeStats.conversationActivity')}</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
             <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.totalConversations')}</span>
               <span className="text-sm sm:text-base font-semibold">{stats.conversationStats[0]?.count || 0}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.activeConversations')}</span>
               <span className="text-sm sm:text-base font-semibold">
                 {stats.conversationStats[0]?.active || 0}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.activityRate')}</span>
               <span className="text-sm sm:text-base font-semibold">
                 {stats.conversationStats[0] && stats.conversationStats[0].count > 0
                   ? ((stats.conversationStats[0].active / stats.conversationStats[0].count) * 100).toFixed(1)
                   : '0.0'}%
               </span>
             </div>
           </CardContent>
         </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-semibold">{t('performance.funnelAnalysis')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.inPipeline')}</span>
              <span className="text-sm sm:text-base font-semibold">
                {stats.totalLeads - wonLeads - lostLeads}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.winRate')}</span>
              <span className="text-sm sm:text-base font-semibold text-emerald-600">{winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.inNegotiation')}</span>
              <span className="text-sm sm:text-base font-semibold">
                {stats.leadsByStatus.find(s => s.status === 'Negotiation')?.count || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance - Sales Rep */}
      {stats.leadsByUser && stats.leadsByUser.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('teamPerformance.title')}</CardTitle>
        <CardDescription>
              {t('teamPerformance.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
            <div className="space-y-6">
              {stats.leadsByUser.map((user, index) => {
                const userPercentage = (user.count / stats.totalLeads) * 100
                const avgTicket = user.count > 0 ? user.value / user.count : 0
                
                return (
                  <div key={user.userName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('teamPerformance.avgTicket')}: {formatCurrency(avgTicket, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold">{user.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(user.value, locale)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min(userPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground min-w-[45px] text-right">
                        {userPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Team statistics */}
            <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 truncate overflow-hidden break-words">
                  {stats.leadsByUser.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('teamPerformance.activeSalesReps')}</p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 truncate overflow-hidden break-words">
                  {Math.round(stats.totalLeads / stats.leadsByUser.length)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('teamPerformance.leadsPerRep')}</p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 truncate overflow-hidden break-words px-1">
                  {formatCurrency(stats.totalValue / stats.leadsByUser.length, locale, { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('teamPerformance.valuePerRep')}</p>
              </div>
            </div>
      </CardContent>
    </Card>
      )}
  </div>
  );
}

// Componente para Dashboard de Master
const MasterDashboard = ({ stats, leads, pipelineStages }: { stats: DashboardStats; leads: Lead[]; pipelineStages: any[] }) => {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  
  // Usar todas as stages do pipeline (agora são dinâmicas/personalizadas)
  const pipelineData = stats.leadsByStatus;
  
  // Criar mapeamento de status para cor de fundo das stages
  const statusToColorMap = React.useMemo(() => {
    const map = new Map<string, string>()
    
    pipelineData.forEach((entry) => {
      // Tentar encontrar a stage pelo nome ou pelo slug
      const matchingStage = pipelineStages.find((s: any) => {
        return s.name === entry.status || s.slug === entry.status
      })
      
      if (matchingStage && matchingStage.color) {
        const hexColor = extractBgColor(matchingStage.color)
        map.set(entry.status, hexColor)
      } else {
        // Se não encontrar, usar cor padrão da empresa (já normalizada)
        map.set(entry.status, '#2563eb')
      }
    })
    
    return map
  }, [pipelineData, pipelineStages])
  
  // Estado para controlar o segmento selecionado no donut chart
  const [selectedSource, setSelectedSource] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  
  // Estados para comparação no gráfico de evolução
  const [selectedPeriod, setSelectedPeriod] = React.useState<number | null>(null);
  const [dragStart, setDragStart] = React.useState<number | null>(null);
  const [dragEnd, setDragEnd] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Estado para controlar qual métrica está visível no Evolution Chart
  const [visibleMetrics, setVisibleMetrics] = React.useState<{ leads: boolean; value: boolean }>({
    leads: true,
    value: true,
  });
  
  // Estados para filtro de período
  const [timePeriod, setTimePeriod] = React.useState<string>('6months');
  const [customStartDate, setCustomStartDate] = React.useState<string>('');
  const [customEndDate, setCustomEndDate] = React.useState<string>('');
  
  // Estado para controlar exibição de fontes adicionais
  const [showMoreSources, setShowMoreSources] = React.useState(false);
  
  // Refs para os cards
  const leadSourcesCardRef = React.useRef<HTMLDivElement>(null);
  const leadSourcesChartRef = React.useRef<HTMLDivElement>(null);
  const evolutionChartRef = React.useRef<HTMLDivElement>(null);
  
  // Calcular dados adicionais usando stage_type
  const wonLeads = stats.leadsByStatus
    .filter(s => s.stageType === 'won')
    .reduce((sum, s) => sum + s.count, 0);
  const lostLeads = stats.leadsByStatus
    .filter(s => s.stageType === 'lost')
    .reduce((sum, s) => sum + s.count, 0);
  const wonValue = stats.leadsByStatus
    .filter(s => s.stageType === 'won')
    .reduce((sum, s) => sum + s.value, 0);
  const winRate = (wonLeads + lostLeads) > 0 ? ((wonLeads / (wonLeads + lostLeads)) * 100) : 0;
  const averageLeadValue = stats.totalLeads > 0 ? (stats.totalValue / stats.totalLeads) : 0;
  
  // Função para alternar seleção de fonte com useCallback para evitar re-renders
  const handleSourceClick = React.useCallback((sourceName: string, index: number) => {
    setSelectedSource(prev => {
      const newValue = prev === sourceName ? null : sourceName;
      setActiveIndex(newValue ? index : null);
      return newValue;
    });
  }, []);
  
  // Função para alternar visibilidade de métrica no Evolution Chart
  const handleMetricToggle = React.useCallback((metric: 'leads' | 'value') => {
    setVisibleMetrics(prev => {
      const currentValue = prev[metric];
      // Se ambas estão visíveis, esconde a outra e deixa só essa
      if (prev.leads && prev.value) {
        return metric === 'leads' 
          ? { leads: true, value: false }
          : { leads: false, value: true };
      }
      // Se só essa está visível, mostra ambas
      if (currentValue && !prev[metric === 'leads' ? 'value' : 'leads']) {
        return { leads: true, value: true };
      }
      // Se a outra está visível, troca
      return metric === 'leads'
        ? { leads: true, value: false }
        : { leads: false, value: true };
    });
  }, []);
  
  // Obter dados da fonte selecionada (usando useMemo para evitar recalcular desnecessariamente)
  const selectedSourceData = React.useMemo(() => {
    return selectedSource 
      ? stats.leadsBySource.find(s => s.source === selectedSource)
      : null;
  }, [selectedSource, stats.leadsBySource]);
  
  // Removido: useEffect de animação explode - mantendo apenas efeito de opacidade
  
  // Adicionar listener para clicar fora do Lead Sources
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leadSourcesCardRef.current && !leadSourcesCardRef.current.contains(event.target as Node)) {
        setSelectedSource(null);
      }
    };
    
    if (selectedSource !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedSource]);
  
  // Adicionar listener para clicar fora do Evolution Chart
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (evolutionChartRef.current && !evolutionChartRef.current.contains(event.target as Node)) {
        setSelectedPeriod(null);
      }
    };
    
    if (selectedPeriod !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedPeriod]);
  
  // Verificar se o período customizado excede 1 ano
  const periodExceeds1Year = React.useMemo(() => {
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      const [startYear, startMonth, startDay] = customStartDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = customEndDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 365;
      }
    }
    return false;
  }, [timePeriod, customStartDate, customEndDate]);
  
  // Processar dados do gráfico Evolution baseado no período selecionado
  const filteredMonthlyTrend = React.useMemo(() => {
    return processLeadTrend(leads, timePeriod, customStartDate, customEndDate, locale, pipelineStages);
  }, [leads, timePeriod, customStartDate, customEndDate, locale, pipelineStages]);


  return (
  <div className="space-y-4 sm:space-y-6">
      {/* Main Statistics Cards - Master */}
    <div className="grid auto-rows-min gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t('mainCards.totalLeads')}</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-semibold">{stats.totalLeads}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              {t('mainCards.acrossCompany')}
            </p>
            <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="text-emerald-600 font-medium">{wonLeads} {t('mainCards.won')}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-rose-600 font-medium">{lostLeads} {t('mainCards.lost')}</span>
            </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t('mainCards.totalPipelineValue')}</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-semibold truncate">
              {formatCurrency(stats.totalValue, locale)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              {t('mainCards.averageValue')}: {formatCurrency(averageLeadValue, locale)}
            </p>
            <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs">
              <span className="text-emerald-600 font-medium truncate">
                {formatCurrency(wonValue, locale)} {t('mainCards.inSales')}
              </span>
            </div>
        </CardContent>
      </Card>

         <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
             <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{t('mainCards.activeConversations')}</CardTitle>
             <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
             <div className="text-2xl sm:text-3xl font-semibold">{stats.totalConversations}</div>
             <p className="text-xs text-muted-foreground mt-2">
               {t('mainCards.totalConversations')}
             </p>
             <div className="mt-3 flex items-center gap-2">
               <div className="flex-1">
                 <p className="text-xs text-muted-foreground">{t('mainCards.activeDays')}</p>
                 <p className="text-lg font-semibold text-emerald-600">{stats.conversationStats[0]?.active || 0}</p>
               </div>
             </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mainCards.winRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('mainCards.wonOf', { won: wonLeads, total: wonLeads + lostLeads })}
            </p>
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${winRate}%` }}
              />
            </div>
        </CardContent>
      </Card>
    </div>

      {/* Leads Charts Group */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card ref={evolutionChartRef} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.leadsRevenueEvolution')}</CardTitle>
          <CardDescription>
              {t('charts.selectTimePeriod')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Period Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="time-period" className="text-sm font-medium mb-2 block">
                  {t('charts.timePeriod')}
                </Label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger id="time-period" className="w-full">
                    <SelectValue placeholder={t('charts.selectPeriod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">{t('charts.last7days')}</SelectItem>
                    <SelectItem value="30days">{t('charts.last30days')}</SelectItem>
                    <SelectItem value="3months">{t('charts.last3months')}</SelectItem>
                    <SelectItem value="6months">{t('charts.last6months')}</SelectItem>
                    <SelectItem value="custom">{t('charts.customDates')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {timePeriod === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                      {t('charts.startDate')}
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
                      {t('charts.endDate')}
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
            
            {timePeriod === 'custom' && customStartDate && customEndDate && (
              <>
                <p className="text-xs text-slate-500">
                  {t('charts.showingDataFrom')} {(() => {
                    const [year, month, day] = customStartDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })()} to {(() => {
                    const [year, month, day] = customEndDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })()}
                </p>
                {periodExceeds1Year && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-amber-800">
                      {t('charts.periodLimitedWarning')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Custom Legend */}
          <div className="flex justify-center gap-6 pb-4" style={{ userSelect: 'none' }}>
            <div
              className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicked Leads');
                handleMetricToggle('leads');
              }}
              style={{
                opacity: !visibleMetrics.leads ? 0.4 : 1,
                filter: !visibleMetrics.leads ? 'grayscale(50%)' : 'none',
              }}
            >
              <div
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#3b82f6',
                  boxShadow: visibleMetrics.leads ? '0 0 8px #3b82f6' : 'none',
                  transform: visibleMetrics.leads ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <span
                className="text-xs font-medium transition-all duration-300"
                style={{
                  fontWeight: visibleMetrics.leads ? 600 : 500,
                }}
              >
                {t('charts.leads')}
              </span>
            </div>
            
            <div
              className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicked Revenue');
                handleMetricToggle('value');
              }}
              style={{
                opacity: !visibleMetrics.value ? 0.4 : 1,
                filter: !visibleMetrics.value ? 'grayscale(50%)' : 'none',
              }}
            >
              <div
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#10b981',
                  boxShadow: visibleMetrics.value ? '0 0 8px #10b981' : 'none',
                  transform: visibleMetrics.value ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <span
                className="text-xs font-medium transition-all duration-300"
                style={{
                  fontWeight: visibleMetrics.value ? 600 : 500,
                }}
              >
                {t('charts.revenue')}
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]" style={{ userSelect: 'none' }}>
              <LineChart 
                data={filteredMonthlyTrend}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                style={{ userSelect: 'none' }}
                onMouseDown={(e: any) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setDragStart(e.activeTooltipIndex);
                    setDragEnd(e.activeTooltipIndex);
                    setIsDragging(true);
                  }
                }}
                onMouseMove={(e: any) => {
                  if (isDragging && e && e.activeTooltipIndex !== undefined) {
                    setDragEnd(e.activeTooltipIndex);
                  }
                }}
                onMouseUp={(e: any) => {
                  if (isDragging) {
                    setIsDragging(false);
                    if (dragStart !== null && dragEnd !== null) {
                      if (dragStart === dragEnd) {
                        // Se clicar no mesmo ponto já selecionado, desmarcar
                        if (selectedPeriod === dragStart) {
                          setSelectedPeriod(null);
                        } else {
                          setSelectedPeriod(dragStart);
                        }
                      }
                      // Sempre limpar o drag range ao soltar o mouse
                      setDragStart(null);
                      setDragEnd(null);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                  angle={0}
                  height={30}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 11, fill: '#3b82f6', fontWeight: 600 }}
                  axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }}
                  axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
                  tickFormatter={(value) => `${getCurrencySymbol(locale)}${(value / 1000).toFixed(0)}k`}
                />
                
                {dragStart !== null && dragEnd !== null && (
                  <ReferenceArea
                    yAxisId="left"
                    x1={filteredMonthlyTrend[Math.min(dragStart, dragEnd)]?.month}
                    x2={filteredMonthlyTrend[Math.max(dragStart, dragEnd)]?.month}
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    stroke="#3b82f6"
                    strokeOpacity={0.3}
                  />
                )}
                
                {selectedPeriod !== null && filteredMonthlyTrend[selectedPeriod] && (
                  <>
                    <ReferenceDot
                      yAxisId="left"
                      x={filteredMonthlyTrend[selectedPeriod].month}
                      y={filteredMonthlyTrend[selectedPeriod].leads}
                      r={8}
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <ReferenceDot
                      yAxisId="right"
                      x={filteredMonthlyTrend[selectedPeriod].month}
                      y={filteredMonthlyTrend[selectedPeriod].value}
                      r={8}
                      fill="#10b981"
                      fillOpacity={0.3}
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </>
                )}
                
                <Tooltip 
                  wrapperStyle={{ zIndex: 10000 }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '2px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 10px 10px -5px rgb(0 0 0 / 0.15)',
                    padding: '14px',
                    zIndex: 10000,
                    fontWeight: 500
                  }}
                  content={(props: any) => {
                    if (!props.active || !props.payload) return null;
                    
                    const currentIndex = filteredMonthlyTrend.findIndex(
                      (item) => item.month === props.label
                    );
                    const current = filteredMonthlyTrend[currentIndex];
                    
                    // Usar fullDate se disponível, senão usar month
                    const displayDate = current?.fullDate || props.label;
                    
                    if (selectedPeriod !== null && selectedPeriod !== currentIndex) {
                      const selected = filteredMonthlyTrend[selectedPeriod];
                      const selectedDisplayDate = selected?.fullDate || selected?.month;
                      const leadsDiff = current.leads - selected.leads;
                      const valueDiff = current.value - selected.value;
                      const leadsPercent = selected.leads > 0 
                        ? ((leadsDiff / selected.leads) * 100).toFixed(1)
                        : '0';
                      const valuePercent = selected.value > 0
                        ? ((valueDiff / selected.value) * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div className="text-xs bg-white">
                          <p className="font-semibold mb-2">{displayDate}</p>
                          <div className="space-y-2">
                            {visibleMetrics.leads && (
                              <div>
                                <p className="text-blue-600 font-semibold">{t('charts.leads')}: {current.leads}</p>
                                <p className={`text-xs font-medium ${leadsDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {leadsDiff >= 0 ? '+' : ''}{leadsDiff} ({leadsPercent >= '0' ? '+' : ''}{leadsPercent}%)
                                </p>
                              </div>
                            )}
                            {visibleMetrics.value && (
                              <div>
                                <p className="text-emerald-600 font-semibold">{t('charts.revenue')}: {formatCurrency(current.value, locale, { minimumFractionDigits: 0 })}</p>
                                <p className={`text-xs font-medium ${valueDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {valueDiff >= 0 ? '+' : ''}{formatCurrency(Math.abs(valueDiff), locale, { minimumFractionDigits: 0 })} ({valuePercent >= '0' ? '+' : ''}{valuePercent}%)
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">{t('charts.vs')} {selectedDisplayDate}</p>
                        </div>
                      );
                    }
                    
                    if (dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
                      const start = Math.min(dragStart, dragEnd);
                      const end = Math.max(dragStart, dragEnd);
                      const rangeData = filteredMonthlyTrend.slice(start, end + 1);
                      const startDisplayDate = filteredMonthlyTrend[start]?.fullDate || filteredMonthlyTrend[start]?.month;
                      const endDisplayDate = filteredMonthlyTrend[end]?.fullDate || filteredMonthlyTrend[end]?.month;
                      const totalLeads = rangeData.reduce((sum, item) => sum + item.leads, 0);
                      const totalValue = rangeData.reduce((sum, item) => sum + item.value, 0);
                      const avgLeads = totalLeads / rangeData.length;
                      const avgValue = totalValue / rangeData.length;
                      
                      return (
                        <div className="text-xs bg-white">
                          <p className="font-semibold mb-2">{t('charts.rangeSummary')}</p>
                          <p className="text-slate-600 text-[10px] mb-2 font-medium">
                            {startDisplayDate} - {endDisplayDate}
                          </p>
                          <div className="space-y-1">
                            {visibleMetrics.leads && (
                              <>
                                <p className="text-blue-600 font-semibold">{t('charts.totalLeadsLabel')}: {totalLeads}</p>
                                <p className="text-blue-600 text-[10px] font-medium">{t('charts.avg')}: {avgLeads.toFixed(1)}</p>
                              </>
                            )}
                            {visibleMetrics.value && (
                              <>
                                <p className="text-emerald-600 font-semibold">{t('charts.totalRevenue')}: {formatCurrency(totalValue, locale, { minimumFractionDigits: 0 })}</p>
                                <p className="text-emerald-600 text-[10px] font-medium">{t('charts.avg')}: {formatCurrency(avgValue, locale, { minimumFractionDigits: 0 })}</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="text-xs bg-white">
                        <p className="font-semibold mb-2">{displayDate}</p>
                        {visibleMetrics.leads && (
                          <p className="text-blue-600 font-semibold">{t('charts.leads')}: {current.leads}</p>
                        )}
                        {visibleMetrics.value && (
                          <p className="text-emerald-600 font-semibold">{t('charts.revenue')}: {formatCurrency(current.value, locale, { minimumFractionDigits: 0 })}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">{t('charts.clickToSelect')}</p>
                      </div>
                    );
                  }}
                />
                {visibleMetrics.leads && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ 
                      fill: '#3b82f6', 
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#ffffff'
                    }}
                    activeDot={{ 
                      r: 7,
                      fill: '#3b82f6',
                      stroke: '#ffffff',
                      strokeWidth: 2
                    }}
                    name="leads"
                    isAnimationActive={false}
                  />
                )}
                {visibleMetrics.value && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ 
                      fill: '#10b981', 
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#ffffff'
                    }}
                    activeDot={{ 
                      r: 7,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 2
                    }}
                    name="value"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

        <Card 
          ref={leadSourcesCardRef}
          className="hover:shadow-lg transition-all duration-300 border-slate-200"
          style={{ overflow: 'visible' }}
        >
          <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-xl font-semibold text-slate-900">{t('charts.leadSources')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                {t('charts.distributionAcrossChannels')}
          </CardDescription>
            </div>
        </CardHeader>
          <CardContent className="pt-2 p-3 sm:p-6" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col space-y-4 sm:space-y-6">
              {/* Donut Chart */}
              <div className="relative" style={{ outline: 'none', overflow: 'visible', zIndex: 2 }} ref={leadSourcesChartRef}>
                <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                  <PieChart style={{ outline: 'none' }}>
                    <defs>
                      {COLORS.map((color, index) => (
                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                        </linearGradient>
                      ))}
                    </defs>
              <Pie
                data={stats.leadsBySource}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="source"
                stroke="none"
                onClick={(data: any, index: number) => handleSourceClick(data.source, index)}
                isAnimationActive={false}
              >
                {stats.leadsBySource.map((entry, index) => {
                  const isSelected = selectedSource === entry.source;
                  const isActive = index === activeIndex;
                  
                  // Calcular transform para o segmento ativo
                  let transform = '';
                  if (isActive) {
                    const totalValue = stats.leadsBySource.reduce((sum, s) => sum + s.count, 0);
                    let startAngle = -90;
                    for (let i = 0; i < index; i++) {
                      startAngle += (stats.leadsBySource[i].count / totalValue) * 360;
                    }
                    const segmentAngle = (entry.count / totalValue) * 360;
                    const midAngle = startAngle + segmentAngle / 2;
                    const radian = (Math.PI / 180) * midAngle;
                    const explodeDistance = 15;
                    const offsetX = explodeDistance * Math.cos(radian);
                    const offsetY = explodeDistance * Math.sin(radian);
                    transform = `translate(${offsetX}px, ${offsetY}px)`;
                  }
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index % COLORS.length})`}
                      className={isActive ? 'pie-explode-active' : ''}
                      style={{
                        cursor: 'pointer',
                        outline: 'none',
                        opacity: selectedSource && !isSelected ? 0.35 : 1,
                        transition: 'opacity 0.35s ease-in-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: transform,
                        filter: isActive ? 'drop-shadow(0 8px 20px rgba(59, 130, 246, 0.6)) brightness(1.15)' : 'none',
                      }}
                      stroke="none"
                      strokeWidth={0}
                    />
                  );
                })}
              </Pie>
                    <Tooltip 
                      wrapperStyle={{ zIndex: 9999 }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px',
                        zIndex: 9999,
                        position: 'relative'
                      }}
                      formatter={(value: any, name: string, props: any) => {
                        const total = stats.leadsBySource.reduce((sum, item) => sum + item.count, 0)
                        const percentage = ((Number(value) / total) * 100).toFixed(1)
                        return [`${value} ${t('charts.leadsPlural')} (${percentage}%)`, props.payload.source]
                      }}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                      itemStyle={{ color: '#64748b', fontSize: '13px' }}
                    />
            </PieChart>
          </ResponsiveContainer>
                
                {/* Center Label - Dynamic based on selection */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                  <div className="text-center transition-all duration-300">
                    {selectedSourceData ? (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-sm font-medium text-slate-500 mb-1">{selectedSourceData.source}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{selectedSourceData.count}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">
                          {((selectedSourceData.count / stats.totalLeads) * 100).toFixed(1)}% {t('charts.ofTotal')}
                        </p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">{t('charts.totalLeads')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Custom Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-slate-100">
                {stats.leadsBySource.slice(0, 6).map((source, index) => {
                  const percentage = ((source.count / stats.totalLeads) * 100).toFixed(1)
                  const isSelected = selectedSource === source.source;
                  return (
                    <div 
                      key={source.source}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSourceClick(source.source, index);
                      }}
                      className={`legend-item flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                        isSelected 
                          ? 'bg-blue-50 ring-2 ring-blue-400 shadow-sm' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-sm transition-all duration-300 ${
                          isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                        }`}
                        style={{ 
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] sm:text-xs font-semibold truncate transition-colors duration-300 ${
                          isSelected ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {source.source}
                        </p>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-[10px] sm:text-xs font-bold transition-colors duration-300 ${
                            isSelected ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {source.count}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500">({percentage}%)</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Show "More" indicator if there are more than 6 sources */}
              {stats.leadsBySource.length > 6 && (
                <div className="text-center pt-2 border-t border-slate-100">
                  <Dialog open={showMoreSources} onOpenChange={setShowMoreSources}>
                    <DialogTrigger asChild>
                      <button 
                        className="text-xs text-slate-500 hover:text-blue-600 transition-colors duration-200 cursor-pointer hover:underline focus:outline-none"
                        onClick={() => setShowMoreSources(true)}
                      >
                        {stats.leadsBySource.length - 6 === 1 
                          ? t('charts.moreSource', { count: stats.leadsBySource.length - 6 })
                          : t('charts.moreSources', { count: stats.leadsBySource.length - 6 })
                        }
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-semibold">{t('charts.additionalLeadSources')}</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-slate-500">
                          {t('charts.otherSourcesNotShown')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-3 sm:mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {stats.leadsBySource.slice(6).map((source, index) => {
                          const percentage = ((source.count / stats.totalLeads) * 100).toFixed(1);
                          const colorIndex = (index + 6) % COLORS.length;
                          return (
                            <div 
                              key={source.source}
                              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div 
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: COLORS[colorIndex] }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                    {source.source}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {percentage}% {t('charts.ofTotal')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900">
                                  {source.count}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-500">
                                  {source.count === 1 ? t('charts.lead') : t('charts.leadsPlural')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>

      {/* Pipeline Charts Group */}
    <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('charts.salesPipeline')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
              {t('charts.leadDistributionByStage')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={400} className="sm:h-[550px]">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, bottom: 50, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  className="sm:text-[11px]"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} className="sm:text-[11px]" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} ${t('charts.leadsPlural')}`,
                    props.payload.status
                  ]}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ color: '#64748b', fontSize: '13px' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={90}>
                  {pipelineData.map((entry, index) => {
                    const stageColor = statusToColorMap.get(entry.status) || COLORS[index % COLORS.length]
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={stageColor} 
                        className="hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                      />
                    )
                  })}
                </Bar>
              </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
          <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-xl font-semibold text-slate-900">{t('charts.valueByPipelineStage')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                {t('charts.financialDistribution')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={400} className="sm:h-[550px]">
              <BarChart 
                data={pipelineData} 
                margin={{ top: 10, right: 10, bottom: 60, left: 5 }}
                barGap={8}
              >
                <defs>
                  {pipelineData.map((entry, index) => {
                    const stageColor = statusToColorMap.get(entry.status) || COLORS[index % COLORS.length]
                    return (
                      <linearGradient key={`value-gradient-${index}`} id={`value-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stageColor} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={stageColor} stopOpacity={0.7} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  className="sm:text-[13px]"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${getCurrencySymbol(locale)}${(value / 1000).toFixed(0)}k`}
                  className="sm:text-[12px]"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    formatCurrency(Number(value), locale), 
                    props.payload.status
                  ]}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ color: '#64748b', fontSize: '13px' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={90}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#value-gradient-${index})`}
                      className="hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.07))'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Charts Group */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{t('charts.chatsByPlatform')}</CardTitle>
          <CardDescription>
            {t('charts.communicationDistribution')}
          </CardDescription>
        </CardHeader>
        <CardContent>
             <div className="space-y-6">
            {stats.conversationStats.map((stat, index) => (
                 <div key={stat.platform} className="space-y-3">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                       <span className="text-sm font-semibold text-slate-900">{stat.platform}</span>
                </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-muted-foreground">{t('charts.totalConversations')}</span>
                <div className="text-right">
                       <div className="text-2xl font-semibold">{stat.count}</div>
                  </div>
                </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] sm:text-sm font-medium text-muted-foreground">{t('charts.activeConversations')}</span>
                     <div className="text-right">
                       <div className="text-xl sm:text-2xl font-semibold text-emerald-600">{stat.active}</div>
                     </div>
                   </div>
                   <div className="pt-3 sm:pt-4 border-t">
                     <div className="flex justify-between items-center">
                       <span className="text-[10px] sm:text-xs text-muted-foreground">{t('charts.activityRate')}</span>
                       <span className="text-[10px] sm:text-xs font-medium">{stat.count > 0 ? ((stat.active / stat.count) * 100).toFixed(0) : 0}%</span>
                     </div>
                     <div className="mt-1.5 sm:mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full transition-all duration-500"
                         style={{ 
                           width: `${stat.count > 0 ? (stat.active / stat.count) * 100 : 0}%`,
                           backgroundColor: COLORS[index % COLORS.length]
                         }}
                       />
                     </div>
                   </div>
                   {index < stats.conversationStats.length - 1 && (
                     <div className="pt-3 sm:pt-4 border-b border-slate-100" />
                   )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-semibold">{t('performance.overallPerformance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.conversionRate')}</span>
              <span className="text-sm sm:text-base font-semibold">{stats.conversionRate.toFixed(1)}%</span>
    </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.averageTicket')}</span>
              <span className="text-sm sm:text-base font-semibold">
                {formatCurrency(averageLeadValue, locale)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.totalSales')}</span>
              <span className="text-sm sm:text-base font-semibold text-emerald-600 truncate">
                {formatCurrency(wonValue, locale)}
              </span>
            </div>
          </CardContent>
        </Card>

         <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-3 sm:p-6">
             <CardTitle className="text-sm sm:text-base font-semibold">{t('employeeStats.conversationActivity')}</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
             <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.totalConversations')}</span>
               <span className="text-sm sm:text-base font-semibold">{stats.conversationStats[0]?.count || 0}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.activeConversations')}</span>
               <span className="text-sm sm:text-base font-semibold">
                 {stats.conversationStats[0]?.active || 0}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.activityRate')}</span>
               <span className="text-sm sm:text-base font-semibold">
                 {stats.conversationStats[0] && stats.conversationStats[0].count > 0
                   ? ((stats.conversationStats[0].active / stats.conversationStats[0].count) * 100).toFixed(1)
                   : '0.0'}%
               </span>
             </div>
           </CardContent>
         </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-semibold">{t('performance.funnelAnalysis')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.inPipeline')}</span>
              <span className="text-sm sm:text-base font-semibold">
                {stats.totalLeads - wonLeads - lostLeads}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.winRate')}</span>
              <span className="text-sm sm:text-base font-semibold text-emerald-600">{winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('performance.inNegotiation')}</span>
              <span className="text-sm sm:text-base font-semibold">
                {stats.leadsByStatus.find(s => s.status === 'Negotiation')?.count || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance - Sales Rep */}
      {stats.leadsByUser && stats.leadsByUser.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('teamPerformance.title')}</CardTitle>
        <CardDescription>
              {t('teamPerformance.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
            <div className="space-y-6">
              {stats.leadsByUser.map((user, index) => {
                const userPercentage = (user.count / stats.totalLeads) * 100
                const avgTicket = user.count > 0 ? user.value / user.count : 0
                
                return (
                  <div key={user.userName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('teamPerformance.avgTicket')}: {formatCurrency(avgTicket, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold">{user.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(user.value, locale)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min(userPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground min-w-[45px] text-right">
                        {userPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Team statistics */}
            <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 truncate overflow-hidden break-words">
                  {stats.leadsByUser.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('teamPerformance.activeSalesReps')}</p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 truncate overflow-hidden break-words">
                  {Math.round(stats.totalLeads / stats.leadsByUser.length)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('teamPerformance.leadsPerRep')}</p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 truncate overflow-hidden break-words px-1">
                  {formatCurrency(stats.totalValue / stats.leadsByUser.length, locale, { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('teamPerformance.valuePerRep')}</p>
              </div>
            </div>
      </CardContent>
    </Card>
      )}
  </div>
  );
}

// Função para converter hex para RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Função para converter RGB para HSL
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Função para converter HSL para RGB
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

// Função para converter RGB para hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// Função para normalizar cor para ter saturação e luminosidade consistentes (similar às cores pré-definidas)
// Cores pré-definidas têm saturação ~75% e luminosidade ~45% (escala 600)
const normalizeColor = (hex: string): string => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  
  // Manter o matiz (hue) original, mas normalizar saturação e luminosidade
  // Saturação: 75% (similar às cores 600 do Tailwind)
  // Luminosidade: 45% (similar às cores 600 do Tailwind)
  const normalizedHsl = {
    h: hsl.h,
    s: 75, // Saturação fixa para consistência
    l: 45  // Luminosidade fixa para consistência
  }

  const normalizedRgb = hslToRgb(normalizedHsl.h, normalizedHsl.s, normalizedHsl.l)
  return rgbToHex(normalizedRgb.r, normalizedRgb.g, normalizedRgb.b)
}

// Função helper para extrair cor de fundo de qualquer formato e converter para hex normalizado
const extractBgColor = (colorInput: string): string => {
  if (!colorInput || typeof colorInput !== 'string') {
    return '#2563eb' // Cor padrão (blue-600)
  }
  
  const trimmed = colorInput.trim()
  let extractedHex = ''
  
  // Se já é hex direto (#000000)
  if (trimmed.startsWith('#')) {
    extractedHex = trimmed
  }
  
  // Se é JSON ({"bg":"#000000","text":"#FFFFFF"})
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed?.bg && typeof parsed.bg === 'string') {
        extractedHex = parsed.bg.startsWith('#') ? parsed.bg : parsed.bg
      }
    } catch {
      // Ignorar erro de parse
    }
  }
  
  // Se ainda não extraiu, tentar mapeamento de classes Tailwind
  if (!extractedHex) {
    // Mapeamento de classes Tailwind bg-* para cores hexadecimais
    // Foco nas cores mais comuns usadas no CRM
    const tailwindColors: Record<string, string> = {
    // Blue
    'bg-blue-50': '#eff6ff', 'bg-blue-100': '#dbeafe', 'bg-blue-200': '#bfdbfe', 'bg-blue-300': '#93c5fd',
    'bg-blue-400': '#60a5fa', 'bg-blue-500': '#3b82f6', 'bg-blue-600': '#2563eb', 'bg-blue-700': '#1d4ed8',
    'bg-blue-800': '#1e40af', 'bg-blue-900': '#1e3a8a',
    // Red
    'bg-red-50': '#fef2f2', 'bg-red-100': '#fee2e2', 'bg-red-200': '#fecaca', 'bg-red-300': '#fca5a5',
    'bg-red-400': '#f87171', 'bg-red-500': '#ef4444', 'bg-red-600': '#dc2626', 'bg-red-700': '#b91c1c',
    'bg-red-800': '#991b1b', 'bg-red-900': '#7f1d1d',
    // Yellow
    'bg-yellow-50': '#fefce8', 'bg-yellow-100': '#fef9c3', 'bg-yellow-200': '#fef08a', 'bg-yellow-300': '#fde047',
    'bg-yellow-400': '#facc15', 'bg-yellow-500': '#eab308', 'bg-yellow-600': '#ca8a04', 'bg-yellow-700': '#a16207',
    'bg-yellow-800': '#854d0e', 'bg-yellow-900': '#713f12',
    // Green
    'bg-green-50': '#f0fdf4', 'bg-green-100': '#dcfce7', 'bg-green-200': '#bbf7d0', 'bg-green-300': '#86efac',
    'bg-green-400': '#4ade80', 'bg-green-500': '#22c55e', 'bg-green-600': '#16a34a', 'bg-green-700': '#15803d',
    'bg-green-800': '#166534', 'bg-green-900': '#14532d',
    // Orange
    'bg-orange-50': '#fff7ed', 'bg-orange-100': '#ffedd5', 'bg-orange-200': '#fed7aa', 'bg-orange-300': '#fdba74',
    'bg-orange-400': '#fb923c', 'bg-orange-500': '#f97316', 'bg-orange-600': '#ea580c', 'bg-orange-700': '#c2410c',
    'bg-orange-800': '#9a3412', 'bg-orange-900': '#7c2d12',
    // Purple
    'bg-purple-50': '#faf5ff', 'bg-purple-100': '#f3e8ff', 'bg-purple-200': '#e9d5ff', 'bg-purple-300': '#d8b4fe',
    'bg-purple-400': '#c084fc', 'bg-purple-500': '#a855f7', 'bg-purple-600': '#9333ea', 'bg-purple-700': '#7e22ce',
    'bg-purple-800': '#6b21a8', 'bg-purple-900': '#581c87',
    // Indigo
    'bg-indigo-50': '#eef2ff', 'bg-indigo-100': '#e0e7ff', 'bg-indigo-200': '#c7d2fe', 'bg-indigo-300': '#a5b4fc',
    'bg-indigo-400': '#818cf8', 'bg-indigo-500': '#6366f1', 'bg-indigo-600': '#4f46e5', 'bg-indigo-700': '#4338ca',
    'bg-indigo-800': '#3730a3', 'bg-indigo-900': '#312e81',
    // Pink
    'bg-pink-50': '#fdf2f8', 'bg-pink-100': '#fce7f3', 'bg-pink-200': '#fbcfe8', 'bg-pink-300': '#f9a8d4',
    'bg-pink-400': '#f472b6', 'bg-pink-500': '#ec4899', 'bg-pink-600': '#db2777', 'bg-pink-700': '#be185d',
    'bg-pink-800': '#9f1239', 'bg-pink-900': '#831843',
    // Gray/Slate
    'bg-gray-50': '#f9fafb', 'bg-gray-100': '#f3f4f6', 'bg-gray-200': '#e5e7eb', 'bg-gray-300': '#d1d5db',
    'bg-gray-400': '#9ca3af', 'bg-gray-500': '#6b7280', 'bg-gray-600': '#4b5563', 'bg-gray-700': '#374151',
    'bg-gray-800': '#1f2937', 'bg-gray-900': '#111827',
    'bg-slate-50': '#f8fafc', 'bg-slate-100': '#f1f5f9', 'bg-slate-200': '#e2e8f0', 'bg-slate-300': '#cbd5e1',
    'bg-slate-400': '#94a3b8', 'bg-slate-500': '#64748b', 'bg-slate-600': '#475569', 'bg-slate-700': '#334155',
    'bg-slate-800': '#1e293b', 'bg-slate-900': '#0f172a',
    // Black/White
    'bg-black': '#000000',
    'bg-white': '#ffffff',
  }
  
    // Extrair a classe bg-* da string (pode conter múltiplas classes como "bg-blue-100 border-blue-200 text-blue-800")
    const bgMatch = trimmed.match(/bg-[\w-]+/)
    if (bgMatch) {
      const bgClass = bgMatch[0]
      const hexColor = tailwindColors[bgClass]
      if (hexColor) {
        extractedHex = hexColor
      }
    }
  }
  
  // Se não conseguiu extrair, usar cor padrão
  if (!extractedHex) {
    extractedHex = '#2563eb' // Cor padrão (blue-600)
  }
  
  // Normalizar a cor para ter saturação e luminosidade consistentes
  // Isso garante que cores personalizadas tenham a mesma aparência que as pré-definidas
  return normalizeColor(extractedHex)
}

// Componente para Dashboard de Employee
const EmployeeDashboard = ({ stats, pipelineStages }: { stats: DashboardStats; pipelineStages: any[] }) => {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  const { apiCall } = useApi()
  const [notes, setNotes] = React.useState<string>('')
  const [notesLoading, setNotesLoading] = React.useState(false)
  const [notesSaving, setNotesSaving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle')
  const [initialNotesLoaded, setInitialNotesLoaded] = React.useState(false)
  const [hasUserEdited, setHasUserEdited] = React.useState(false)
  const notesFetchedRef = React.useRef(false)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const initialNotesValueRef = React.useRef<string>('')
  
  // Usar todas as stages do pipeline (agora são dinâmicas/personalizadas)
  const pipelineData = React.useMemo(() => stats.leadsByStatus, [stats.leadsByStatus])
  
  // Criar mapeamento de status para cor de fundo das stages
  const statusToColorMap = React.useMemo(() => {
    const map = new Map<string, string>()
    
    pipelineData.forEach((entry) => {
      // Tentar encontrar a stage pelo nome ou pelo slug
      const matchingStage = pipelineStages.find((s: any) => {
        return s.name === entry.status || s.slug === entry.status
      })
      
      if (matchingStage && matchingStage.color) {
        const hexColor = extractBgColor(matchingStage.color)
        map.set(entry.status, hexColor)
      } else {
        // Se não encontrar, usar cor padrão da empresa (já normalizada)
        map.set(entry.status, '#2563eb')
      }
    })
    
    return map
  }, [pipelineData, pipelineStages])
  
  // Memoizar os dados do gráfico com cores para evitar re-renders desnecessários
  const chartDataWithColors = React.useMemo(() => {
    return pipelineData.map((entry, index) => ({
      ...entry,
      color: statusToColorMap.get(entry.status) || COLORS[index % COLORS.length]
    }))
  }, [pipelineData, statusToColorMap])
  
  // Buscar notas ao carregar (apenas uma vez)
  React.useEffect(() => {
    const fetchNotes = async () => {
      try {
        setNotesLoading(true)
        
        // Usar fetch direto para garantir que funcione
        const token = localStorage.getItem('token')
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        
        const response = await fetch(`${API_BASE_URL}/auth/employee-notes`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // A API retorna { success: true, notes: "..." } ou { success: true, notes: null }
        let loadedNotes = ''
        if (data && data.success !== false) {
          // Pegar notes mesmo se for null ou undefined
          if (data.notes !== undefined && data.notes !== null) {
            loadedNotes = String(data.notes)
          } else {
            loadedNotes = ''
          }
        }
        
        setNotes(loadedNotes)
        initialNotesValueRef.current = loadedNotes // Salvar valor inicial para comparação
        setInitialNotesLoaded(true) // Marcar que as notas iniciais foram carregadas
        notesFetchedRef.current = true
      } catch (error) {
        console.error('Error fetching notes:', error)
        setInitialNotesLoaded(true) // Marcar como carregado mesmo em erro
        notesFetchedRef.current = true
      } finally {
        setNotesLoading(false)
      }
    }
    
    // Sempre buscar ao montar o componente (para funcionar após F5)
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Salvar notas automaticamente
  const saveNotes = React.useCallback(async (notesToSave: string) => {
    try {
      setNotesSaving(true)
      setSaveStatus('saving')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/employee-notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesToSave }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save notes')
      }
      
      setSaveStatus('saved')
      // Limpar status "saved" após 1 segundo
      setTimeout(() => {
        setSaveStatus('idle')
      }, 1000)
      // Atualizar valor inicial para evitar salvar novamente se voltar ao mesmo valor
      initialNotesValueRef.current = notesToSave
      setHasUserEdited(false) // Resetar flag de edição após salvar
    } catch (error) {
      console.error('Error saving notes:', error)
      setSaveStatus('idle')
      alert('Erro ao salvar anotações')
    } finally {
      setNotesSaving(false)
    }
  }, [])
  
  // Debounce: salvar automaticamente após parar de digitar por 2 segundos
  React.useEffect(() => {
    // Não salvar se ainda não carregou as notas iniciais
    if (!initialNotesLoaded) return
    
    // Não salvar se o usuário não editou as notas (comparar com valor inicial)
    if (!hasUserEdited || notes === initialNotesValueRef.current) return
    
    // Limpar timeout anterior se existir
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Criar novo timeout para salvar após 2 segundos de inatividade
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(notes)
    }, 2000)
    
    // Cleanup: limpar timeout quando o componente desmontar ou notes mudar
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [notes, saveNotes, initialNotesLoaded, hasUserEdited])
  
  // Salvar notas manualmente (botão ainda disponível)
  const handleSaveNotes = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveNotes(notes)
  }
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setNotes(newValue)
    setSaveStatus('idle') // Resetar status ao digitar
    setHasUserEdited(true) // Marcar que o usuário editou
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 p-1">
      {/* Header com título */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">{t('title')}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('employeeStats.overviewDescription')}</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Card Meus Leads */}
        <Card className="border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">
                  {t('employeeStats.myLeads')}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl font-bold text-black">{stats.totalLeads}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Conversas Ativas */}
        <Card className="border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">
                  {t('employeeStats.activeConversations')}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl font-bold text-black">{stats.totalConversations}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Notas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Gráfico de Leads por Status */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
            <CardTitle className="text-base sm:text-xl font-semibold text-black">{t('charts.leadsByStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {chartDataWithColors.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={chartDataWithColors} margin={{ top: 5, right: 5, bottom: 40, left: -5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="status" 
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    className="sm:text-[12px]"
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    className="sm:text-[12px]"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'count') {
                        return [value, locale === 'pt-BR' ? 'Quantidade' : 'Count']
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label) => label}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={false}
                  >
                    {chartDataWithColors.map((entry, index) => (
                      <Cell 
                        key={`cell-${entry.status}-${index}`} 
                        fill={entry.color} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm">{t('employeeStats.noLeadsInPipeline')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloco de Notas */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
            <CardTitle className="text-base sm:text-xl font-semibold text-black">{t('employeeStats.notesTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {notesLoading ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-[#3b82f6] border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <textarea
                  className="w-full h-[200px] sm:h-[250px] p-3 sm:p-4 border-2 border-gray-200 rounded-lg resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
                  value={notes || ''}
                  onChange={handleNotesChange}
                  placeholder={t('employeeStats.notesPlaceholder')}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotes} 
                    disabled={notesSaving || saveStatus === 'saving'}
                    className={`font-medium px-4 sm:px-6 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all ${
                      saveStatus === 'saved' 
                        ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                        : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white cursor-pointer'
                    } ${(notesSaving || saveStatus === 'saving') ? 'cursor-not-allowed opacity-50' : ''}`}
                    size="sm"
                  >
                    {notesSaving || saveStatus === 'saving' 
                      ? t('employeeStats.saving') 
                      : saveStatus === 'saved' 
                        ? t('employeeStats.saved') 
                        : t('employeeStats.save')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { isClient, apiCall } = useApi()
  const t = useTranslations('Dashboard')
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [allLeads, setAllLeads] = React.useState<Lead[]>([])
  const [pipelineStages, setPipelineStages] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isClient) return

    // Buscar dados do usuário para verificar role e ID
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          const role = data.user?.role || 'employee'
          const id = data.user?.id || null
          setUserRole(role)
          setUserId(id)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setUserRole('employee')
      }
    }

    fetchUserData()
  }, [isClient])

  React.useEffect(() => {
    if (!isClient || userRole === null) return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Buscar pipeline stages
        const stagesResponse = await apiCall('/pipeline-stages')
        const stages = stagesResponse.data || []
        setPipelineStages(stages)
        
        // Criar mapa de status para stage_type
        const statusToTypeMap = new Map<string, string>()
        stages.forEach((stage: any) => {
          if (stage.slug) {
            statusToTypeMap.set(stage.slug, stage.stage_type || 'progress')
          }
        })
        
        // Buscar todos os leads (filtrar por employee se necessário)
        let leadsResponse
        if (userRole === 'employee' && userId) {
          // Employee só vê seus próprios leads
          leadsResponse = await apiService.searchLeads({ assigned_user_id: userId })
        } else {
          // Admin e Master veem todos os leads
          leadsResponse = await apiService.getAllLeads()
        }
        
        if (!leadsResponse.success) {
          throw new Error(leadsResponse.error || 'Erro ao buscar leads')
        }

        const leads = leadsResponse.data?.leads || []
        
        // Salvar leads brutos para processamento dinâmico
        setAllLeads(leads)
        
        // Buscar conversas do Telegram
        const telegramResponse = await apiService.getTelegramConversations()
        const conversations = telegramResponse.success ? (telegramResponse.data?.conversations || []) : []

        // Calcular estatísticas
        const totalLeads = leads.length
        // Calcular valor total excluindo leads perdidos (mesma lógica do pipeline)
        const totalValue = leads.reduce((sum, lead) => {
          // Encontrar a stage correspondente para verificar se é do tipo 'lost'
          const matchingStage = stages.find((s: any) => s.slug === lead.status)
          if (matchingStage && matchingStage.stage_type === 'lost') return sum
          return sum + (Number(lead.value) || 0)
        }, 0)
        
        // Agrupar leads por stage (usando as stages personalizadas)
        const leadsByStatusMap = new Map<string, { count: number; value: number; stageType?: string }>()
        leads.forEach(lead => {
          // Apenas contar leads que estão configurados para aparecer no pipeline
          if (!lead.show_on_pipeline) return
          
          const status = lead.status || 'Novo'
          // Encontrar a stage correspondente para pegar o nome e o tipo
          const matchingStage = stages.find((s: any) => s.slug === status)
          const stageName = matchingStage?.name || status
          const stageType = matchingStage?.stage_type
          
          const current = leadsByStatusMap.get(stageName) || { count: 0, value: 0, stageType }
          leadsByStatusMap.set(stageName, {
            count: current.count + 1,
            value: current.value + (Number(lead.value) || 0),
            stageType: stageType
          })
        })
        
        // Ordenar stages pela ordem definida no banco de dados
        const leadsByStatus = Array.from(leadsByStatusMap.entries())
          .map(([status, data]) => ({
            status,
            count: data.count,
            value: data.value,
            stageType: data.stageType
          }))
          .sort((a, b) => {
            // Encontrar a ordem das stages no array de stages
            const stageA = stages.find((s: any) => s.name === a.status)
            const stageB = stages.find((s: any) => s.name === b.status)
            const orderA = stageA?.order ?? 9999
            const orderB = stageB?.order ?? 9999
            return orderA - orderB
          })

        // Agrupar leads por fonte
        const leadsBySourceMap = new Map<string, number>()
        leads.forEach(lead => {
          const source = lead.source || 'Direto'
          leadsBySourceMap.set(source, (leadsBySourceMap.get(source) || 0) + 1)
        })
        const leadsBySource = Array.from(leadsBySourceMap.entries())
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count) // Ordenar por quantidade

        // Calcular tendência mensal baseado em created_at dos leads
        const now = new Date()
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const last6Months = []
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const monthName = monthNames[date.getMonth()]
          
          // Filtrar leads criados neste mês
          const monthLeads = leads.filter(lead => {
            const leadDate = new Date(lead.created_at)
            const leadMonthKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`
            return leadMonthKey === monthKey
          })
          
          // Calcular valor mensal excluindo leads perdidos
          const monthValue = monthLeads.reduce((sum, lead) => {
            // Encontrar a stage correspondente para verificar se é do tipo 'lost'
            const matchingStage = stages.find((s: any) => s.slug === lead.status)
            if (matchingStage && matchingStage.stage_type === 'lost') return sum
            return sum + (Number(lead.value) || 0)
          }, 0)
          
          last6Months.push({
            month: monthName,
            leads: monthLeads.length,
            value: monthValue
          })
        }

        // Estatísticas de conversas por plataforma (apenas dados reais do Telegram)
        const telegramActive = conversations.filter((c: any) => {
          // Considerar ativo se teve mensagem nos últimos 7 dias
          if (!c.last_message_at) return false
          const lastMessageDate = new Date(c.last_message_at)
          const daysSinceLastMessage = (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLastMessage <= 7
        }).length

        const conversationStats = [
          { 
            platform: 'Telegram', 
            count: conversations.length, 
            active: telegramActive
          }
        ]

        const totalConversations = conversations.length
        
        // Calcular taxa de conversão real usando stage_type (entry → won)
        const entryStages = stages.filter((s: any) => s.stage_type === 'entry')
        const wonStages = stages.filter((s: any) => s.stage_type === 'won')
        
        const entryLeadsCount = leads.filter(lead => {
          const matchingStage = stages.find((s: any) => s.slug === lead.status)
          return matchingStage && matchingStage.stage_type === 'entry'
        }).length
        
        const wonLeadsCount = leads.filter(lead => {
          const matchingStage = stages.find((s: any) => s.slug === lead.status)
          return matchingStage && matchingStage.stage_type === 'won'
        }).length
        
        // Taxa de conversão: ganhos / entrada (ou ganhos / total se não houver stage de entrada)
        const conversionRate = entryLeadsCount > 0 
          ? ((wonLeadsCount / entryLeadsCount) * 100) 
          : totalLeads > 0 
            ? ((wonLeadsCount / totalLeads) * 100)
            : 0

        // Buscar informações de usuários (apenas para master/admin)
        let leadsByUser: { userName: string; count: number; value: number }[] = []
        if (userRole === 'master' || userRole === 'admin') {
          try {
            const usersResponse = await apiService.getOrganizationUsers(true)
            if (usersResponse.success && usersResponse.data?.employees) {
              const users = usersResponse.data.employees
              
              // Agrupar leads por usuário
              const leadsByUserMap = new Map<string, { count: number; value: number }>()
              
              leads.forEach(lead => {
                // Only count leads that are assigned to a user (not created_by)
                if (!lead.assigned_user_id) return
                
                const userId = lead.assigned_user_id
                const user = users.find((u: any) => u.id === userId)
                const userName = user?.name || t('Common.unassigned', { default: 'Unassigned' })
                
                const current = leadsByUserMap.get(userName) || { count: 0, value: 0 }
                // Contar o lead, mas excluir valor se for perdido
                const leadValue = lead.status === 'Lost' ? 0 : (Number(lead.value) || 0)
                leadsByUserMap.set(userName, {
                  count: current.count + 1,
                  value: current.value + leadValue
                })
              })
              
              leadsByUser = Array.from(leadsByUserMap.entries())
                .map(([userName, data]) => ({
                  userName,
                  count: data.count,
                  value: data.value
                }))
                .sort((a, b) => b.count - a.count) // Ordenar por quantidade
            }
          } catch (error) {
            console.error('Error fetching users:', error)
          }
        }

        setStats({
          totalLeads,
          totalConversations,
          totalValue,
          conversionRate,
          leadsByStatus,
          leadsBySource,
          monthlyTrend: last6Months,
          conversationStats,
          leadsByUser
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(t('errorLoadingData'))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isClient, userRole, userId])

  if (loading) {
    return (
      <AuthGuard orgSlug={org}>
        <SidebarProvider>
          <AppSidebar org={org} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-all">
              <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    {t('title')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                      <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
              </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('loadingDashboard')}</p>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard orgSlug={org}>
        <SidebarProvider>
          <AppSidebar org={org} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-all">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={`/${org}/dashboard`}>
                        {t('title')}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-center text-red-600">{t('Common.error', { default: 'Error' })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">{error}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  if (!stats) return null

  // Renderizar dashboard baseado no cargo
  const renderDashboard = () => {
    // Normalizar o role para lowercase e trim para evitar problemas de comparação
    const normalizedRole = userRole?.toString().toLowerCase().trim()
    
    if (normalizedRole === 'admin') {
      return <AdminDashboard stats={stats} leads={allLeads} pipelineStages={pipelineStages} />
    } else if (normalizedRole === 'master') {
      return <MasterDashboard stats={stats} leads={allLeads} pipelineStages={pipelineStages} />
    } else {
      return <EmployeeDashboard stats={stats} pipelineStages={pipelineStages} />
    }
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-all">
            <div className="flex items-center gap-2 px-2 sm:px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={`/${org}/dashboard`}>
                      {t('title')}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm sm:text-base">
                      {t('title')} <span className="hidden sm:inline">{userRole === 'admin' && `(${t('roles.admin')})`}
                      {userRole === 'master' && `(${t('roles.master')})`}
                      {userRole === 'employee' && `(${t('roles.employee')})`}</span>
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-2 sm:gap-4 p-2 sm:p-4 pt-0">
            <div className="max-w-[1600px] mx-auto w-full">
            {renderDashboard()}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}