"use client"

import * as React from "react"
import {
  Home,
  User,
  ClipboardList,
  UploadCloud,
  FileText,
  MapPin,
  Bell,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Navigation data for student dashboard
const data = {
  navMain: [
    { title: "Dashboard", url: "/student/dashboard", icon: Home },
    { title: "Profile", url: "/student/profile", icon: User },
    { title: "Hostel Registration", url: "/student/hostel-registration", icon: ClipboardList },
    { title: "Upload Documents", url: "/student/upload", icon: UploadCloud },
    { title: "Registration Status", url: "/student/status", icon: FileText },
    { title: "Room Allocation", url: "/student/allocation", icon: MapPin },
    { title: "Notifications", url: "/student/notifications", icon: Bell },
  ],
  navSecondary: [
    { title: "Logout", url: "/student", icon: LogOut },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="bg-gray-50 border-r border-gray-200">
      <SidebarHeader className="px-4 py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/student/dashboard" className="flex items-center gap-4">
                <div className="bg-indigo-600 text-white flex aspect-square w-12 h-12 items-center justify-center rounded-lg">
                  <Home className="w-7 h-7" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-semibold text-gray-900 text-lg">Student Portal</span>
                  <span className="text-sm text-gray-500">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

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

        {/* Secondary navigation */}
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
    </Sidebar>
  )
}
