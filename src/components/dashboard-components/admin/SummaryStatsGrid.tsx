'use client'

interface Props {
  stats: any
}

export default function SummaryStatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <OverallPerformanceCard stats={stats} />
      <ConversationActivityCard stats={stats} />
      <FunnelAnalysisCard stats={stats} />
    </div>
  )
}

function OverallPerformanceCard({ stats }: any) {
  return (
    <div className="bg-card text-card-foreground rounded-xl shadow border border-border p-6">
      <h4 className="text-lg font-semibold mb-4">
        Overall Performance
      </h4>

      <div className="space-y-3 text-sm">
        <StatRow label="Total Leads" value={stats.totalLeads} />
        <StatRow label="Total Revenue" value={`$${stats.totalRevenue}`} />
        <StatRow label="Conversion Rate" value={`${stats.conversionRate}%`} />
      </div>
    </div>
  )
}

function ConversationActivityCard({ stats }: any) {
  return (
    <div className="bg-card text-card-foreground rounded-xl shadow border border-border p-6">
      <h4 className="text-lg font-semibold mb-4">
        Conversation Activity
      </h4>

      <div className="space-y-3 text-sm">
        <StatRow label="Total Conversations" value={stats.totalConversations} />
        <StatRow label="Active Conversations" value={stats.activeConversations} />
        <StatRow label="Response Rate" value={`${stats.responseRate}%`} />
      </div>
    </div>
  )
}

function FunnelAnalysisCard({ stats }: any) {
  return (
    <div className="bg-card text-card-foreground rounded-xl shadow border border-border p-6">
      <h4 className="text-lg font-semibold mb-4">
        Funnel Analysis
      </h4>

      <div className="space-y-3 text-sm">
        <StatRow label="Open Leads" value={stats.openLeads} />
        <StatRow label="Won Leads" value={stats.wonLeads} />
        <StatRow label="Lost Leads" value={stats.lostLeads} />
      </div>
    </div>
  )
}

function StatRow({ label, value }: any) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '-'}</span>
    </div>
  )
}