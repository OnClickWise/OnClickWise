"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: ReactNode;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Expande o sidebar quando clicar em uma categoria com sub-itens
  const handleCategoryClick = (hasSubItems: boolean) => {
    if (hasSubItems && isCollapsed) {
      setOpen(true);
    }
  };

  // Check if current path matches any item or subitem
  const isItemActive = (item: (typeof items)[0]) => {
    if (pathname === item.url) return true;
    return item.items?.some((subItem) => pathname === subItem.url) || false;
  };

  const isSubItemActive = (subItemUrl: string) => {
    return pathname === subItemUrl;
  };

  return (
    <SidebarGroup>
      <SidebarMenu className="sidebar-curved-menu">
        {items.map((item) => {
          const itemActive = isItemActive(item);
          const hasSubItems = item.items && item.items.length > 0;

          // Se não tem subitens, renderizar como link direto
          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`cursor-pointer sidebar-menu-item ${
                    itemActive ? "active" : ""
                  }`}
                >
                  <a href={item.url} className="flex items-center">
                    {item.icon && (
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span
                      className={`menu-text ${
                        isCollapsed ? "collapsed" : "expanded"
                      }`}
                    >
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Se tem subitens, renderizar com collapsible
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
                    className={`cursor-pointer sidebar-menu-item ${
                      itemActive ? "active" : ""
                    }`}
                    onClick={() => handleCategoryClick(hasSubItems)}
                  >
                    {item.icon && (
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span
                      className={`menu-text ${
                        isCollapsed ? "collapsed" : "expanded"
                      }`}
                    >
                      {item.title}
                    </span>
                    <ChevronRight
                      className={`menu-chevron ${
                        isCollapsed ? "collapsed" : "expanded"
                      }`}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a
                              href={subItem.url}
                              className={`cursor-pointer sidebar-submenu-item flex items-center gap-2 ${
                                isSubItemActive(subItem.url) ? "active" : ""
                              }`}
                            >
                              {subItem.icon && (
                                <span className="w-4 h-4 flex-shrink-0">
                                  {subItem.icon}
                                </span>
                              )}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
