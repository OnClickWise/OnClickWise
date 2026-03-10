'use client'

import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import ChartTooltip from '../shared/ChartTooltip'
import { DashboardStats } from '@/types/dashboard'

interface Props {
  stats: DashboardStats
}

function EmployeePipelineChartComponent({ stats }: Props) {
  const data = useMemo(
    () => stats.myPipelineData ?? [],
    [stats.myPipelineData]
  )

  return (
    <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow h-96">
      <h3 className="text-lg font-semibold mb-4">
        My Pipeline
      </h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color ?? '#6366f1'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default memo(EmployeePipelineChartComponent)