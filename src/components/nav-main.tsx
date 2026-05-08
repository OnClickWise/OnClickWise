"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type LeafItem = {
  title: string
  url?: string
  icon?: ReactNode
}

type SubGroupItem = {
  title: string
  url?: string
  icon?: ReactNode
  items?: LeafItem[]
}

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: SubGroupItem[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleCategoryClick = (hasSubItems: boolean) => {
    if (hasSubItems && isCollapsed) setOpen(true)
  }

  const isLeafActive = (url?: string) => !!url && pathname === url

  const isSubGroupActive = (subGroup: SubGroupItem) => {
    if (subGroup.url && pathname === subGroup.url) return true
    return subGroup.items?.some((leaf) => isLeafActive(leaf.url)) ?? false
  }

  const isItemActive = (item: NavItem) => {
    if (pathname === item.url) return true
    return item.items?.some((sub) => isSubGroupActive(sub)) ?? false
  }

  return (
    <SidebarGroup>
      <SidebarMenu className="sidebar-curved-menu">
        {items.map((item) => {
          const itemActive = isItemActive(item)
          const hasSubItems = !!item.items?.length

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`cursor-pointer sidebar-menu-item ${itemActive ? "active" : ""}`}
                >
                  <a href={item.url} className="flex items-center">
                    {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                    <span className={`menu-text ${isCollapsed ? "collapsed" : "expanded"}`}>
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={itemActive || item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`cursor-pointer sidebar-menu-item ${itemActive ? "active" : ""}`}
                    onClick={() => handleCategoryClick(hasSubItems)}
                  >
                    {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                    <span className={`menu-text ${isCollapsed ? "collapsed" : "expanded"}`}>
                      {item.title}
                    </span>
                    <ChevronRight className={`menu-chevron ${isCollapsed ? "collapsed" : "expanded"}`} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const hasChildren = !!subItem.items?.length
                        const subGroupActive = isSubGroupActive(subItem)

                        if (!hasChildren) {
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              {subItem.url ? (
                                <SidebarMenuSubButton asChild>
                                  <a
                                    href={subItem.url}
                                    className={`cursor-pointer sidebar-submenu-item flex items-center gap-2 ${isLeafActive(subItem.url) ? "active" : ""}`}
                                  >
                                    {subItem.icon && <span className="w-4 h-4 flex-shrink-0">{subItem.icon}</span>}
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              ) : (
                                <SidebarMenuSubButton asChild>
                                  <span className="sidebar-submenu-item flex items-center gap-2 opacity-60 cursor-default">
                                    {subItem.icon && <span className="w-4 h-4 flex-shrink-0">{subItem.icon}</span>}
                                    <span>{subItem.title}</span>
                                  </span>
                                </SidebarMenuSubButton>
                              )}
                            </SidebarMenuSubItem>
                          )
                        }

                        // Sub-grupo collapsible (ex: Contabilidade, Finanças dentro do ERP)
                        return (
                          <Collapsible
                            key={subItem.title}
                            defaultOpen={subGroupActive}
                            className="group/subgroup"
                          >
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger className="w-full">
                                <div
                                  className={`
                                    flex items-center justify-between w-full
                                    px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider
                                    transition-colors cursor-pointer select-none
                                    ${subGroupActive
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {subItem.icon && <span className="w-3.5 h-3.5">{subItem.icon}</span>}
                                    {subItem.title}
                                  </div>
                                  <ChevronRight className="w-3 h-3 transition-transform duration-200 group-data-[state=open]/subgroup:rotate-90" />
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-1 mt-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                                  {subItem.items?.map((leaf) => (
                                    <SidebarMenuSubItem key={leaf.title}>
                                      {leaf.url ? (
                                        <SidebarMenuSubButton asChild>
                                          <a
                                            href={leaf.url}
                                            className={`cursor-pointer sidebar-submenu-item flex items-center gap-2 ${isLeafActive(leaf.url) ? "active" : ""}`}
                                          >
                                            {leaf.icon && <span className="w-3.5 h-3.5 flex-shrink-0">{leaf.icon}</span>}
                                            <span>{leaf.title}</span>
                                          </a>
                                        </SidebarMenuSubButton>
                                      ) : (
                                        <SidebarMenuSubButton asChild>
                                          <span className="sidebar-submenu-item flex items-center gap-2 opacity-50 cursor-default">
                                            <span>{leaf.title}</span>
                                          </span>
                                        </SidebarMenuSubButton>
                                      )}
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
