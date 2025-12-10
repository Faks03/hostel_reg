'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, User, FileText, Upload, Home } from "lucide-react"
import Link from "next/link"
import { AppSidebar } from "@/components/stu-app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/utils/api"
import { AxiosError } from "axios"

// Define a type for your student data to ensure type safety
interface StudentData {
  firstname: string;
  lastname: string;
  registrationStatus: 'draft' | 'SUBMITTED' | 'approved' | 'rejected';
  allocatedRoom?: {
    block: string;
    roomNumber: string;
  } | null;
  recentNotifications?: { 
    id: number; 
    title: string; 
    date: string; 
    unread: boolean; 
  }[] | null; 
}


export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        
        if (!studentId) {
          router.push("/student");
          return;
        }

        const res = await api.get(`/students/profile`);
        setStudentData(res.data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          console.error("Failed to fetch student data:", err.response?.data?.error || err.message);
          setError(err.response?.data?.error || "Failed to load dashboard data.");
        } else {
          console.error("An unexpected error occurred:", err);
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case 'SUBMITTED':
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    default:
      return <Badge>Unknown</Badge>
  }
}


  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!studentData) {
    return <div>No student data found. Please log in again.</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        <SidebarTrigger className="md:hidden" />
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-semibold tracking-tight">Student Dashboard</h1>
          </div>
          <div>
            {/* Combined firstname and lastname to display the full name */}
            <h1 className="text-3xl font-bold">Hello, {studentData.firstname} {studentData.lastname}!</h1>
            <p className="text-muted-foreground">Welcome to your hostel dashboard</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registration Status</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatusBadge(studentData.registrationStatus)}
                  <p className="text-xs text-muted-foreground">
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Room Allocation</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {studentData.allocatedRoom ? (
                    <>
                      <p className="text-2xl font-bold">
                        {studentData.allocatedRoom.block}-{studentData.allocatedRoom.roomNumber}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not allocated yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your hostel registration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/student/hostel-registration">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Registration</span>
                  </Button>
                </Link>
                <Link href="/student/upload">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Upload Docs</span>
                  </Button>
                </Link>
                <Link href="/student/profile">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <User className="h-6 w-6" />
                    <span className="text-sm">Profile</span>
                  </Button>
                </Link>
                <Link href="/student/notifications">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Bell className="h-6 w-6" />
                    <span className="text-sm">Notifications</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Latest updates and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Use optional chaining to safely map over notifications */}
                {studentData.recentNotifications?.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className={`h-4 w-4 ${notification.unread ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.date}</p>
                      </div>
                    </div>
                    {notification.unread && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                ))}
                <Link href="/student/notifications">
                  <Button variant="outline" className="w-full">
                    View All Notifications
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}