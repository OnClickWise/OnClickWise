'use client'

import {
  DashboardStats,
  Lead,
  PipelineStage,
} from '@/types/dashboard'

import EmployeeStatsCards from './EmployeeStatsCards'
import EmployeePipelineChart from './EmployeePipelineChart'
import EmployeeNotesCard from './EmployeeNotesCard'

interface Props {
  stats: DashboardStats
  leads: Lead[]
  pipelineStages: PipelineStage[]
  org: string
}

export default function EmployeeDashboard({
  stats,
  org,
}: Props) {
  return (
    <div className="space-y-8">
      <EmployeeStatsCards stats={stats} />
      <EmployeePipelineChart stats={stats} />
      <EmployeeNotesCard org={org} />
    </div>
  )
}