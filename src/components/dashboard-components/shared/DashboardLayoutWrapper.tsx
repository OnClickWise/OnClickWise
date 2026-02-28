'use client'

import { ReactNode } from 'react'

interface Props {
  org: string
  children: ReactNode
}

export default function DashboardLayoutWrapper({
  org,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold capitalize">
            {org} Dashboard
          </h1>
        </div>

        {children}
      </div>
    </div>
  )
}