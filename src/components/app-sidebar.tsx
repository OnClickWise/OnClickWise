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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  org: string
}

export function AppSidebar({ org, ...props }: AppSidebarProps) {
  const { organization } = useAuth()
  const [userData, setUserData] = React.useState({
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/default.jpg",
  })
  
  // Fetch user data when component mounts
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiService.getCurrentUser()
        if (response.success && response.data) {
          setUserData({
            name: response.data.user.name || "User",
            email: response.data.user.email || "user@example.com",
            avatar: "/avatars/default.jpg",
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])
  
  // Use organization data from useAuth hook
  const organizationData = {
    name: organization?.name || "Organization",
    logo: organization?.logo_url || Building2,
    plan: organization?.plan || "Enterprise",
  }

  const data = {
    user: userData,
    organization: organizationData,
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
      {/* TOPO */}
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            {typeof organizationData.logo === 'string' ? (
              <img 
                src={organizationData.logo} 
                alt={organizationData.name}
                className="size-4 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : (
              <organizationData.logo className="size-4" />
            )}
            <Building2 className="size-4 hidden" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{organizationData.name}</span>
            <span className="truncate text-xs">{organizationData.plan}</span>
          </div>
        </div>
      </SidebarHeader>

      {/* CONTEÚDO PRINCIPAL */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* RODAPÉ */}
      <SidebarFooter>
        <NavUser user={data.user} orgSlug={org} />
      </SidebarFooter>

      {/* BOTÃO DE COLAPSE */}
      <SidebarRail />
    </Sidebar>
  )
}
