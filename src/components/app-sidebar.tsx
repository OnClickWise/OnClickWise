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
import { useApi } from "@/hooks/useApi"
import { generateAvatar, generateOrgLogo } from "@/utils/avatar"
import { OrganizationAvatar } from "@/components/ui/avatar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  org: string
}

export function AppSidebar({ org, ...props }: AppSidebarProps) {
  const { organization } = useAuth()
  const { apiCall, isClient } = useApi()
  const [userData, setUserData] = React.useState({
    name: "",
    email: "",
    avatar: "",
  })
  const [orgData, setOrgData] = React.useState({
    name: "",
    logo_url: null,
    plan: "",
  })
  const [dataLoaded, setDataLoaded] = React.useState(false)
  
  // Fetch user and organization data when component mounts
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch user data
        const userResponse = await apiCall('/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (userResponse.success && userResponse.user) {
          setUserData({
            name: userResponse.user.name || "User",
            email: userResponse.user.email || "user@example.com",
            avatar: userResponse.user.profile_image 
              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${userResponse.user.profile_image}` 
              : generateAvatar(userResponse.user.name || "User"),
          })
        }

        // Fetch organization data
        const orgResponse = await apiCall('/auth/user-organization', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (orgResponse.success && orgResponse.organization) {
          setOrgData({
            name: orgResponse.organization.name || "Organization",
            logo_url: orgResponse.organization.logo_url,
            plan: "Enterprise",
          })
        }
        
        // Mark data as loaded
        setDataLoaded(true)
      } catch (error) {
        console.error('Sidebar - Error fetching data:', error)
      }
    }

    // Aguardar até estar no cliente antes de fazer as chamadas
    if (isClient) {
      fetchData()
    }
  }, [isClient]) // Dependência do isClient para aguardar o cliente estar pronto

  // Listen for organization updates
  React.useEffect(() => {
    const handleOrganizationUpdate = () => {
      // Reload organization data when updated
      const fetchOrgData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const orgResponse = await apiCall('/auth/user-organization', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (orgResponse.success && orgResponse.organization) {
            setOrgData({
              name: orgResponse.organization.name || "Organization",
              logo_url: orgResponse.organization.logo_url,
              plan: "Enterprise",
            })
            setDataLoaded(true)
          }
        } catch (error) {
          console.error('Sidebar - Error reloading organization data:', error)
        }
      }

      fetchOrgData()
    }

    window.addEventListener('organizationUpdated', handleOrganizationUpdate)
    return () => window.removeEventListener('organizationUpdated', handleOrganizationUpdate)
  }, [isClient, apiCall])

  // Listen for user updates
  React.useEffect(() => {
    const handleUserUpdate = () => {
      // Reload user data when updated
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const userResponse = await apiCall('/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (userResponse.success && userResponse.user) {
            setUserData({
              name: userResponse.user.name || "User",
              email: userResponse.user.email || "user@example.com",
              avatar: userResponse.user.profile_image 
              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${userResponse.user.profile_image}` 
              : generateAvatar(userResponse.user.name || "User"),
            })
            setDataLoaded(true)
          }
        } catch (error) {
          console.error('Sidebar - Error reloading user data:', error)
        }
      }

      fetchUserData()
    }

    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [isClient, apiCall])
  
  // Use organization data from API
  const organizationData = {
    name: dataLoaded ? orgData.name : "",
    logo: dataLoaded && orgData.logo_url 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${orgData.logo_url}` 
      : dataLoaded ? generateOrgLogo(orgData.name) : null,
    plan: dataLoaded ? orgData.plan : "",
  }

  const data = {
    user: {
      ...userData,
      name: dataLoaded ? userData.name : "",
      email: dataLoaded ? userData.email : "",
      avatar: dataLoaded ? userData.avatar : "",
    },
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
          <OrganizationAvatar 
            src={organizationData.logo || undefined} 
            name={organizationData.name} 
            size="md"
          />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {dataLoaded ? organizationData.name : "Loading..."}
            </span>
            <span className="truncate text-xs">
              {dataLoaded ? organizationData.plan : ""}
            </span>
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
