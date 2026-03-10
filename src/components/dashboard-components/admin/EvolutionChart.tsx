'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import ChartTooltip from '../shared/ChartTooltip'

export default function EvolutionChart({ stats }: any) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow border border-border h-96">
      <h3 className="text-lg font-semibold mb-4">Leads Evolution</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={stats.evolutionData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="leads" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}