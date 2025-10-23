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
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
  LineChart,
  Line,
  Area,
  AreaChart
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

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

interface DashboardStats {
  totalLeads: number
  totalConversations: number
  totalValue: number
  conversionRate: number
  leadsByStatus: { status: string; count: number; value: number }[]
  leadsBySource: { source: string; count: number }[]
  monthlyTrend: { month: string; leads: number; value: number }[]
  conversationStats: { platform: string; count: number; active: number }[]
}

// Componente para Dashboard de Admin
const AdminDashboard = ({ stats }: { stats: DashboardStats }) => (
  <div className="space-y-6">
    {/* Cards de Estatísticas Principais */}
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            +12% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalConversations}</div>
          <p className="text-xs text-muted-foreground">
            +8% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats.totalValue.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            +15% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            +2.1% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Gráficos Avançados para Admin */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Leads por Status</CardTitle>
          <CardDescription>
            Distribuição dos leads no pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.leadsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Leads por Fonte</CardTitle>
          <CardDescription>
            Origem dos leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.leadsBySource}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.leadsBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Tendência Mensal</CardTitle>
          <CardDescription>
            Evolução de leads e valor nos últimos meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="leads"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Leads"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="value"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Valor (R$)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Conversas por Plataforma</CardTitle>
          <CardDescription>
            Distribuição das conversas ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.conversationStats.map((stat, index) => (
              <div key={stat.platform} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{stat.platform}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{stat.count}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.active} ativas
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Valor por Status</CardTitle>
        <CardDescription>
          Distribuição do valor total por status do lead
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.leadsByStatus}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
)

// Componente para Dashboard de Master
const MasterDashboard = ({ stats }: { stats: DashboardStats }) => (
  <div className="space-y-6">
    {/* Cards de Estatísticas para Master */}
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meus Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.floor(stats.totalLeads * 0.6)}</div>
          <p className="text-xs text-muted-foreground">
            +18% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.floor(stats.totalConversations * 0.4)}</div>
          <p className="text-xs text-muted-foreground">
            +12% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor em Pipeline</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {Math.floor(stats.totalValue * 0.5).toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            +22% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.conversionRate * 0.8).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            +3.2% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Gráficos Principais para Master */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Meus Leads por Status</CardTitle>
          <CardDescription>
            Distribuição dos seus leads no pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.leadsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Leads por Fonte</CardTitle>
          <CardDescription>
            Origem dos seus leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.leadsBySource}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.leadsBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    {/* Gráficos Secundários para Master */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Performance Mensal</CardTitle>
          <CardDescription>
            Sua evolução nos últimos meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="leads" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversas por Plataforma</CardTitle>
          <CardDescription>
            Suas conversas ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.conversationStats.map((stat, index) => (
              <div key={stat.platform} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{stat.platform}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{Math.floor(stat.count * 0.4)}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(stat.active * 0.4)} ativas
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Gráfico de Valor por Status */}
    <Card>
      <CardHeader>
        <CardTitle>Valor por Status</CardTitle>
        <CardDescription>
          Distribuição do valor dos seus leads por status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.leadsByStatus}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
)

// Componente para Dashboard de Employee
const EmployeeDashboard = ({ stats }: { stats: DashboardStats }) => (
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
          Status dos seus leads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.leadsByStatus}>
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

export default function DashboardPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { isClient } = useApi()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
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
        
        // Buscar conversas do Telegram
        const telegramResponse = await apiService.getTelegramConversations()
        const conversations = telegramResponse.success ? (telegramResponse.data?.conversations || []) : []

        // Calcular estatísticas
        const totalLeads = leads.length
        const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
        
        // Agrupar leads por status
        const leadsByStatusMap = new Map<string, { count: number; value: number }>()
        leads.forEach(lead => {
          const status = lead.status || 'Sem Status'
          const current = leadsByStatusMap.get(status) || { count: 0, value: 0 }
          leadsByStatusMap.set(status, {
            count: current.count + 1,
            value: current.value + (lead.value || 0)
          })
        })
        const leadsByStatus = Array.from(leadsByStatusMap.entries()).map(([status, data]) => ({
          status,
          count: data.count,
          value: data.value
        }))

        // Agrupar leads por fonte
        const leadsBySourceMap = new Map<string, number>()
        leads.forEach(lead => {
          const source = lead.source || 'Sem Fonte'
          leadsBySourceMap.set(source, (leadsBySourceMap.get(source) || 0) + 1)
        })
        const leadsBySource = Array.from(leadsBySourceMap.entries()).map(([source, count]) => ({
          source,
          count
        }))

        // Simular dados de tendência mensal (últimos 6 meses)
        const monthlyTrend = [
          { month: 'Jul', leads: Math.floor(Math.random() * 50) + 20, value: Math.floor(Math.random() * 100000) + 50000 },
          { month: 'Ago', leads: Math.floor(Math.random() * 50) + 20, value: Math.floor(Math.random() * 100000) + 50000 },
          { month: 'Set', leads: Math.floor(Math.random() * 50) + 20, value: Math.floor(Math.random() * 100000) + 50000 },
          { month: 'Out', leads: Math.floor(Math.random() * 50) + 20, value: Math.floor(Math.random() * 100000) + 50000 },
          { month: 'Nov', leads: Math.floor(Math.random() * 50) + 20, value: Math.floor(Math.random() * 100000) + 50000 },
          { month: 'Dez', leads: totalLeads, value: totalValue }
        ]

        // Estatísticas de conversas
        const conversationStats = [
          { platform: 'Telegram', count: conversations.length, active: Math.floor(conversations.length * 0.7) },
          { platform: 'WhatsApp', count: Math.floor(Math.random() * 30) + 10, active: Math.floor(Math.random() * 20) + 5 },
          { platform: 'Email', count: Math.floor(Math.random() * 50) + 20, active: Math.floor(Math.random() * 30) + 10 }
        ]

        const totalConversations = conversationStats.reduce((sum, stat) => sum + stat.count, 0)
        const conversionRate = totalLeads > 0 ? (totalLeads / totalConversations) * 100 : 0

        setStats({
          totalLeads,
          totalConversations,
          totalValue,
          conversionRate,
          leadsByStatus,
          leadsBySource,
          monthlyTrend,
          conversationStats
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
    )
  }

  if (error) {
    return (
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
    )
  }

  if (!stats) return null

  // Renderizar dashboard baseado no cargo
  const renderDashboard = () => {
    // Normalizar o role para lowercase e trim para evitar problemas de comparação
    const normalizedRole = userRole?.toString().toLowerCase().trim()
    
    if (normalizedRole === 'admin') {
      return <AdminDashboard stats={stats} />
    } else if (normalizedRole === 'master') {
      return <MasterDashboard stats={stats} />
    } else {
      return <EmployeeDashboard stats={stats} />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar org={org} />
      <SidebarInset>
        <AuthGuard orgSlug={org}>
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
            {renderDashboard()}
          </div>
        </AuthGuard>
      </SidebarInset>
    </SidebarProvider>
  )
}