"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from 'next-intl'
import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import { UserAvatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
  orgSlug,
  isLoading = false,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  orgSlug: string
  isLoading?: boolean
}) {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('UserMenu')
  
  // Verificar se está em alguma página de settings, billing, ou notificações
  const isInUserSection = pathname?.includes('/settings') || pathname?.includes('/billing') || pathname?.includes('/notifications')

  const handleLogout = () => {
    // Obter o slug da organização do localStorage antes de limpar
    const organizationStr = localStorage.getItem('organization')
    let organizationSlug = orgSlug
    
    if (organizationStr) {
      try {
        const organization = JSON.parse(organizationStr)
        organizationSlug = organization.slug || orgSlug
      } catch (error) {
        console.error('Error parsing organization data:', error)
      }
    }
    
    // Limpar dados de autenticação
    localStorage.removeItem('token')
    localStorage.removeItem('organization')
    localStorage.removeItem('lastActivity')
    
    // Redirecionar para a página de login da empresa
    if (organizationSlug && organizationSlug !== 'undefined') {
      router.push(`/${organizationSlug}/login`)
    } else {
      // Fallback para página inicial se não conseguir determinar a organização
      router.push('/')
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className={isInUserSection ? "user-menu-active" : ""}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={`cursor-pointer ${isInUserSection ? "nav-user-active !bg-white !text-black" : "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"}`}
              style={isInUserSection ? { 
                backgroundColor: '#fff',
                color: '#000',
                borderRadius: '20px 0 0 20px',
                width: 'calc(100% + 8px)'
              } : undefined}
            >
              <UserAvatar 
                src={user.avatar} 
                name={user.name} 
                className="rounded-full flex-shrink-0" 
                size="md"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className={`menu-text org-text ${isCollapsed ? "collapsed" : "expanded"} truncate font-medium`}>
                  {isLoading ? t('loading') : user.name}
                </span>
                <span className={`menu-text org-text ${isCollapsed ? "collapsed" : "expanded"} truncate text-xs`}>
                  {isLoading ? "loading@example.com" : user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar 
                  src={user.avatar} 
                  name={user.name} 
                  className="rounded-lg" 
                  size="md"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {isLoading ? t('loading') : user.name}
                  </span>
                  <span className="truncate text-xs">
                    {isLoading ? "loading@example.com" : user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <Sparkles />
                {t('upgradeToPro')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => router.push(`/${orgSlug}/settings/account`)}
              >
                <BadgeCheck />
                {t('account')}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard />
                {t('billing')}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell />
                {t('notifications')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut />
              {t('logOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
