'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  AlertCircle,
  Info,
  CreditCard,
  FileText,
  Home,
  Calendar,
  Trash2,
  Archive,
  Mail,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/stu-app-sidebar"
import api from "@/utils/api"
import { AxiosError } from "axios"

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'document' | 'allocation' | 'announcement' | 'registration' | 'general';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
}

// Utility function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  return null;
};


const getNotificationIcon = (type: string) => {
  const icons = {
    info: <Info className="h-5 w-5 text-blue-600" />,
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    payment: <CreditCard className="h-5 w-5 text-purple-600" />,
    document: <FileText className="h-5 w-5 text-indigo-600" />,
    allocation: <Home className="h-5 w-5 text-orange-600" />,
    announcement: <Bell className="h-5 w-5 text-teal-600" />,
    registration: <FileText className="h-5 w-5 text-purple-600" />,
    general: <Mail className="h-5 w-5 text-gray-600" />
  }
  return icons[type as keyof typeof icons] || icons.general
}

const getPriorityBadge = (priority: string) => {
  const badges = {
    high: <Badge variant="destructive" className="bg-red-500 text-white font-semibold">High Priority</Badge>,
    medium: <Badge variant="outline" className="text-yellow-800 bg-yellow-100 border-yellow-200">Medium</Badge>,
    low: <Badge variant="outline" className="text-gray-800 bg-gray-100 border-gray-200">Low</Badge>
  }
  return badges[priority as keyof typeof badges] || badges.low
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  if (diffInDays === 1) {
    return "Yesterday"
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`
  }
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Reusable component for rendering a single notification card
const NotificationCard = ({ notification, markAsRead, deleteNotification }: {
  notification: Notification;
  markAsRead: (id: number) => void;
  deleteNotification: (id: number) => void;
}) => (
  <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className={`font-semibold ${!notification.isRead ? 'font-bold' : ''}`}>
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className="text-muted-foreground text-sm leading-snug">
                    {notification.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {getPriorityBadge(notification.priority)}
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(notification.createdAt)}
              </span>
              
              <div className="flex items-center gap-2">
                {notification.actionRequired && notification.actionUrl && (
                  <Button size="sm" className="h-7" asChild>
                    <Link href={notification.actionUrl}>
                      {notification.actionText}
                    </Link>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.isRead && (
                      <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" /> Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Reusable component for the notification list
const NotificationList = ({ notifications, markAsRead, deleteNotification, emptyMessage, emptyIcon }: {
  notifications: Notification[],
  markAsRead: (id: number) => void,
  deleteNotification: (id: number) => void,
  emptyMessage: string,
  emptyIcon: React.ReactNode
}) => {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            {emptyIcon}
            <h3 className="text-lg font-semibold mt-4">{emptyMessage}</h3>
            <p className="text-muted-foreground">You are all caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group notifications by 'Today' and 'Earlier'
  const today = new Date()
  const todayNotifications = notifications.filter(n => new Date(n.createdAt).toDateString() === today.toDateString())
  const earlierNotifications = notifications.filter(n => new Date(n.createdAt).toDateString() !== today.toDateString())

  return (
    <>
      {todayNotifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Today</h3>
          {todayNotifications.map(notification => (
            <NotificationCard 
              key={notification.id} 
              notification={notification} 
              markAsRead={markAsRead} 
              deleteNotification={deleteNotification} 
            />
          ))}
        </div>
      )}
      {earlierNotifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Earlier</h3>
          {earlierNotifications.map(notification => (
            <NotificationCard 
              key={notification.id} 
              notification={notification} 
              markAsRead={markAsRead} 
              deleteNotification={deleteNotification} 
            />
          ))}
        </div>
      )}
    </>
  )
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      setError(null)
      
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to view notifications");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data: Notification[] = response.data;
        
        // Convert createdAt strings to Date objects
        const processedData = data.map(notification => ({
          ...notification,
          createdAt: new Date(notification.createdAt)
        }));
        setNotifications(processedData);
      } catch (e) {
        console.error("Failed to fetch notifications:", e)
        if (e instanceof AxiosError) {
          setError(e.response?.data?.error || "Failed to load notifications. Please try again.");
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchNotifications()
  }, [])

  const markAsRead = async (id: number) => {
    const token = getAuthToken();
    if (!token) {
      setError("You are not authenticated. Please log in.");
      return;
    }

    try {
      await api.patch(`/notifications/${id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      ))
    } catch (e) {
      console.error("Failed to mark as read:", e)
      if (e instanceof AxiosError) {
        setError(e.response?.data?.error || "Failed to mark notification as read.");
      } else {
        setError("Failed to mark notification as read.");
      }
    }
  }

  const markAllAsRead = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("You are not authenticated. Please log in.");
      return;
    }

    try {
      await api.patch('/notifications/read-all', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })))
    } catch (e) {
      console.error("Failed to mark all as read:", e)
      if (e instanceof AxiosError) {
        setError(e.response?.data?.error || "Failed to mark all notifications as read.");
      } else {
        setError("Failed to mark all notifications as read.");
      }
    }
  }

  const deleteNotification = async (id: number) => {
    const token = getAuthToken();
    if (!token) {
      setError("You are not authenticated. Please log in.");
      return;
    }

    try {
      await api.delete(`/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (e) {
      console.error("Failed to delete notification:", e)
      if (e instanceof AxiosError) {
        setError(e.response?.data?.error || "Failed to delete notification.");
      } else {
        setError("Failed to delete notification.");
      }
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const importantCount = notifications.filter(n => !n.isRead && n.priority === 'high').length

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || notification.type === filterType
    return matchesSearch && matchesType
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const allNotifications = filteredNotifications
  const unreadNotifications = filteredNotifications.filter(n => !n.isRead)
  const importantNotifications = filteredNotifications.filter(n => n.priority === 'high' && !n.isRead)

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <div className="flex justify-center items-center h-screen">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <div className="flex justify-center items-center h-screen">
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to Load Notifications</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => setError(null)}>
                  Clear Error
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        <SidebarTrigger className="md:hidden" />
        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/student/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Notifications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Bell className="h-8 w-8 text-blue-500" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                  )}
                </h1>
                <p className="text-muted-foreground">Stay updated with your hostel application and campus announcements.</p>
              </div>
              
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" className="flex-shrink-0">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="allocation">Room Allocation</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="info">General Info</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="announcement">Announcements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List with Tabs */}
          <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({allNotifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="important">Important ({importantCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <NotificationList 
                notifications={allNotifications} 
                markAsRead={markAsRead} 
                deleteNotification={deleteNotification}
                emptyMessage="No notifications found"
                emptyIcon={<Bell className="h-12 w-12 text-muted-foreground mx-auto" />}
              />
            </TabsContent>

            <TabsContent value="unread" className="space-y-4">
              <NotificationList 
                notifications={unreadNotifications} 
                markAsRead={markAsRead} 
                deleteNotification={deleteNotification}
                emptyMessage="No unread notifications"
                emptyIcon={<CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />}
              />
            </TabsContent>
            
            <TabsContent value="important" className="space-y-4">
              <NotificationList 
                notifications={importantNotifications} 
                markAsRead={markAsRead} 
                deleteNotification={deleteNotification}
                emptyMessage="No unread important notifications"
                emptyIcon={<Info className="h-12 w-12 text-muted-foreground mx-auto" />}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}