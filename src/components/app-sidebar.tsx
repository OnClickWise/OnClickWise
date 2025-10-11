"use client"

import * as React from "react"
import {
  Users,
  Mail,
  KanbanSquare,
  MessageSquare,
  Settings2,
  Building2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  org: string
}

export function AppSidebar({ org, ...props }: AppSidebarProps) {
  const { user, organization, isLoading } = useAuth()

  const data = {
    user: {
      name: user?.name || "Loading...",
      email: user?.email || "loading@example.com",
      avatar: "/avatars/default.jpg",
    },
    organization: {
      name: organization?.name || "Loading...",
      logo: Building2,
      plan: "Enterprise",
    },
    navMain: [
      {
        title: "Leads",
        url: `/${org}/leads`,
        icon: Users,
        items: [
          { title: "Lead List", url: `/${org}/leads` },
          { title: "Capture Sources", url: `/${org}/leads/sources` },
        ],
      },
      {
        title: "Marketing",
        url: `/${org}/marketing`,
        icon: Mail,
        items: [
          { title: "Email Campaigns", url: `/${org}/marketing/email` },
          { title: "Social Media", url: `/${org}/marketing/social` },
          { title: "AI Content", url: `/${org}/marketing/ai` },
        ],
      },
      {
        title: "CRM",
        url: `/${org}/crm`,
        icon: KanbanSquare,
        items: [
          { title: "Opportunities", url: `/${org}/crm/opportunities` },
          { title: "Pipeline (Kanban)", url: `/${org}/crm/pipeline` },
          { title: "Reports", url: `/${org}/crm/reports` },
        ],
      },
      {
        title: "Support",
        url: `/${org}/support`,
        icon: MessageSquare,
        items: [
          { title: "Unified Inbox", url: `/${org}/support/inbox` },
          { title: "Tickets", url: `/${org}/support/tickets` },
          { title: "AI Chatbot", url: `/${org}/support/ai-bot` },
        ],
      },
      {
        title: "Settings",
        url: `/${org}/settings`,
        icon: Settings2,
        items: [
          { title: "Organization", url: `/${org}/settings/org` },
          { title: "Users", url: `/${org}/settings/users` },
          { title: "Plans & Billing", url: `/${org}/settings/billing` },
          { title: "Branding", url: `/${org}/settings/branding` },
        ],
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* HEADER */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <data.organization.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {isLoading ? "Loading..." : data.organization.name}
            </span>
            <span className="truncate text-xs">{data.organization.plan}</span>
          </div>
        </div>
      </SidebarHeader>

      {/* MAIN CONTENT */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <NavUser user={data.user} orgSlug={org} isLoading={isLoading} />
      </SidebarFooter>

      {/* COLLAPSE BUTTON */}
      <SidebarRail />
    </Sidebar>
  )
}
