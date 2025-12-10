"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Zap, Play, Download, CheckCircle, AlertCircle, Clock } from "lucide-react"
import api from "@/utils/api" // Import the centralized API utility
import axios from 'axios' // Import axios to use the type guard

interface AllocationStatus {
  isRunning: boolean
  progress: number
  currentStep: string
  startTime?: string
  estimatedCompletion?: string
}

interface AllocationResult {
  id: string
  timestamp: string
  status: 'completed' | 'partial' | 'failed'
  studentsAllocated: number
  studentsUnallocated: number
  totalStudents: number
  errors: string[]
  conflicts: Array<{
    studentId: string
    studentName: string
    issue: string
  }>
  allocations: Array<{
    studentId: string
    studentName: string
    matricNumber: string
    block: string
    roomNumber: string
  }>
}

interface PreAllocationCheck {
  approvedStudents: number
  availableSpaces: number
  canAllocateAll: boolean
  warnings: string[]
  blockAvailability: Array<{
    block: string
    availableSpaces: number
    estimatedStudents: number
  }>
}

export default function TriggerAllocation() {
  const [allocationStatus, setAllocationStatus] = useState<AllocationStatus>({
    isRunning: false,
    progress: 0,
    currentStep: ''
  })
  const [lastResult, setLastResult] = useState<AllocationResult | null>(null)
  const [preCheck, setPreCheck] = useState<PreAllocationCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const [preCheckResponse, lastResultResponse, statusResponse] = await Promise.all([
          api.get('/allocation/pre-check').catch(() => ({ data: null })),
          api.get('/allocation/last-result').catch(() => ({ data: null })),
          api.get('/allocation/status').catch(() => ({ data: null }))
        ])

        if (preCheckResponse.data) {
          setPreCheck(preCheckResponse.data)
        }

        if (lastResultResponse.data) {
          setLastResult(lastResultResponse.data)
        }

        if (statusResponse.data) {
          setAllocationStatus(statusResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
        setError('Failed to load allocation data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    let statusInterval: NodeJS.Timeout | null = null

    const startPolling = () => {
      statusInterval = setInterval(async () => {
        try {
          const response = await api.get('/allocation/status')
          if (response.data) {
            setAllocationStatus(response.data)

            if (!response.data.isRunning && statusInterval) {
              clearInterval(statusInterval)
              statusInterval = null
              await fetchLastResult()
              await fetchPreAllocationCheck()
            }
          }
        } catch (error) {
          console.error('Failed to check status:', error)
        }
      }, 2000)
    }

    if (allocationStatus.isRunning) {
      startPolling()
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    }
  }, [allocationStatus.isRunning])

  const fetchPreAllocationCheck = async () => {
    try {
      const response = await api.get('/allocation/pre-check')
      if (response.data) {
        setPreCheck(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch pre-allocation check:', error)
    }
  }

  const fetchLastResult = async () => {
    try {
      const response = await api.get('/allocation/last-result')
      if (response.data) {
        setLastResult(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch last result:', error)
    }
  }

  const startAllocation = async () => {
    try {
      setError(null)
      await api.post('/allocation/start')
      
      setAllocationStatus({
        isRunning: true,
        progress: 0,
        currentStep: 'Initializing allocation process...'
      })
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      console.error('Failed to start allocation:', error)
      let errorMessage = 'Failed to start allocation process';

      // Use a type guard to safely check the error type
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage)
    }
  }

  const downloadAllocationReport = async (format: 'csv' | 'pdf') => {
    if (!lastResult) return

    try {
      const response = await api.get(`/allocation/report/${lastResult.id}`, {
        params: { format },
        responseType: 'blob'
      })

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf'
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `allocation-report-${lastResult.id}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download report:', error)
      setError('Failed to download report')
    }
  }

  const getResultBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'partial': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const canStartAllocation = preCheck && preCheck.approvedStudents > 0 && !allocationStatus.isRunning

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pre-Allocation Check */}
      {preCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Pre-Allocation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{preCheck.approvedStudents}</div>
                <div className="text-sm text-muted-foreground">Approved Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{preCheck.availableSpaces}</div>
                <div className="text-sm text-muted-foreground">Available Spaces</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${preCheck.canAllocateAll ? 'text-green-600' : 'text-orange-600'}`}>
                  {preCheck.canAllocateAll ? '✓' : '⚠'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {preCheck.canAllocateAll ? 'Can Allocate All' : 'Partial Allocation'}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {preCheck.warnings && preCheck.warnings.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-orange-600">Warnings</h4>
                {preCheck.warnings.map((warning, index) => (
                  <Alert key={index} variant="default" className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Block Availability */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Block Availability</h4>
              {preCheck.blockAvailability.map((block) => (
                <div key={block.block} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Block {block.block}</span>
                  <div className="text-right">
                    <div className="text-sm">{block.availableSpaces} spaces available</div>
                    <div className="text-xs text-muted-foreground">
                      ~{block.estimatedStudents} students expected
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Allocation Control
          </CardTitle>
          <CardDescription>
            Start the room allocation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocationStatus.isRunning ? (
            <div className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Allocation in Progress</AlertTitle>
                <AlertDescription>
                  {allocationStatus.currentStep}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{allocationStatus.progress}%</span>
                </div>
                <Progress value={allocationStatus.progress} className="w-full" />
              </div>

              {allocationStatus.startTime && (
                <p className="text-sm text-muted-foreground">
                  Started at: {new Date(allocationStatus.startTime).toLocaleTimeString()}
                </p>
              )}

              {allocationStatus.estimatedCompletion && (
                <p className="text-sm text-muted-foreground">
                  Estimated completion: {new Date(allocationStatus.estimatedCompletion).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={startAllocation}
                disabled={!canStartAllocation}
                className="w-full h-12"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Room Allocation
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                This will run the CSP algorithm to optimally assign students to available rooms
              </p>

              {!canStartAllocation && preCheck && (
                <p className="text-sm text-orange-600 text-center">
                  {preCheck.approvedStudents === 0
                    ? "No approved students available for allocation"
                    : "Allocation process is currently running"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Allocation Results */}
      {lastResult && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="conflicts">Issues & Conflicts</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Last Allocation Results</CardTitle>
                    <CardDescription>
                      Completed on {new Date(lastResult.timestamp).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getResultBadgeVariant(lastResult.status)}>
                    {lastResult.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{lastResult.studentsAllocated}</div>
                    <div className="text-sm text-muted-foreground">Students Allocated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{lastResult.studentsUnallocated}</div>
                    <div className="text-sm text-muted-foreground">Students Unallocated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{lastResult.totalStudents}</div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {lastResult.totalStudents > 0
                        ? ((lastResult.studentsAllocated / lastResult.totalStudents) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadAllocationReport('csv')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button
                    onClick={() => downloadAllocationReport('pdf')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Allocations</CardTitle>
                <CardDescription>
                  {lastResult.studentsAllocated} students successfully allocated to rooms
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Matric Number</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Room Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastResult.allocations.slice(0, 50).map((allocation) => (
                      <TableRow key={allocation.studentId}>
                        <TableCell className="font-medium">{allocation.studentName}</TableCell>
                        <TableCell>{allocation.matricNumber}</TableCell>
                        <TableCell>Block {allocation.block}</TableCell>
                        <TableCell>{allocation.roomNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {lastResult.allocations.length > 50 && (
                  <div className="p-4 text-center text-sm text-muted-foreground border-t">
                    Showing 50 of {lastResult.allocations.length} allocations.
                    Download the full report for complete data.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issues & Conflicts</CardTitle>
                <CardDescription>
                  Problems encountered during the allocation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastResult.errors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-red-600">System Errors</h4>
                    {lastResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {lastResult.conflicts.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Student Conflicts</h4>
                    <div className="space-y-2">
                      {lastResult.conflicts.map((conflict) => (
                        <div key={conflict.studentId} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{conflict.studentName}</p>
                              <p className="text-sm text-muted-foreground">{conflict.issue}</p>
                            </div>
                            <Badge variant="outline">Unallocated</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-medium mb-2">No Conflicts Found</h3>
                    <p className="text-muted-foreground">
                      All students were processed without conflicts.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}