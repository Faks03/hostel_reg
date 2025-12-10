'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  Calendar,
  Info,
  CheckCircle,
  Download,
  Loader2
} from "lucide-react"

// Assuming these components and context are available
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

interface RoomAllocationData {
  hostelName: string
  block: string
  roomNumber: string
  allocatedAt: Date
  checkInDate: Date
  checkOutDate: string
  facilities: string[]
  rules: string[]
}

export default function RoomAllocation() {
  const [allocation, setAllocation] = useState<RoomAllocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAllocation() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("API URL is not defined in environment variables.");
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch(`${apiUrl}/allocation/my-allocation`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // If no allocation is found, we don't want to show an error
          setAllocation(null);
          return;
        }

        const data = await response.json();

        const transformedData: RoomAllocationData = {
          hostelName: "Mellanby Hall",
          block: data.room.block,
          roomNumber: data.room.roomNumber,
          allocatedAt: new Date('2025-08-28'),
          checkInDate: new Date('2026-01-20'),
          checkOutDate: 'N/A',
          facilities: [
            'Basic lighting and electrical socket',
            'Wi-Fi access (available within the hall)',
            'Access to common areas like reading rooms and TV lounge',
            'Water supply'
          ],
          rules: [
            'No electrical appliances like cookers or irons in rooms.',
            'Hall opens at 5:30 am and closes at midnight.',
            'Keep the hall clean; no throwing water or trash around.',
            'Cooking only in kitchenettes, not in rooms or corridors.'
          ]
        };

        setAllocation(transformedData);
      } catch {
        // Handle other potential errors gracefully by setting allocation to null
        setAllocation(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllocation();
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Loading and Error States
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-muted-foreground">Fetching your room allocation...</p>
      </div>
    )
  }

  // No Allocation State
  if (!allocation) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center space-y-4">
              <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">No Room Allocated Yet</h2>
              <p className="text-muted-foreground mt-2">
                No room has been allocated to you. Please check back later for an update.
              </p>
              <Button
                onClick={() => window.location.href = "/student/status"}
                className="mt-4"
              >
                View Allocation Status
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Main Content (with dynamic data)
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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Room Allocation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div>
              <h1 className="text-3xl font-bold">Room Allocation</h1>
              <p className="text-muted-foreground">Your assigned accommodation details</p>
            </div>
          </div>

          {/* Status Alert */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Room Allocated!</strong> Your accommodation has been successfully assigned.
              Check-in date is {formatDate(allocation.checkInDate)}.
            </AlertDescription>
          </Alert>

          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Room Details
              </CardTitle>
              <CardDescription>Your assigned accommodation information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold">{allocation.hostelName}</p>
                      <p className="text-muted-foreground">Hostel</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-xl font-bold">{allocation.block}</p>
                      <p className="text-xs text-muted-foreground">Block</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-xl font-bold">{allocation.roomNumber}</p>
                      <p className="text-xs text-muted-foreground">Room</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="text-muted-foreground">Allocated:</div>
                      <div className="font-medium">{formatDate(allocation.allocatedAt)}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-muted-foreground">Check-in:</div>
                      <div className="font-medium">{formatDate(allocation.checkInDate)}</div>
                    </div>
                    <div className="col-span-2 space-y-3">
                      <div className="text-muted-foreground">Check-out:</div>
                      <div className="font-medium">{allocation.checkOutDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Allocation Letter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Amenities</CardTitle>
              <CardDescription>Available amenities in your room</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allocation.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{facility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Check-in Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-5 w-5" />
                Check-in Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <div className="space-y-2">
                <p><strong>Check-in Date:</strong> {formatDate(allocation.checkInDate)}</p>
                <p><strong>Check-in Time:</strong> 9:00 AM - 5:00 PM</p>
                <p>
                  <strong>Location:</strong> Mellanby Hall, University of Ibadan, along Mellanby Hall Road, near University Court.
                </p>
                <p className="text-sm mt-4">
                  <strong>Required Items for Check-in:</strong>
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-4">
                  <li>Valid Student ID</li>
                  <li>Hostel Allocation Letter</li>
                  <li>Receipt of Accommodation Fee Payment</li>
                  <li>Medical Certificate (if required)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Hostel Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Hostel Rules & Regulations
              </CardTitle>
              <CardDescription>Important guidelines for hostel residents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocation.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{rule}</span>
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Violation of hostel rules may result in disciplinary action or termination of accommodation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}