export type UserRole = 'admin' | 'master' | 'employee'

export interface Lead {
  id: string
  value: number
  status: string
  source?: string
  created_at: string
  user_id?: string
}

export interface PipelineStage {
  id: string
  name: string
  slug: string
  stage_type: 'open' | 'won' | 'lost'
  color?: string
}

export interface EvolutionPoint {
  month: string
  leads: number
  value: number
}

export interface PipelineChartItem {
  stage: string
  count: number
  value?: number
  color?: string
}

export interface ConversationStat {
  user: string
  total: number
  active: number
}

export interface TeamPerformance {
  user: string
  count: number
  value: number
  percentage: number
}

export interface DashboardStats {
  totalLeads: number
  totalRevenue: number
  conversionRate: number
  avgTicket: number

  myLeads?: number
  myRevenue?: number
  myConversionRate?: number

  evolutionData?: EvolutionPoint[]
  pipelineData?: PipelineChartItem[]
  myPipelineData?: PipelineChartItem[]

  leadsBySource?: { source: string; count: number; color?: string }[]
  leadsByUser?: TeamPerformance[]
  conversationStats?: ConversationStat[]

  totalConversations?: number
  activeConversations?: number
  responseRate?: number

  openLeads?: number
  wonLeads?: number
  lostLeads?: number
}

export interface DashboardResponse {
  role: UserRole
  stats: DashboardStats
  leads: Lead[]
  pipelineStages: PipelineStage[]
}