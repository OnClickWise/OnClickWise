'use client'

import { DashboardStats } from '@/types/dashboard'
import MainStatsCards from './MainStatsCards'
import EvolutionChart from './EvolutionChart'
import LeadSourcesCard from './LeadSourcesCard'
import PipelineCharts from './PipelineCharts'
import ConversationsCard from './ConversationsCard'
import SummaryStatsGrid from './SummaryStatsGrid'
import TeamPerformanceCard from './TeamPerformanceCard'

interface Props {
  stats: DashboardStats
}

export default function AdminDashboard({ stats }: Props) {
  return (
    <div className="space-y-8">
      <MainStatsCards stats={stats} />
      <EvolutionChart stats={stats} />
      <LeadSourcesCard stats={stats} />
      <PipelineCharts stats={stats} />
      <ConversationsCard stats={stats} />
      <SummaryStatsGrid stats={stats} />
      <TeamPerformanceCard stats={stats} />
    </div>
  )
}