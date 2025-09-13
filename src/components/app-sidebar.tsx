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
import { TeamSwitcher } from "@/components/team-switcher"
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
  const data = {
    user: {
      name: "Admin LeadWise",
      email: "admin@leadwise.com",
      avatar: "/avatars/default.jpg",
    },
    teams: [
      {
        name: "Educação Sem Limites",
        logo: Building2,
        plan: "Enterprise",
      },
      {
        name: "StartUpX",
        logo: Building2,
        plan: "Startup",
      },
    ],
    navMain: [
      {
        title: "Leads",
        url: `/${org}/leads`,
        icon: Users,
        items: [
          { title: "Lista de Leads", url: `/${org}/leads` },
          { title: "Fontes de Captura", url: `/${org}/leads/sources` },
        ],
      },
      {
        title: "Marketing",
        url: `/${org}/marketing`,
        icon: Mail,
        items: [
          { title: "Campanhas de E-mail", url: `/${org}/marketing/email` },
          { title: "Redes Sociais", url: `/${org}/marketing/social` },
          { title: "IA para Conteúdo", url: `/${org}/marketing/ai` },
        ],
      },
      {
        title: "CRM",
        url: `/${org}/crm`,
        icon: KanbanSquare,
        items: [
          { title: "Oportunidades", url: `/${org}/crm/opportunities` },
          { title: "Pipeline (Kanban)", url: `/${org}/crm/pipeline` },
          { title: "Relatórios", url: `/${org}/crm/reports` },
        ],
      },
      {
        title: "Atendimento",
        url: `/${org}/support`,
        icon: MessageSquare,
        items: [
          { title: "Inbox Unificada", url: `/${org}/support/inbox` },
          { title: "Tickets", url: `/${org}/support/tickets` },
          { title: "Chatbot IA", url: `/${org}/support/ai-bot` },
        ],
      },
      {
        title: "Configurações",
        url: `/${org}/settings`,
        icon: Settings2,
        items: [
          { title: "Organização", url: `/${org}/settings/org` },
          { title: "Usuários", url: `/${org}/settings/users` },
          { title: "Planos & Billing", url: `/${org}/settings/billing` },
          { title: "Branding", url: `/${org}/settings/branding` },
        ],
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* TOPO */}
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      {/* CONTEÚDO PRINCIPAL */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* RODAPÉ */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      {/* BOTÃO DE COLAPSE */}
      <SidebarRail />
    </Sidebar>
  )
}
