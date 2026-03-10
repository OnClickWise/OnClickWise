'use client'

import { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface Props {
  org: string
  children: ReactNode
}

export default function DashboardLayoutWrapper({ org, children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar org={org} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6 bg-muted/40">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}