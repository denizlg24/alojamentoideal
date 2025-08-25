"use client";
import { Inbox, LogOut, Search, Settings, ShoppingBag } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { signOutUser } from "@/app/actions/signOut";
import { LocaleSwitcherSelect } from "./ui/locale-switcher-select";
import { useLocale } from "next-intl";
import { Separator } from "./ui/separator";
import { useTranslations } from "use-intl";

export function AppSidebar() {
  const locale = useLocale();
  const t = useTranslations("admin-sidebar");
  const items = [
    {
      title: t("orders"),
      url: "/admin/dashboard",
      icon: ShoppingBag,
    },
    {
      title: t("inbox"),
      url: "/admin/dashboard/inbox",
      icon: Inbox,
    },
    {
      title: t("search"),
      url: "/admin/dashboard/search",
      icon: Search,
    },
    {
      title: t("settings"),
      url: "/admin/dashboard/settings",
      icon: Settings,
    },
  ];
  return (
    <Sidebar collapsible="icon" className="z-95">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="justify-between">
            Alojamento Ideal - Admin
            <LocaleSwitcherSelect defaultValue={locale} />
          </SidebarGroupLabel>
          <Separator className="my-2" />
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton>
                    <Link
                      className="flex w-full items-center gap-2 px-0! overflow-hidden rounded-md text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:py-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
                      href={item.url}
                    >
                      <item.icon />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    signOutUser();
                  }}
                >
                  <LogOut />
                  {t("log-out")}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
