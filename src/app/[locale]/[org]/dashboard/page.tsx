'use client'

import { useMemo, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayoutWrapper from '@/components/dashboard-components/shared/DashboardLayoutWrapper'
import AdminDashboard from '@/components/dashboard-components/admin/AdminDashboard'
import MasterDashboard from '@/components/dashboard-components/master/MasterDashboard'
import EmployeeDashboard from '@/components/dashboard-components/employee/EmployeeDashboard'
import { useDashboardData } from '@/hooks/useDashboardData'
import { UserRole } from '@/types/dashboard'
import { getApiOrigin } from '@/lib/api-url'

export default function DashboardPage() {
  const params = useParams()

  const org =
    typeof params?.org === 'string' ? params.org : ''

  const { role, data, loading, error } =
    useDashboardData(org)

  const apiOrigin = getApiOrigin()

  if (!org) {
    return <div>Invalid tenant</div>
  }

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
      {loading && (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Carregando dashboard...
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
          {error === 'connection' && (
            <>
              <p className="text-lg font-medium">Não foi possível conectar ao servidor</p>
              <p className="text-sm">Verifique se a API está acessível em <code className="bg-muted px-1 rounded">{apiOrigin}</code></p>
            </>
          )}
          {error === 'auth' && (
            <>
              <p className="text-lg font-medium">Sua sessão expirou ou está inválida</p>
              <p className="text-sm">Faça login novamente para recarregar o dashboard.</p>
            </>
          )}
          {error === 'unknown' && (
            <>
              <p className="text-lg font-medium">Erro ao carregar o dashboard</p>
              <p className="text-sm">Tente atualizar a página em alguns segundos.</p>
            </>
          )}
        </div>
      )}
      {!loading && !error && DashboardComponent}
    </DashboardLayoutWrapper>
  )
}