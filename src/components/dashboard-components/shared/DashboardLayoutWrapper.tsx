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
  title?: string
}

export default function DashboardLayoutWrapper({ org, children, title = 'Dashboard' }: Props) {
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
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 bg-muted/40 flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}