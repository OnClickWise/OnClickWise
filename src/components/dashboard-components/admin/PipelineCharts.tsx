'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import ChartTooltip from '../shared/ChartTooltip'

export default function PipelineCharts({ stats }: any) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow border border-border h-96">
      <h3 className="text-lg font-semibold mb-4">Pipeline</h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.pipelineData}>
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}