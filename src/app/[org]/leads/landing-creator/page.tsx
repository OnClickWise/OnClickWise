"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { LandingPageBuilder } from "@/components/LandingPageBuilder"

export default function LandingCreatorPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const t = useTranslations()
  const { org } = React.use(params)

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{t('Sidebar.landingPageCreator')}</h1>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <LandingPageBuilder org={org} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}

