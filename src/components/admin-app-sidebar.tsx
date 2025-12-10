"use client"

import * as React from "react"
import { GalleryVerticalEnd, LogOut, FileCheck, Home, Gauge, ScrollText } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation data for admin dashboard
const data = {
  navMain: [
    { title: "Dashboard", url: "/admin/dashboard", icon: Gauge },
    { title: "View Registrations", url: "/admin/view-registrations", icon: ScrollText },
    { title: "Verify Documents", url: "/admin/verify-docs", icon: FileCheck },
    { title: "Manage Rooms", url: "/admin/manage-rooms", icon: Home },
    { title: "Trigger Allocation", url: "/admin/trigger-allocation", icon: GalleryVerticalEnd },
    { title: "Reports", url: "/admin/reports", icon: ScrollText },
  ],
  navSecondary: [
    { title: "Logout", url: "/admin", icon: LogOut },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="bg-gray-50 border-r border-gray-200">
      {/* Sidebar Header */}
      <SidebarHeader className="px-4 py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin/dashboard" className="flex items-center gap-4">
                <div className="bg-indigo-600 text-white flex w-12 h-12 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="w-7 h-7" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-semibold text-gray-900 text-lg">Admin Portal</span>
                  <span className="text-sm text-gray-500">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="flex flex-col justify-between h-full px-2 py-4">
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a
                    href={item.url}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-50 font-medium text-gray-800"
                  >
                    {item.icon && <item.icon className="w-6 h-6 text-indigo-600" />}
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary navigation (Logout) */}
        <SidebarGroup>
          <SidebarMenu>
            {data.navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a
                    href={item.url}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium"
                  >
                    {item.icon && <item.icon className="w-6 h-6" />}
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
