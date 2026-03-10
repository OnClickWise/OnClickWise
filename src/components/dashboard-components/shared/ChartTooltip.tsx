'use client'

import { TooltipProps } from 'recharts'
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'

type TooltipPayloadItem = {
  name?: string | number
  value?: string | number
  color?: string
}

export default function ChartTooltip(
  props: TooltipProps<ValueType, NameType>
) {
  const { active } = props

  // Narrowing seguro para evitar erro de build
  const payload = (props as {
    payload?: TooltipPayloadItem[]
  }).payload

  const label = (props as {
    label?: string | number
  }).label

  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-card text-card-foreground border border-border p-3 rounded-lg shadow text-sm">
      {label !== undefined && (
        <p className="font-semibold mb-1">{label}</p>
      )}

      {payload.map((entry, index) => (
        <p key={index}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}