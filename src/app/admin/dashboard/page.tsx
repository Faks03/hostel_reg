"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building, Settings, BarChart, CheckCircle } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"

// Import the configured Axios instance
import api from "@/utils/api"

// Dashboard data type
interface DashboardData {
  totalStudents: number
  totalRooms: number
  totalCapacity: number
  allocatedStudents: number
  availableSpaces: number
  occupancyRate: number
}

// Student type
interface Student {
  registrationStatus: "SUBMITTED" | "rejected"
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null)

        // Using the configured Axios instance for API calls
        const [studentsResponse, roomsResponse] = await Promise.all([
          api.get<Student[]>("/hostel/all"),
          api.get("/rooms/summary"),
        ])

        const studentsData = studentsResponse.data
        const roomsData = roomsResponse.data

        const totalStudents = studentsData.length
        const totalRooms = Number(roomsData.totalRooms) || 0
        const totalCapacity = Number(roomsData.totalCapacity) || 0
        const allocatedStudents = Number(roomsData.totalAllocated) || 0
        const availableSpaces = Number(roomsData.availableSpaces) || 0

        const occupancyRate =
          totalCapacity > 0 ? (allocatedStudents / totalCapacity) * 100 : 0

        setData({
          totalStudents,
          totalRooms,
          totalCapacity,
          allocatedStudents,
          availableSpaces,
          occupancyRate,
        })
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError("An error occurred while fetching data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default fallback values
  const {
    totalStudents,
    totalRooms,
    totalCapacity,
    allocatedStudents,
    availableSpaces,
    occupancyRate,
  } = data || {
    totalStudents: 0,
    totalRooms: 0,
    totalCapacity: 0,
    allocatedStudents: 0,
    availableSpaces: 0,
    occupancyRate: 0,
  }

  return (
    <div >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6 md:mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>Dashboard</BreadcrumbLink>
            
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-lg text-muted-foreground mt-2">
          Welcome back! Here is what’s happening with your hostel management
          system.
        </p>
      </div>

      <div className="flex-grow space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalStudents - 1}</div>
              <p className="text-sm text-muted-foreground mt-1">
                All registered students
              </p>
            </CardContent>
          </Card>

          {/* Total Rooms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Building className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalRooms}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Rooms available in the hostel
              </p>
            </CardContent>
          </Card>

          {/* Allocated Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Allocated Students</CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{allocatedStudents}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Students currently assigned
              </p>
            </CardContent>
          </Card>

          {/* Room Occupancy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Room Occupancy</CardTitle>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{occupancyRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {allocatedStudents} of {totalCapacity} spaces filled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild className="justify-start h-14 text-base">
                <Link href="/admin/view-registrations">
                  <Users className="mr-3 h-5 w-5" />
                  Manage Students
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="justify-start h-14 text-base"
              >
                <Link href="/admin/manage-rooms">
                  <Settings className="mr-3 h-5 w-5" />
                  Manage Rooms
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="justify-start h-14 text-base"
              >
                <Link href="/admin/reports">
                  <BarChart className="mr-3 h-5 w-5" />
                  View Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
