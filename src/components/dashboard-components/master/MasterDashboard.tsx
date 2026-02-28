'use client'

import { memo } from 'react'
import { DashboardStats } from '@/types/dashboard'

import MainStatsCards from '../admin/MainStatsCards'
import EvolutionChart from '../admin/EvolutionChart'
import LeadSourcesCard from '../admin/LeadSourcesCard'
import PipelineCharts from '../admin/PipelineCharts'
import ConversationsCard from '../admin/ConversationsCard'
import SummaryStatsGrid from '../admin/SummaryStatsGrid'
import TeamPerformanceCard from '../admin/TeamPerformanceCard'

interface Props {
  stats: DashboardStats
}

function MasterDashboard({ stats }: Props) {
  const hasConversations =
    (stats.conversationStats?.length ?? 0) > 0

  const hasTeamPerformance =
    (stats.leadsByUser?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <MainStatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EvolutionChart stats={stats} />
        <LeadSourcesCard stats={stats} />
      </div>

      <PipelineCharts stats={stats} />

      {hasConversations && (
        <ConversationsCard stats={stats} />
      )}

      <SummaryStatsGrid stats={stats} />

      {hasTeamPerformance && (
        <TeamPerformanceCard stats={stats} />
      )}
    </div>
  )
}

export default memo(MasterDashboard)