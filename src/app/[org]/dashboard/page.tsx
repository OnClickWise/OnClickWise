"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
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
import { apiService, Lead } from "@/lib/api"
import { useApi } from "@/hooks/useApi"

// Cores minimalistas para os gráficos
const COLORS = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#64748b', // slate-500
]

interface DashboardStats {
  totalLeads: number
  totalConversations: number
  totalValue: number
  conversionRate: number
  leadsByStatus: { status: string; count: number; value: number }[]
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
  customEndDate?: string
): { month: string; fullDate?: string; leads: number; value: number }[] => {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
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
        if (lead.status === 'Lost') return sum;
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
        if (lead.status === 'Lost') return sum;
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
const AdminDashboard = ({ stats, leads }: { stats: DashboardStats; leads: Lead[] }) => {
  // Filtrar apenas status do pipeline (nomes exatos do banco de dados)
  const pipelineStatuses = ['New', 'In Contact', 'Qualified', 'Lost'];
  const pipelineData = stats.leadsByStatus.filter(s => pipelineStatuses.includes(s.status));
  
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
  
  // Obter dados da fonte selecionada
  const selectedSourceData = selectedSource 
    ? stats.leadsBySource.find(s => s.source === selectedSource)
    : null;
  
  // Aplicar animação explode diretamente no DOM após render
  React.useEffect(() => {
    if (!leadSourcesChartRef.current) return;
    
    // Pequeno delay para garantir que o SVG foi renderizado
    const timer = setTimeout(() => {
      const svgElement = leadSourcesChartRef.current?.querySelector('svg');
      if (!svgElement) return;
      
      // Tentar diferentes seletores
      let sectors = svgElement.querySelectorAll('.recharts-pie-sector');
      if (sectors.length === 0) {
        sectors = svgElement.querySelectorAll('.recharts-pie .recharts-layer');
      }
      
      sectors.forEach((sector: Element, index: number) => {
        const pathElement = sector.querySelector('path') as SVGPathElement | null;
        if (!pathElement) return;
        
        const sectorElement = sector as SVGGElement;
        const isActive = index === activeIndex;
        
        if (isActive) {
          const explodeDistance = 15;
          
          // Pegar o centro do gráfico
          const svgRect = svgElement.getBoundingClientRect();
          const pieGroup = svgElement.querySelector('.recharts-pie');
          let chartCenterX = svgRect.width / 2;
          let chartCenterY = svgRect.height / 2;
          
          if (pieGroup) {
            const transform = pieGroup.getAttribute('transform');
            if (transform) {
              const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
              if (match) {
                chartCenterX = parseFloat(match[1]);
                chartCenterY = parseFloat(match[2]);
              }
            }
          }
          
          // Usar método de centróide mais preciso
          // Pegar múltiplos pontos ao longo do path e calcular o centróide real
          const pathLength = pathElement.getTotalLength();
          const numSamples = 20; // Mais amostras = mais preciso
          let sumX = 0;
          let sumY = 0;
          
          for (let i = 0; i <= numSamples; i++) {
            const point = pathElement.getPointAtLength((i / numSamples) * pathLength);
            sumX += point.x;
            sumY += point.y;
          }
          
          const centroidX = sumX / (numSamples + 1);
          const centroidY = sumY / (numSamples + 1);
          
          // Calcular vetor normalizado do centro do gráfico para o centróide
          const dx = centroidX - chartCenterX;
          const dy = centroidY - chartCenterY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (dx / length) * explodeDistance;
          const offsetY = (dy / length) * explodeDistance;
          
          // Cancelar qualquer animação anterior
          const animations = sectorElement.getAnimations();
          animations.forEach(anim => anim.cancel());
          
          // Animar suavemente usando Web Animations API
          const animation = sectorElement.animate(
            [
              { transform: 'translate(0px, 0px)' },
              { transform: `translate(${offsetX}px, ${offsetY}px)` }
            ],
            {
              duration: 400,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              fill: 'forwards'
            }
          );
          
          // Aplicar o transform final após a animação
          animation.onfinish = () => {
            sectorElement.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);
          };
          
          pathElement.style.filter = 'drop-shadow(0 8px 20px rgba(59, 130, 246, 0.6)) brightness(1.15)';
          
          // Fazer o setor ficar por cima (z-index)
          sectorElement.style.zIndex = '10';
          sector.classList.add('pie-sector-exploded');
        } else {
          // Cancelar qualquer animação anterior
          const animations = sectorElement.getAnimations();
          animations.forEach(anim => anim.cancel());
          
          const currentTransform = sectorElement.getAttribute('transform');
          
          // Verificar se tem transform não-zero (considerando possíveis formatos)
          const hasTransform = currentTransform && 
            currentTransform !== 'translate(0, 0)' && 
            currentTransform !== 'translate(0px, 0px)' &&
            !currentTransform.match(/translate\(0,?\s*0\)/);
          
          if (hasTransform) {
            // Converter o transform do SVG para formato CSS (adicionar 'px' se necessário)
            const cssTransform = currentTransform.replace(/translate\(([-\d.]+),\s*([-\d.]+)\)/, 'translate($1px, $2px)');
            
            // Animar de volta suavemente
            const animation = sectorElement.animate(
              [
                { transform: cssTransform },
                { transform: 'translate(0px, 0px)' }
              ],
              {
                duration: 400,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                fill: 'forwards'
              }
            );
            
            // Remover transform final após a animação
            animation.onfinish = () => {
              sectorElement.setAttribute('transform', 'translate(0, 0)');
              pathElement.style.filter = 'none';
              sectorElement.style.zIndex = '';
              sector.classList.remove('pie-sector-exploded');
            };
          } else {
            // Já está na posição original, apenas limpar estilos
            pathElement.style.filter = 'none';
            sectorElement.style.zIndex = '';
            sector.classList.remove('pie-sector-exploded');
          }
        }
      });
    }, 100); // Delay de 100ms para garantir render
    
    return () => clearTimeout(timer);
  }, [activeIndex, stats.leadsBySource]);
  
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
    return processLeadTrend(leads, timePeriod, customStartDate, customEndDate);
  }, [leads, timePeriod, customStartDate, customEndDate]);
  
  // Calcular dados adicionais
  const wonLeads = stats.leadsByStatus.find(s => s.status === 'Closed Won')?.count || 0;
  const lostLeads = stats.leadsByStatus.find(s => s.status === 'Lost')?.count || 0;
  const wonValue = stats.leadsByStatus.find(s => s.status === 'Closed Won')?.value || 0;
  const winRate = stats.totalLeads > 0 ? ((wonLeads / stats.totalLeads) * 100) : 0;
  const averageLeadValue = stats.totalLeads > 0 ? (stats.totalValue / stats.totalLeads) : 0;


  return (
  <div className="space-y-6">
      {/* Main Statistics Cards - Admin */}
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across the company
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="text-emerald-600 font-medium">{wonLeads} won</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-rose-600 font-medium">{lostLeads} lost</span>
            </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">
              $ {stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average value: $ {averageLeadValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-3 text-xs">
              <span className="text-emerald-600 font-medium">
                $ {wonValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} in sales
              </span>
            </div>
        </CardContent>
      </Card>

         <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Active Conversations</CardTitle>
             <MessageSquare className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
             <div className="text-3xl font-semibold">{stats.totalConversations}</div>
             <p className="text-xs text-muted-foreground mt-2">
               Total conversations
             </p>
             <div className="mt-3 flex items-center gap-2">
               <div className="flex-1">
                 <p className="text-xs text-muted-foreground">Active (7 days)</p>
                 <p className="text-lg font-semibold text-emerald-600">{stats.conversationStats[0]?.active || 0}</p>
               </div>
             </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {wonLeads} won of {wonLeads + lostLeads} closed
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
            <CardTitle className="text-lg">Leads & Revenue Evolution</CardTitle>
          <CardDescription>
              Select time period to analyze trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Period Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="time-period" className="text-sm font-medium mb-2 block">
                  Time Period
                </Label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger id="time-period" className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="custom">Custom dates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {timePeriod === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                      Start Date
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
                      End Date
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
                  Showing data from {(() => {
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
                      Period limited to 1 year (365 days) for performance. Showing data from the last year of your selection.
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
                Leads
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
                Revenue
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300} style={{ userSelect: 'none' }}>
              <LineChart 
                data={filteredMonthlyTrend}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                                <p className="text-blue-600 font-semibold">Leads: {current.leads}</p>
                                <p className={`text-xs font-medium ${leadsDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {leadsDiff >= 0 ? '+' : ''}{leadsDiff} ({leadsPercent >= '0' ? '+' : ''}{leadsPercent}%)
                                </p>
                              </div>
                            )}
                            {visibleMetrics.value && (
                              <div>
                                <p className="text-emerald-600 font-semibold">Revenue: $ {current.value.toLocaleString('en-US')}</p>
                                <p className={`text-xs font-medium ${valueDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {valueDiff >= 0 ? '+' : ''}$ {valueDiff.toLocaleString('en-US')} ({valuePercent >= '0' ? '+' : ''}{valuePercent}%)
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">vs {selectedDisplayDate}</p>
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
                          <p className="font-semibold mb-2">Range Summary</p>
                          <p className="text-slate-600 text-[10px] mb-2 font-medium">
                            {startDisplayDate} - {endDisplayDate}
                          </p>
                          <div className="space-y-1">
                            {visibleMetrics.leads && (
                              <>
                                <p className="text-blue-600 font-semibold">Total Leads: {totalLeads}</p>
                                <p className="text-blue-600 text-[10px] font-medium">Avg: {avgLeads.toFixed(1)}</p>
                              </>
                            )}
                            {visibleMetrics.value && (
                              <>
                                <p className="text-emerald-600 font-semibold">Total Revenue: $ {totalValue.toLocaleString('en-US')}</p>
                                <p className="text-emerald-600 text-[10px] font-medium">Avg: $ {avgValue.toLocaleString('en-US')}</p>
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
                          <p className="text-blue-600 font-semibold">Leads: {current.leads}</p>
                        )}
                        {visibleMetrics.value && (
                          <p className="text-emerald-600 font-semibold">Revenue: $ {current.value.toLocaleString('en-US')}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">Click to select</p>
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
                    animationDuration={500}
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
                    animationDuration={500}
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
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">Lead Sources</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Distribution across acquisition channels
          </CardDescription>
            </div>
        </CardHeader>
          <CardContent className="pt-2" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col space-y-6">
              {/* Donut Chart */}
              <div className="relative" style={{ outline: 'none', overflow: 'visible', zIndex: 2 }} ref={leadSourcesChartRef}>
                <ResponsiveContainer width="100%" height={200}>
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
                      fill={`url(#admin-gradient-${index % COLORS.length})`}
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
                        return [`${value} leads (${percentage}%)`, props.payload.source]
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
                        <p className="text-3xl font-bold text-slate-900">{selectedSourceData.count}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {((selectedSourceData.count / stats.totalLeads) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total Leads</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
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
                      className={`legend-item flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                        isSelected 
                          ? 'bg-blue-50 ring-2 ring-blue-400 shadow-sm' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-all duration-300 ${
                          isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                        }`}
                        style={{ 
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate transition-colors duration-300 ${
                          isSelected ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {source.source}
                        </p>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-xs font-bold transition-colors duration-300 ${
                            isSelected ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {source.count}
                          </span>
                          <span className="text-[10px] text-slate-500">({percentage}%)</span>
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
                        +{stats.leadsBySource.length - 6} more source{stats.leadsBySource.length - 6 > 1 ? 's' : ''}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Additional Lead Sources</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                          Other sources not shown in the main chart
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {stats.leadsBySource.slice(6).map((source, index) => {
                          const percentage = ((source.count / stats.totalLeads) * 100).toFixed(1);
                          const colorIndex = (index + 6) % COLORS.length;
                          return (
                            <div 
                              key={source.source}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: COLORS[colorIndex] }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {source.source}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {percentage}% of total
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                <p className="text-sm font-bold text-slate-900">
                                  {source.count}
                                </p>
                                <p className="text-xs text-slate-500">
                                  lead{source.count !== 1 ? 's' : ''}
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-900">Sales Pipeline</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Lead distribution by funnel stage
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={550}>
              <BarChart 
                data={pipelineData} 
                margin={{ top: 25, right: 20, bottom: 100, left: 10 }}
                barGap={8}
              >
                <defs>
                  {pipelineData.map((entry, index) => (
                    <linearGradient key={`pipeline-gradient-${index}`} id={`pipeline-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={100}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '12px 16px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [`${value} leads`, 'Quantity'];
                    return [value, name];
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ color: '#64748b', fontSize: '14px' }}
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
                      className="hover:opacity-90 transition-opacity duration-200"
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.07))'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Summary Statistics */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">Total Leads</p>
                <p className="text-lg font-bold text-slate-900">
                  {pipelineData.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">Active Stages</p>
                <p className="text-lg font-bold text-emerald-600">
                  {pipelineData.filter(item => item.count > 0).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">Avg per Stage</p>
                <p className="text-lg font-bold text-blue-600">
                  {(pipelineData.reduce((sum, item) => sum + item.count, 0) / pipelineData.length).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">Value by Pipeline Stage</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Financial distribution by pipeline status
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={550}>
              <BarChart 
                data={pipelineData} 
                margin={{ top: 25, right: 20, bottom: 100, left: 40 }}
                barGap={8}
              >
                <defs>
                  {pipelineData.map((entry, index) => (
                    <linearGradient key={`admin-value-gradient-${index}`} id={`admin-value-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={100}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                    `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
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
                      className="hover:opacity-90 transition-opacity duration-200"
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
          <CardTitle className="text-lg">Chats by Platform</CardTitle>
          <CardDescription>
            Communication distribution across channels
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
                     <span className="text-sm font-medium text-muted-foreground">Total conversations</span>
                <div className="text-right">
                       <div className="text-2xl font-semibold">{stat.count}</div>
                  </div>
                </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-muted-foreground">Active conversations</span>
                     <div className="text-right">
                       <div className="text-2xl font-semibold text-emerald-600">{stat.active}</div>
                     </div>
                   </div>
                   <div className="pt-4 border-t">
                     <div className="flex justify-between items-center">
                       <span className="text-xs text-muted-foreground">Activity rate</span>
                       <span className="text-xs font-medium">{stat.count > 0 ? ((stat.active / stat.count) * 100).toFixed(0) : 0}%</span>
                     </div>
                     <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
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
                     <div className="pt-4 border-b border-slate-100" />
                   )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="text-base font-semibold">{stats.conversionRate.toFixed(1)}%</span>
    </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Ticket</span>
              <span className="text-base font-semibold">
                $ {averageLeadValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Sales</span>
              <span className="text-base font-semibold text-emerald-600">
                $ {wonValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

         <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
             <CardTitle className="text-base font-semibold">Conversation Activity</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Total Conversations</span>
               <span className="text-base font-semibold">{stats.conversationStats[0]?.count || 0}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Active Conversations</span>
               <span className="text-base font-semibold">
                 {stats.conversationStats[0]?.active || 0}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Activity Rate</span>
               <span className="text-base font-semibold">
                 {stats.conversationStats[0] && stats.conversationStats[0].count > 0
                   ? ((stats.conversationStats[0].active / stats.conversationStats[0].count) * 100).toFixed(1)
                   : '0.0'}%
               </span>
             </div>
           </CardContent>
         </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In Pipeline</span>
              <span className="text-base font-semibold">
                {stats.totalLeads - wonLeads - lostLeads}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="text-base font-semibold text-emerald-600">{winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In Negotiation</span>
              <span className="text-base font-semibold">
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
            <CardTitle className="text-lg">Team Performance</CardTitle>
        <CardDescription>
              Lead distribution and performance by sales representative
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
                            Avg ticket: $ {avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold">{user.count}</div>
                        <div className="text-xs text-muted-foreground">
                          $ {user.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  {stats.leadsByUser.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active Sales Reps</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  {Math.round(stats.totalLeads / stats.leadsByUser.length)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Leads per Rep</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  $ {(stats.totalValue / stats.leadsByUser.length).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Value per Rep</p>
              </div>
            </div>
      </CardContent>
    </Card>
      )}
  </div>
  );
}

// Componente para Dashboard de Master
const MasterDashboard = ({ stats, leads }: { stats: DashboardStats; leads: Lead[] }) => {
  // Filtrar apenas status do pipeline (nomes exatos do banco de dados)
  // Nota: pipelineData já vem filtrado do backend com apenas leads que têm show_on_pipeline = true
  const pipelineStatuses = ['New', 'In Contact', 'Qualified', 'Lost'];
  const pipelineData = stats.leadsByStatus.filter(s => pipelineStatuses.includes(s.status));
  
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
  
  // Calcular dados adicionais
  const wonLeads = stats.leadsByStatus.find(s => s.status === 'Closed Won')?.count || 0;
  const lostLeads = stats.leadsByStatus.find(s => s.status === 'Lost')?.count || 0;
  const wonValue = stats.leadsByStatus.find(s => s.status === 'Closed Won')?.value || 0;
  const winRate = stats.totalLeads > 0 ? ((wonLeads / stats.totalLeads) * 100) : 0;
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
  
  // Obter dados da fonte selecionada
  const selectedSourceData = selectedSource 
    ? stats.leadsBySource.find(s => s.source === selectedSource)
    : null;
  
  // Aplicar animação explode diretamente no DOM após render
  React.useEffect(() => {
    if (!leadSourcesChartRef.current) return;
    
    // Pequeno delay para garantir que o SVG foi renderizado
    const timer = setTimeout(() => {
      const svgElement = leadSourcesChartRef.current?.querySelector('svg');
      if (!svgElement) return;
      
      // Tentar diferentes seletores
      let sectors = svgElement.querySelectorAll('.recharts-pie-sector');
      if (sectors.length === 0) {
        sectors = svgElement.querySelectorAll('.recharts-pie .recharts-layer');
      }
      
      sectors.forEach((sector: Element, index: number) => {
        const pathElement = sector.querySelector('path') as SVGPathElement | null;
        if (!pathElement) return;
        
        const sectorElement = sector as SVGGElement;
        const isActive = index === activeIndex;
        
        if (isActive) {
          const explodeDistance = 15;
          
          // Pegar o centro do gráfico
          const svgRect = svgElement.getBoundingClientRect();
          const pieGroup = svgElement.querySelector('.recharts-pie');
          let chartCenterX = svgRect.width / 2;
          let chartCenterY = svgRect.height / 2;
          
          if (pieGroup) {
            const transform = pieGroup.getAttribute('transform');
            if (transform) {
              const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
              if (match) {
                chartCenterX = parseFloat(match[1]);
                chartCenterY = parseFloat(match[2]);
              }
            }
          }
          
          // Usar método de centróide mais preciso
          // Pegar múltiplos pontos ao longo do path e calcular o centróide real
          const pathLength = pathElement.getTotalLength();
          const numSamples = 20; // Mais amostras = mais preciso
          let sumX = 0;
          let sumY = 0;
          
          for (let i = 0; i <= numSamples; i++) {
            const point = pathElement.getPointAtLength((i / numSamples) * pathLength);
            sumX += point.x;
            sumY += point.y;
          }
          
          const centroidX = sumX / (numSamples + 1);
          const centroidY = sumY / (numSamples + 1);
          
          // Calcular vetor normalizado do centro do gráfico para o centróide
          const dx = centroidX - chartCenterX;
          const dy = centroidY - chartCenterY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (dx / length) * explodeDistance;
          const offsetY = (dy / length) * explodeDistance;
          
          // Cancelar qualquer animação anterior
          const animations = sectorElement.getAnimations();
          animations.forEach(anim => anim.cancel());
          
          // Animar suavemente usando Web Animations API
          const animation = sectorElement.animate(
            [
              { transform: 'translate(0px, 0px)' },
              { transform: `translate(${offsetX}px, ${offsetY}px)` }
            ],
            {
              duration: 400,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              fill: 'forwards'
            }
          );
          
          // Aplicar o transform final após a animação
          animation.onfinish = () => {
            sectorElement.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);
          };
          
          pathElement.style.filter = 'drop-shadow(0 8px 20px rgba(59, 130, 246, 0.6)) brightness(1.15)';
          
          // Fazer o setor ficar por cima (z-index)
          sectorElement.style.zIndex = '10';
          sector.classList.add('pie-sector-exploded');
        } else {
          // Cancelar qualquer animação anterior
          const animations = sectorElement.getAnimations();
          animations.forEach(anim => anim.cancel());
          
          const currentTransform = sectorElement.getAttribute('transform');
          
          // Verificar se tem transform não-zero (considerando possíveis formatos)
          const hasTransform = currentTransform && 
            currentTransform !== 'translate(0, 0)' && 
            currentTransform !== 'translate(0px, 0px)' &&
            !currentTransform.match(/translate\(0,?\s*0\)/);
          
          if (hasTransform) {
            // Converter o transform do SVG para formato CSS (adicionar 'px' se necessário)
            const cssTransform = currentTransform.replace(/translate\(([-\d.]+),\s*([-\d.]+)\)/, 'translate($1px, $2px)');
            
            // Animar de volta suavemente
            const animation = sectorElement.animate(
              [
                { transform: cssTransform },
                { transform: 'translate(0px, 0px)' }
              ],
              {
                duration: 400,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                fill: 'forwards'
              }
            );
            
            // Remover transform final após a animação
            animation.onfinish = () => {
              sectorElement.setAttribute('transform', 'translate(0, 0)');
              pathElement.style.filter = 'none';
              sectorElement.style.zIndex = '';
              sector.classList.remove('pie-sector-exploded');
            };
          } else {
            // Já está na posição original, apenas limpar estilos
            pathElement.style.filter = 'none';
            sectorElement.style.zIndex = '';
            sector.classList.remove('pie-sector-exploded');
          }
        }
      });
    }, 100); // Delay de 100ms para garantir render
    
    return () => clearTimeout(timer);
  }, [activeIndex, stats.leadsBySource]);
  
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
    return processLeadTrend(leads, timePeriod, customStartDate, customEndDate);
  }, [leads, timePeriod, customStartDate, customEndDate]);


  return (
  <div className="space-y-6">
      {/* Main Statistics Cards - Master */}
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across the company
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="text-emerald-600 font-medium">{wonLeads} won</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-rose-600 font-medium">{lostLeads} lost</span>
            </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">
              $ {stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average value: $ {averageLeadValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-3 text-xs">
              <span className="text-emerald-600 font-medium">
                $ {wonValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} in sales
              </span>
            </div>
        </CardContent>
      </Card>

         <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Active Conversations</CardTitle>
             <MessageSquare className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
             <div className="text-3xl font-semibold">{stats.totalConversations}</div>
             <p className="text-xs text-muted-foreground mt-2">
               Total conversations
             </p>
             <div className="mt-3 flex items-center gap-2">
               <div className="flex-1">
                 <p className="text-xs text-muted-foreground">Active (7 days)</p>
                 <p className="text-lg font-semibold text-emerald-600">{stats.conversationStats[0]?.active || 0}</p>
               </div>
             </div>
        </CardContent>
      </Card>

        <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {wonLeads} won of {wonLeads + lostLeads} closed
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
            <CardTitle className="text-lg">Leads & Revenue Evolution</CardTitle>
          <CardDescription>
              Select time period to analyze trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Period Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="time-period" className="text-sm font-medium mb-2 block">
                  Time Period
                </Label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger id="time-period" className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="custom">Custom dates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {timePeriod === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                      Start Date
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
                      End Date
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
                  Showing data from {(() => {
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
                      Period limited to 1 year (365 days) for performance. Showing data from the last year of your selection.
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
                Leads
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
                Revenue
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300} style={{ userSelect: 'none' }}>
              <LineChart 
                data={filteredMonthlyTrend}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                                <p className="text-blue-600 font-semibold">Leads: {current.leads}</p>
                                <p className={`text-xs font-medium ${leadsDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {leadsDiff >= 0 ? '+' : ''}{leadsDiff} ({leadsPercent >= '0' ? '+' : ''}{leadsPercent}%)
                                </p>
                              </div>
                            )}
                            {visibleMetrics.value && (
                              <div>
                                <p className="text-emerald-600 font-semibold">Revenue: $ {current.value.toLocaleString('en-US')}</p>
                                <p className={`text-xs font-medium ${valueDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {valueDiff >= 0 ? '+' : ''}$ {valueDiff.toLocaleString('en-US')} ({valuePercent >= '0' ? '+' : ''}{valuePercent}%)
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">vs {selectedDisplayDate}</p>
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
                          <p className="font-semibold mb-2">Range Summary</p>
                          <p className="text-slate-600 text-[10px] mb-2 font-medium">
                            {startDisplayDate} - {endDisplayDate}
                          </p>
                          <div className="space-y-1">
                            {visibleMetrics.leads && (
                              <>
                                <p className="text-blue-600 font-semibold">Total Leads: {totalLeads}</p>
                                <p className="text-blue-600 text-[10px] font-medium">Avg: {avgLeads.toFixed(1)}</p>
                              </>
                            )}
                            {visibleMetrics.value && (
                              <>
                                <p className="text-emerald-600 font-semibold">Total Revenue: $ {totalValue.toLocaleString('en-US')}</p>
                                <p className="text-emerald-600 text-[10px] font-medium">Avg: $ {avgValue.toLocaleString('en-US')}</p>
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
                          <p className="text-blue-600 font-semibold">Leads: {current.leads}</p>
                        )}
                        {visibleMetrics.value && (
                          <p className="text-emerald-600 font-semibold">Revenue: $ {current.value.toLocaleString('en-US')}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">Click to select</p>
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
                    animationDuration={500}
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
                    animationDuration={500}
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
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">Lead Sources</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Distribution across acquisition channels
          </CardDescription>
            </div>
        </CardHeader>
          <CardContent className="pt-2" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col space-y-6">
              {/* Donut Chart */}
              <div className="relative" style={{ outline: 'none', overflow: 'visible', zIndex: 2 }} ref={leadSourcesChartRef}>
                <ResponsiveContainer width="100%" height={200}>
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
                        return [`${value} leads (${percentage}%)`, props.payload.source]
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
                        <p className="text-3xl font-bold text-slate-900">{selectedSourceData.count}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {((selectedSourceData.count / stats.totalLeads) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-3xl font-bold text-slate-900">{stats.totalLeads}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total Leads</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
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
                      className={`legend-item flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                        isSelected 
                          ? 'bg-blue-50 ring-2 ring-blue-400 shadow-sm' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-all duration-300 ${
                          isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                        }`}
                        style={{ 
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate transition-colors duration-300 ${
                          isSelected ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {source.source}
                        </p>
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-xs font-bold transition-colors duration-300 ${
                            isSelected ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {source.count}
                          </span>
                          <span className="text-[10px] text-slate-500">({percentage}%)</span>
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
                        +{stats.leadsBySource.length - 6} more source{stats.leadsBySource.length - 6 > 1 ? 's' : ''}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Additional Lead Sources</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                          Other sources not shown in the main chart
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {stats.leadsBySource.slice(6).map((source, index) => {
                          const percentage = ((source.count / stats.totalLeads) * 100).toFixed(1);
                          const colorIndex = (index + 6) % COLORS.length;
                          return (
                            <div 
                              key={source.source}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: COLORS[colorIndex] }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {source.source}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {percentage}% of total
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                <p className="text-sm font-bold text-slate-900">
                                  {source.count}
                                </p>
                                <p className="text-xs text-slate-500">
                                  lead{source.count !== 1 ? 's' : ''}
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
    <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
            <CardTitle className="text-lg">Sales Pipeline</CardTitle>
          <CardDescription>
              Lead distribution by funnel stage
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={550}>
              <BarChart data={pipelineData} margin={{ top: 25, right: 20, bottom: 100, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [value, 'Quantity'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={90}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">Value by Pipeline Stage</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Financial distribution by pipeline status
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={550}>
              <BarChart 
                data={pipelineData} 
                margin={{ top: 25, right: 20, bottom: 100, left: 40 }}
                barGap={8}
              >
                <defs>
                  {pipelineData.map((entry, index) => (
                    <linearGradient key={`value-gradient-${index}`} id={`value-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={100}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                    `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
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
                      className="hover:opacity-90 transition-opacity duration-200"
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
          <CardTitle className="text-lg">Chats by Platform</CardTitle>
          <CardDescription>
            Communication distribution across channels
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
                     <span className="text-sm font-medium text-muted-foreground">Total conversations</span>
                <div className="text-right">
                       <div className="text-2xl font-semibold">{stat.count}</div>
                  </div>
                </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-muted-foreground">Active conversations</span>
                     <div className="text-right">
                       <div className="text-2xl font-semibold text-emerald-600">{stat.active}</div>
                     </div>
                   </div>
                   <div className="pt-4 border-t">
                     <div className="flex justify-between items-center">
                       <span className="text-xs text-muted-foreground">Activity rate</span>
                       <span className="text-xs font-medium">{stat.count > 0 ? ((stat.active / stat.count) * 100).toFixed(0) : 0}%</span>
                     </div>
                     <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
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
                     <div className="pt-4 border-b border-slate-100" />
                   )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="text-base font-semibold">{stats.conversionRate.toFixed(1)}%</span>
    </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Ticket</span>
              <span className="text-base font-semibold">
                $ {averageLeadValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Sales</span>
              <span className="text-base font-semibold text-emerald-600">
                $ {wonValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

         <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
             <CardTitle className="text-base font-semibold">Conversation Activity</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Total Conversations</span>
               <span className="text-base font-semibold">{stats.conversationStats[0]?.count || 0}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Active Conversations</span>
               <span className="text-base font-semibold">
                 {stats.conversationStats[0]?.active || 0}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Activity Rate</span>
               <span className="text-base font-semibold">
                 {stats.conversationStats[0] && stats.conversationStats[0].count > 0
                   ? ((stats.conversationStats[0].active / stats.conversationStats[0].count) * 100).toFixed(1)
                   : '0.0'}%
               </span>
             </div>
           </CardContent>
         </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In Pipeline</span>
              <span className="text-base font-semibold">
                {stats.totalLeads - wonLeads - lostLeads}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="text-base font-semibold text-emerald-600">{winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In Negotiation</span>
              <span className="text-base font-semibold">
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
            <CardTitle className="text-lg">Team Performance</CardTitle>
        <CardDescription>
              Lead distribution and performance by sales representative
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
                            Avg ticket: $ {avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold">{user.count}</div>
                        <div className="text-xs text-muted-foreground">
                          $ {user.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  {stats.leadsByUser.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active Sales Reps</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  {Math.round(stats.totalLeads / stats.leadsByUser.length)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Leads per Rep</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  $ {(stats.totalValue / stats.leadsByUser.length).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Value per Rep</p>
              </div>
            </div>
      </CardContent>
    </Card>
      )}
  </div>
  );
}

// Componente para Dashboard de Employee
const EmployeeDashboard = ({ stats }: { stats: DashboardStats }) => {
  // Filtrar apenas status do pipeline (nomes exatos do banco de dados)
  const pipelineStatuses = ['New', 'In Contact', 'Qualified', 'Lost'];
  const pipelineData = stats.leadsByStatus.filter(s => pipelineStatuses.includes(s.status));
  
  // Estado para controlar qual métrica está visível no Evolution Chart
  const [visibleMetrics, setVisibleMetrics] = React.useState<{ leads: boolean; value: boolean }>({
    leads: true,
    value: true,
  });
  
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
  
  return (
  <div className="space-y-6">
    {/* Cards de Estatísticas para Employee */}
    <div className="grid auto-rows-min gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meus Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.floor(stats.totalLeads * 0.3)}</div>
          <p className="text-xs text-muted-foreground">
            Leads atribuídos a você
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.floor(stats.totalConversations * 0.2)}</div>
          <p className="text-xs text-muted-foreground">
            Suas conversas ativas
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Gráfico Simples para Employee */}
    <Card>
      <CardHeader>
        <CardTitle>Meus Leads por Status</CardTitle>
        <CardDescription>
          Status dos seus leads no pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
)
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { isClient } = useApi()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [allLeads, setAllLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isClient) return

    // Buscar dados do usuário para verificar role
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
          setUserRole(role)
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
        
        // Buscar todos os leads
        const leadsResponse = await apiService.getAllLeads()
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
          if (lead.status === 'Lost') return sum
          return sum + (Number(lead.value) || 0)
        }, 0)
        
        // Agrupar leads por status (apenas leads que aparecem no pipeline)
        const leadsByStatusMap = new Map<string, { count: number; value: number }>()
        leads.forEach(lead => {
          // Apenas contar leads que estão configurados para aparecer no pipeline
          if (!lead.show_on_pipeline) return
          
          const status = lead.status || 'Novo'
          const current = leadsByStatusMap.get(status) || { count: 0, value: 0 }
          leadsByStatusMap.set(status, {
            count: current.count + 1,
            value: current.value + (Number(lead.value) || 0)
          })
        })
        
        // Ordenar status para seguir o fluxo do funil
        const statusOrder = ['New', 'In Contact', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Lost']
        const leadsByStatus = Array.from(leadsByStatusMap.entries())
          .map(([status, data]) => ({
          status,
          count: data.count,
          value: data.value
        }))
          .sort((a, b) => {
            const indexA = statusOrder.indexOf(a.status)
            const indexB = statusOrder.indexOf(b.status)
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
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
            if (lead.status === 'Lost') return sum
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
        
        // Calcular taxa de conversão real (leads fechados ganhos / total de leads)
        const closedWonLeads = leads.filter(lead => lead.status === 'Closed Won').length
        const conversionRate = totalLeads > 0 ? ((closedWonLeads / totalLeads) * 100) : 0

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
                const userName = user?.name || 'Unassigned'
                
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
        setError('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isClient, userRole])

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
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                      <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
              </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando dashboard...</p>
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
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-center text-red-600">Erro</CardTitle>
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
      return <AdminDashboard stats={stats} leads={allLeads} />
    } else if (normalizedRole === 'master') {
      return <MasterDashboard stats={stats} leads={allLeads} />
    } else {
      return <EmployeeDashboard stats={stats} />
    }
  }

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
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      Dashboard {userRole === 'admin' && '(Admin)'}
                      {userRole === 'master' && '(Master)'}
                      {userRole === 'employee' && '(Employee)'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="max-w-[1600px] mx-auto w-full">
            {renderDashboard()}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}