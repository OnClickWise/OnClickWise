"use client"

import * as React from "react"
import {
  Users,
  Mail,
  KanbanSquare,
  MessageSquare,
  Settings2,
  Building2,
  BarChart3,
  LayoutDashboard,
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
    role: "",
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
        const organizationStr = localStorage.getItem('organization');
        
        if (!token || !organizationStr) {
          // Set fallback data
          setUserData({
            name: "User",
            email: "user@example.com",
            avatar: generateAvatar("User"),
          });
          setOrgData({
            name: "Organization",
            logo_url: null,
            plan: "Enterprise",
          });
          setDataLoaded(true);
          return;
        }

        // Try to fetch user data from API
        try {
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
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${userResponse.user.profile_image}` 
                : generateAvatar(userResponse.user.name || "User"),
              role: userResponse.user.role || "employee",
            })
          }
        } catch (error) {
          // Fallback data when API is not available
          setUserData({
            name: "User",
            email: "user@example.com",
            avatar: generateAvatar("User"),
            role: "employee",
          })
        }

        // Try to fetch organization data from API
        try {
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
        } catch (error) {
          // Fallback to localStorage data
          try {
            const organization = JSON.parse(organizationStr);
            setOrgData({
              name: organization.name || "Organization",
              logo_url: organization.logo_url,
              plan: "Enterprise",
            })
          } catch (parseError) {
            setOrgData({
              name: "Organization",
              logo_url: null,
              plan: "Enterprise",
            })
          }
        }
        
        // Mark data as loaded
        setDataLoaded(true)
      } catch (error) {
        console.error('Sidebar - Error fetching data:', error)
        setDataLoaded(true)
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
              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${userResponse.user.profile_image}` 
              : generateAvatar(userResponse.user.name || "User"),
              role: userResponse.user.role || "employee",
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
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${orgData.logo_url}` 
      : dataLoaded ? generateOrgLogo(orgData.name) : null,
    plan: dataLoaded ? orgData.plan : "",
  }

  // Base navigation items
  const baseNavItems = [
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
      title: "Chats",
      url: `/${org}/chats`,
      icon: MessageSquare,
      items: [
        { title: "WhatsApp", url: `/${org}/chats/whatsapp` },
        { title: "Telegram", url: `/${org}/chats/telegram` },
        { title: "Email", url: `/${org}/chats/email` },
      ],
    },
  ]

  // Settings navigation (available to all)
  const settingsNavItem = {
    title: "Settings",
    url: `/${org}/settings`,
    icon: Settings2,
    items: [
      { title: "Organization", url: `/${org}/settings/org` },
      { title: "Users", url: `/${org}/settings/users` },
      { title: "Telegram", url: `/${org}/settings/telegram` },
      { title: "Plans & Billing", url: `/${org}/settings/billing` },
      { title: "Branding", url: `/${org}/settings/branding` },
    ],
  }

  // Combine navigation items
  const navMain = [...baseNavItems, settingsNavItem]

  // Function to handle dashboard redirect - all users go to same URL
  const handleDashboardClick = () => {
    const baseUrl = 'http://localhost:3001'
    let orgSlug = org
    
    // Se org estiver undefined, tentar obter do localStorage
    if (!orgSlug || orgSlug === 'undefined') {
      const organizationStr = localStorage.getItem('organization')
      if (organizationStr) {
        try {
          const organization = JSON.parse(organizationStr)
          orgSlug = organization.slug
        } catch (error) {
          console.error('Error parsing organization data:', error)
        }
      }
    }
    
    // Se ainda não tiver orgSlug válido, não redirecionar
    if (!orgSlug || orgSlug === 'undefined') {
      console.error('Unable to determine organization slug for dashboard redirect')
      return
    }
    
    const dashboardUrl = `${baseUrl}/${orgSlug}/dashboard`
    window.location.href = dashboardUrl
  }

  const data = {
    user: {
      ...userData,
      name: dataLoaded ? userData.name : "Loading...",
      email: dataLoaded ? userData.email : "loading@example.com",
      avatar: dataLoaded ? userData.avatar : generateAvatar("Loading"),
    },
    organization: organizationData,
    navMain,
    handleDashboardClick,
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
            className="shrink-0"
          />
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[state=collapsed]:hidden">
            <span className="truncate font-medium">
              {dataLoaded ? (organizationData.name || "Organization") : "Loading..."}
            </span>
            <span className="truncate text-xs">
              {dataLoaded ? (organizationData.plan || "Enterprise") : ""}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* CONTEÚDO PRINCIPAL */}
      <SidebarContent>
        {/* Dashboard Button */}
        <div className="p-2">
          <button
            onClick={data.handleDashboardClick}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
          </button>
        </div>
        
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
