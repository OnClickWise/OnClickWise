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
import { FaWhatsapp, FaTelegram } from "react-icons/fa"
import { SiGmail } from "react-icons/si"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
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
  const pathname = usePathname()
  const { state, open } = useSidebar()
  const isCollapsed = !open
  const t = useTranslations('Sidebar')
  const tOrg = useTranslations('Organization')
  // Initialize role synchronously from token to avoid flash on F5
  const getInitialRole = (): string => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token) {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          return (
            payload.role || payload.type || payload.userType || payload.user_type || 'employee'
          )
        }
      }
    } catch (e) {
      // ignore
    }
    return 'employee'
  }

  const [userData, setUserData] = React.useState({
    name: "",
    email: "",
    avatar: "",
    role: getInitialRole(),
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
            name: t('account') || "User",
            email: "user@example.com",
            avatar: generateAvatar(t('account') || "User"),
            role: "Member",
          });
          setOrgData({
            name: tOrg('name') || "Organization",
            logo_url: null,
            plan: tOrg('enterprise') || "Enterprise",
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
              name: userResponse.user.name || t('account') || "User",
              email: userResponse.user.email || "user@example.com",
              avatar: userResponse.user.profile_image 
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${userResponse.user.profile_image}` 
                : generateAvatar(userResponse.user.name || t('account') || "User"),
              role: userResponse.user.role || "employee",
            })
          }
        } catch (error) {
          // Fallback data when API is not available
          setUserData({
            name: t('account') || "User",
            email: "user@example.com",
            avatar: generateAvatar(t('account') || "User"),
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
              name: orgResponse.organization.name || tOrg('name') || "Organization",
              logo_url: orgResponse.organization.logo_url,
              plan: tOrg('enterprise') || "Enterprise",
            })
          }
        } catch (error) {
          // Fallback to localStorage data
          try {
            const organization = JSON.parse(organizationStr);
            setOrgData({
              name: organization.name || tOrg('name') || "Organization",
              logo_url: organization.logo_url,
              plan: tOrg('enterprise') || "Enterprise",
            })
          } catch (parseError) {
            setOrgData({
              name: tOrg('name') || "Organization",
              logo_url: null,
              plan: tOrg('enterprise') || "Enterprise",
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
              name: orgResponse.organization.name || tOrg('name') || "Organization",
              logo_url: orgResponse.organization.logo_url,
              plan: tOrg('enterprise') || "Enterprise",
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
              name: userResponse.user.name || t('account') || "User",
              email: userResponse.user.email || "user@example.com",
              avatar: userResponse.user.profile_image 
              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${userResponse.user.profile_image}` 
              : generateAvatar(userResponse.user.name || t('account') || "User"),
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

  // Navigation items with Dashboard included (usando traduções)
  const allNavItems = [
    {
      title: t('dashboard'),
      url: `/${org}/dashboard`,
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: t('leads'),
      url: `/${org}/leads`,
      icon: Users,
      items: [
        { title: t('leadList'), url: `/${org}/leads` },
        { title: t('captureSources'), url: `/${org}/leads/sources` },
      ],
    },
    {
      title: t('marketing'),
      url: `/${org}/marketing`,
      icon: Mail,
      items: [
        { title: t('emailCampaigns'), url: `/${org}/marketing/email` },
        { title: t('socialMedia'), url: `/${org}/marketing/social` },
        { title: t('aiContent'), url: `/${org}/marketing/ai` },
      ],
    },
    {
      title: t('crm'),
      url: `/${org}/crm`,
      icon: KanbanSquare,
      items: [
        { title: t('opportunities'), url: `/${org}/crm/opportunities` },
        { title: t('pipeline'), url: `/${org}/crm/pipeline` },
        { title: t('reports'), url: `/${org}/crm/reports` },
      ],
    },
    {
      title: t('chats'),
      url: `/${org}/chats`,
      icon: MessageSquare,
      items: [
        { title: t('whatsapp'), url: `/${org}/chats/whatsapp`, icon: <FaWhatsapp className="w-4 h-4" /> },
        { title: t('telegram'), url: `/${org}/chats/telegram`, icon: <FaTelegram className="w-4 h-4" /> },
        { title: t('email'), url: `/${org}/chats/email`, icon: <SiGmail className="w-4 h-4" /> },
      ],
    },
    {
      title: t('settings'),
      url: `/${org}/settings`,
      icon: Settings2,
      items: [
        { title: t('organization'), url: `/${org}/settings/org` },
        { title: t('users'), url: `/${org}/settings/users` },
        { title: t('telegramSettings'), url: `/${org}/settings/telegram` },
        { title: t('billing'), url: `/${org}/settings/billing` },
        { title: t('branding'), url: `/${org}/settings/branding` },
      ],
    },
  ]

  // Filter out all of Settings for employees (most secure)
  const isEmployee = (userData.role || '').toLowerCase() === 'employee'
  const navMain = isEmployee
    ? allNavItems.map(item => {
        // Filter telegramSettings from settings subitems for employee
        if (item.url === `/${org}/settings`) {
          return {
            ...item,
            items: item.items.filter(
              (subitem) => subitem.url !== `/${org}/settings/telegram`
            ),
          }
        }
        return item
      })
      .filter(
        (item) => item.url !== `/${org}/settings` && item.url !== `/${org}/leads`
      )
    : allNavItems

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
      name: dataLoaded ? userData.name : tOrg('loading'),
      email: dataLoaded ? userData.email : "loading@example.com",
      avatar: dataLoaded ? userData.avatar : generateAvatar(tOrg('loading') || "Loading"),
    },
    organization: organizationData,
    navMain,
    handleDashboardClick,
  }


  return (
    <Sidebar collapsible="icon" {...props}>
      {/* TOPO - Header Melhorado */}
      <SidebarHeader className="sidebar-header-custom">
        <div className="flex items-center px-4 py-4">
          <OrganizationAvatar 
            src={organizationData.logo || undefined} 
            name={organizationData.name} 
            size="lg"
            className="shrink-0 shadow-lg"
          />
          <div className="grid flex-1 text-left leading-tight min-w-0">
            <span className={`menu-text org-text ${isCollapsed ? "collapsed" : "expanded"} truncate font-semibold text-base text-white`}>
              {dataLoaded ? (organizationData.name || tOrg('name')) : tOrg('loading')}
            </span>
            <span className={`menu-text org-text ${isCollapsed ? "collapsed" : "expanded"} truncate text-xs text-white/80 font-medium mt-0.5`}>
              {dataLoaded ? (organizationData.plan || tOrg('enterprise')) : ""}
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
    </Sidebar>
  )
}
