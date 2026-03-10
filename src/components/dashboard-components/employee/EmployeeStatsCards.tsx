'use client'

import { DashboardStats } from '@/types/dashboard'

interface Props {
  stats: DashboardStats
}

export default function EmployeeStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="My Leads" value={stats.myLeads ?? 0} />
      <StatCard
        title="Revenue"
        value={`$${stats.myRevenue ?? 0}`}
      />
      <StatCard
        title="Conversion"
        value={`${stats.myConversionRate ?? 0}%`}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}