"use client"

import * as React from "react"
import {
  Users,
  Mail,
  KanbanSquare,
  LayoutGrid,
  MessageSquare,
  Settings2,
  Building2,
  BarChart3,
  LayoutDashboard,
} from "lucide-react"
import { FaWhatsapp, FaTelegram, FaInstagram, FaFacebookMessenger } from "react-icons/fa"
import { SiGmail } from "react-icons/si"
import { usePathname } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { generateAvatar, generateOrgLogo } from "@/utils/avatar"
import { OrganizationAvatar } from "@/components/ui/avatar"
import { resolveMediaUrl } from "@/lib/api-url"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  org: string
}
import { useApi } from "@/hooks/useApi"
import { useAuth } from '@/hooks/useAuth';

export function AppSidebar({ org, ...props }: AppSidebarProps) {
  const { organization } = useAuth()
  const { apiCall, isClient } = useApi()
  const pathname = usePathname()
  const { state, open } = useSidebar()
  const isCollapsed = !open
  const t = useTranslations('Sidebar')
  const tOrg = useTranslations('Organization')
  const locale = useLocale()

  const getOrganizationFallback = React.useCallback((organizationStr: string | null) => {
    try {
      const parsed = organizationStr ? JSON.parse(organizationStr) : organization
      return {
        name: parsed?.name || tOrg('name') || "Organization",
        logo_url: parsed?.logo_url || null,
        plan: parsed?.plan || tOrg('enterprise') || "Enterprise",
        logoTimestamp: Date.now(),
      }
    } catch {
      return {
        name: organization?.name || tOrg('name') || "Organization",
        logo_url: organization?.logo_url || null,
        plan: tOrg('enterprise') || "Enterprise",
        logoTimestamp: Date.now(),
      }
    }
  }, [organization, tOrg])

  const getUserFallback = React.useCallback(() => {
    return {
      name: t('account') || "User",
      email: "user@example.com",
      avatar: generateAvatar(t('account') || "User"),
      role: getRoleFromToken(),
    }
  }, [t])

  // Always start with 'employee' so server and client render the same HTML (no hydration mismatch)
  // Role will be updated from localStorage inside useEffect after mount
  const getRoleFromToken = (): string => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const parts = token.split('.')
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
          const payload = JSON.parse(atob(padded))
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
    role: 'employee', // always start with 'employee' on both server and client
  })
  const [orgData, setOrgData] = React.useState({
    name: "",
    logo_url: null,
    plan: "",
    logoTimestamp: Date.now(),
  })
  const [dataLoaded, setDataLoaded] = React.useState(false)
  
  // Fetch user and organization data when component mounts
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const organizationStr = localStorage.getItem('organization');

        // Sem token: nenhuma chamada possível, usa fallback
        if (!token) {
          setUserData(getUserFallback());
          setOrgData(getOrganizationFallback(organizationStr));
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
                ? resolveMediaUrl(userResponse.user.profile_image) || generateAvatar(userResponse.user.name || t('account') || "User")
                : generateAvatar(userResponse.user.name || t('account') || "User"),
              role: userResponse.user.role || "employee",
            })
          } else {
            setUserData(getUserFallback())
          }
        } catch (error) {
          // Fallback data when API is not available — use role from token to avoid wrong nav filtering
          setUserData(getUserFallback())
        }

        // Try to fetch organization data from API
        try {
          const orgResponse = await apiCall('/organization/user-organization', {
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
              plan: orgResponse.organization.plan || tOrg('enterprise') || "Enterprise",
              logoTimestamp: Date.now(),
            })
          } else {
            setOrgData(getOrganizationFallback(organizationStr))
          }
        } catch (error) {
          // Fallback to localStorage/useAuth data
          setOrgData(getOrganizationFallback(organizationStr))
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
  }, [getOrganizationFallback, getUserFallback, isClient, t, tOrg]) // Dependência do isClient para aguardar o cliente estar pronto

  // Listen for organization updates
  React.useEffect(() => {
    const handleOrganizationUpdate = (event: Event) => {
      // Reload organization data when updated
      const fetchOrgData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const orgResponse = await apiCall('/organization/user-organization', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (orgResponse.success && orgResponse.organization) {
            const newLogoUrl = orgResponse.organization.logo_url || ''
            // Adicionar timestamp para garantir que o browser não use cache
            const timestamp = Date.now()
            setOrgData({
              name: orgResponse.organization.name || tOrg('name') || "Organization",
              logo_url: newLogoUrl,
              plan: tOrg('enterprise') || "Enterprise",
              logoTimestamp: timestamp
            })
            setDataLoaded(true)
          }
        } catch (error) {
          console.error('Sidebar - Error reloading organization data:', error)
        }
      }

      fetchOrgData()
    }

    window.addEventListener('organizationUpdated', handleOrganizationUpdate as EventListener)
    return () => window.removeEventListener('organizationUpdated', handleOrganizationUpdate as EventListener)
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
              ? resolveMediaUrl(userResponse.user.profile_image) || generateAvatar(userResponse.user.name || t('account') || "User")
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
  // Forçar reload da logo ao mudar (evita cache)
  const resolvedOrgLogo = resolveMediaUrl(orgData.logo_url)
  // Usar timestamp armazenado ou gerar um novo apenas uma vez
  const timestamp = (orgData as any).logoTimestamp || Date.now()
  const logoUrlWithTimestamp = dataLoaded && resolvedOrgLogo
    ? `${resolvedOrgLogo}${resolvedOrgLogo.includes('?') ? '&' : '?'}t=${timestamp}`
    : dataLoaded ? generateOrgLogo(orgData.name) : null;
  const organizationData = {
    name: dataLoaded ? orgData.name : "",
    logo: logoUrlWithTimestamp,
    plan: dataLoaded ? orgData.plan : "",
  }

  // Navigation items with Dashboard included (usando traduções)
  const allNavItems = [
    {
      title: t('dashboard'),
      url: `/${locale}/${org}/dashboard`,
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: 'Bate-papo',
      url: `/${locale}/${org}/mensagens`,
      icon: MessageSquare,
      items: [],
    },
    {
      title: t('leads'),
      url: `/${locale}/${org}/leads`,
      icon: Users,
      items: [
        { title: t('leadList'), url: `/${locale}/${org}/leads` },
      ],
    },
    {
      title: t('marketing'),
      url: `/${locale}/${org}/marketing`,
      icon: Mail,
      items: [
        { title: t('emailCampaigns'), url: `/${locale}/${org}/marketing/email` },
        { title: t('socialMedia'), url: `/${locale}/${org}/marketing/social` },
        { title: t('aiContent'), url: `/${locale}/${org}/marketing/ai` },
      ],
    },
    {
      title: t('crm'),
      url: `/${locale}/${org}/crm`,
      icon: KanbanSquare,
      items: [
        { title: t('opportunities'), url: `/${locale}/${org}/crm/pipeline` },
        { title: t('reports'), url: `/${locale}/${org}/crm/reports` },
      ],
    },
    {
      title: t('investments'),
      url: `/${locale}/${org}/investments`,
      icon: BarChart3,
      items: [
        { title: t('investmentsOverview'), url: `/${locale}/${org}/investments` },
        { title: t('portfolios'), url: `/${locale}/${org}/investments/portfolios` },
        { title: 'Aportes', url: `/${locale}/${org}/investments/contributions` },
        { title: 'Fluxo Financeiro', url: `/${locale}/${org}/investments/financial-flow` },
        { title: 'Dividendos', url: `/${locale}/${org}/investments/dividends` },
        { title: 'Metas', url: `/${locale}/${org}/investments/goals` },
        { title: t('simulation'), url: `/${locale}/${org}/investments/simulation` },
        { title: t('wealth'), url: `/${locale}/${org}/investments/wealth` },
        { title: 'Relatorios', url: `/${locale}/${org}/investments/reports` },
      ],
    },
    {
      title: t('kanban'),
      url: `/${locale}/${org}/kanban`,
      icon: LayoutGrid,
      items: [
        { title: t('kanbanProjects'), url: `/${locale}/${org}/kanban` },
      ],
    },
    {
      title: t('chats'),
      url: `/${locale}/${org}/chats`,
      icon: Mail,
      items: [
        { title: t('whatsapp'), url: `/${locale}/${org}/chats/whatsapp`, icon: <FaWhatsapp className="w-4 h-4" /> },
        { title: t('telegram'), url: `/${locale}/${org}/chats/telegram`, icon: <FaTelegram className="w-4 h-4" /> },
        { title: t('instagram'), url: `/${locale}/${org}/chats/instagram`, icon: <FaInstagram className="w-4 h-4" /> },
        { title: t('messenger'), url: `/${locale}/${org}/chats/messenger`, icon: <FaFacebookMessenger className="w-4 h-4" /> },
        { title: t('email'), url: `/${locale}/${org}/chats/email`, icon: <SiGmail className="w-4 h-4" /> },
      ],
    },
    {
      title: t('settings'),
      url: `/${locale}/${org}/settings`,
      icon: Settings2,
      items: [
        { title: t('organization'), url: `/${locale}/${org}/settings/org` },
        { title: t('whatsappSettings'), url: `/${locale}/${org}/settings/whatsapp` },
        { title: t('users'), url: `/${locale}/${org}/settings/users` },
        { title: t('telegramSettings'), url: `/${locale}/${org}/settings/telegram` },
        { title: t('billing'), url: `/${locale}/${org}/settings/billing` },
        { title: t('branding'), url: `/${locale}/${org}/settings/branding` },
      ],
    },
  ]

  // Filter out all of Settings for employees (most secure)
  const isEmployee = (userData.role || '').toLowerCase() === 'employee'
  const navMain = isEmployee
    ? allNavItems.map(item => {
        // Filter telegramSettings from settings subitems for employee
        if (item.url === `/${locale}/${org}/settings`) {
          return {
            ...item,
            items: item.items.filter(
              (subitem) => subitem.url !== `/${locale}/${org}/settings/telegram`
            ),
          }
        }
        return item
      })
      .filter(
        (item) => item.url !== `/${locale}/${org}/settings` && item.url !== `/${locale}/${org}/leads`
      )
    : allNavItems

  // Function to handle dashboard redirect - all users go to same URL
  const handleDashboardClick = () => {
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
    
    const dashboardUrl = `/${locale}/${orgSlug}/dashboard`
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
