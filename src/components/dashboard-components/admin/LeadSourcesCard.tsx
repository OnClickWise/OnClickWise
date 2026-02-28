'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import ChartTooltip from '../shared/ChartTooltip'

export default function LeadSourcesCard({ stats }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow h-96">
      <h3 className="text-lg font-semibold mb-4">Lead Sources</h3>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={stats.leadsBySource}
            dataKey="count"
            nameKey="source"
            outerRadius={120}
          >
            {stats.leadsBySource?.map((entry: any, index: number) => (
              <Cell key={index} fill={entry.color || '#3b82f6'} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}