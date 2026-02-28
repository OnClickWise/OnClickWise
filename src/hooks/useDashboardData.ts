'use client'

import { useEffect, useState } from 'react'
import {
  DashboardResponse,
  UserRole,
} from '@/types/dashboard'

interface UseDashboardReturn {
  role: UserRole
  data: Omit<DashboardResponse, 'role'>
  loading: boolean
  error: boolean
}

export function useDashboardData(org: string): UseDashboardReturn {
  const [role, setRole] = useState<UserRole>('employee')
  const [data, setData] = useState<Omit<DashboardResponse, 'role'>>({
    stats: {
      totalLeads: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgTicket: 0,
    },
    leads: [],
    pipelineStages: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!org) return

    const controller = new AbortController()

    async function fetchDashboard() {
      try {
        setLoading(true)
        setError(false)

        const token = localStorage.getItem('token')

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/${org}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        )

        if (!res.ok) throw new Error()

        const result: DashboardResponse = await res.json()

        setRole(result.role)
        setData({
          stats: result.stats,
          leads: result.leads,
          pipelineStages: result.pipelineStages,
        })
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.error(err)
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()

    return () => controller.abort()
  }, [org])

  return { role, data, loading, error }
}