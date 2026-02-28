'use client'

import { useMemo, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayoutWrapper from '@/components/dashboard-components/shared/DashboardLayoutWrapper'
import AdminDashboard from '@/components/dashboard-components/admin/AdminDashboard'
import MasterDashboard from '@/components/dashboard-components/master/MasterDashboard'
import EmployeeDashboard from '@/components/dashboard-components/employee/EmployeeDashboard'
import { useDashboardData } from '@/hooks/useDashboardData'
import { UserRole } from '@/types/dashboard'

export default function DashboardPage() {
  const params = useParams()

  const org =
    typeof params?.org === 'string' ? params.org : ''

  if (!org) {
    return <div>Invalid tenant</div>
  }

  const { role, data, loading, error } =
    useDashboardData(org)

  const DashboardComponent = useMemo(() => {
    const map: Record<UserRole, ReactNode> = {
      admin: <AdminDashboard stats={data.stats} />,
      master: <MasterDashboard stats={data.stats} />,
      employee: (
        <EmployeeDashboard
          stats={data.stats}
          leads={data.leads}
          pipelineStages={data.pipelineStages}
          org={org}
        />
      ),
    }

    return map[role]
  }, [role, data, org])

  return (
    <DashboardLayoutWrapper org={org}>
      {loading && <div>Loading...</div>}
      {error && <div>Error loading dashboard</div>}
      {!loading && !error && DashboardComponent}
    </DashboardLayoutWrapper>
  )
}