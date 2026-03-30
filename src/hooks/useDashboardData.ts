'use client'

import { useEffect, useState } from 'react'
import {
  DashboardResponse,
  UserRole,
} from '@/types/dashboard'
import { getCurrentUser } from '@/services/authService'
import { getAccessTokenFromCookie } from '@/lib/cookies'
import { getApiBaseUrl } from '@/lib/api-url'

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

        const BASE = getApiBaseUrl()
        const token = getAccessTokenFromCookie() || localStorage.getItem('token')
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
        const signal = controller.signal

        // Get user info (role + organization_id)
        const user = await getCurrentUser()
        const userRole = (user?.role || 'employee') as UserRole
        const orgId = user?.organization_id

        setRole(userRole)

        // Fetch leads and pipeline stages in parallel
        const [leadsRes, stagesRes] = await Promise.all([
          fetch(`${BASE}/leads`, { headers, signal }),
          orgId
            ? fetch(`${BASE}/pipeline-stages/${orgId}`, { headers, signal })
            : Promise.resolve(null),
        ])

        // Parse leads
        let leads: DashboardResponse['leads'] = []
        if (leadsRes.ok) {
          const leadsJson = await leadsRes.json()
          leads = Array.isArray(leadsJson)
            ? leadsJson
            : (leadsJson.data ?? leadsJson.leads ?? [])
        }

        // Parse pipeline stages
        let pipelineStages: DashboardResponse['pipelineStages'] = []
        if (stagesRes && stagesRes.ok) {
          const stagesJson = await stagesRes.json()
          pipelineStages = Array.isArray(stagesJson)
            ? stagesJson
            : (stagesJson.data ?? [])
        }

        // Calculate stats from leads
        const totalLeads = leads.length
        const totalRevenue = leads.reduce(
          (sum, l) => sum + (parseFloat(String(l.value)) || 0),
          0
        )
        const wonLeads = leads.filter(
          (l) => l.status === 'won' || l.status === 'converted'
        ).length
        const conversionRate =
          totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
        const avgTicket =
          totalLeads > 0 ? Math.round(totalRevenue / totalLeads) : 0

        setData({
          stats: {
            totalLeads,
            totalRevenue,
            conversionRate,
            avgTicket,
            openLeads: leads.filter((l) => l.status === 'open').length,
            wonLeads,
            lostLeads: leads.filter((l) => l.status === 'lost').length,
          },
          leads,
          pipelineStages,
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