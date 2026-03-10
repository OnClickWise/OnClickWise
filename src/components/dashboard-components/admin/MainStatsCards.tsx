'use client'

interface Props {
  stats: any
}

export default function MainStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card title="Total Leads" value={stats.totalLeads} />
      <Card title="Revenue" value={`$${stats.totalRevenue}`} />
      <Card title="Conversion" value={`${stats.conversionRate}%`} />
      <Card title="Avg Ticket" value={`$${stats.avgTicket}`} />
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-card text-card-foreground rounded-xl p-6 shadow border border-border">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}