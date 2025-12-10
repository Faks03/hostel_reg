"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Download, BarChart3, TrendingUp, Building, Frown } from "lucide-react"
import { DateRange } from "react-day-picker"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import api from "@/utils/api"
import { AxiosError } from 'axios'

// Interface types
interface ReportData {
  roomOccupancy: Array<{ block: string; totalRooms: number; occupiedRooms: number; availableRooms: number; occupancyRate: number }>;
  registrationTrends: Array<{ date: string; pending: number; approved: number; rejected: number; total: number }>;
  levelDistribution: Array<{ level: string; count: number; percentage: number }>;
  allocationSummary: Array<{ block: string; allocated: number; capacity: number }>;
  monthlyRegistrations: Array<{ month: string; registrations: number; allocations: number }>;
}

interface Block {
  id?: string;
  name: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Default blocks fallback
const DEFAULT_BLOCKS: Block[] = [
  { name: 'A' },
  { name: 'B' },
  { name: 'C' },
  { name: 'D' },
  { name: 'E' }
];

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
  const [blocksLoading, setBlocksLoading] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [dateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchFilterData = async () => {
      setBlocksLoading(true);
      try {
        let response;
        const possibleEndpoints = [
          '/admin/blocks',
          '/api/admin/blocks',
          '/blocks',
          '/api/blocks'
        ];

        for (const endpoint of possibleEndpoints) {
          try {
            response = await api.get(endpoint);
            break;
          } catch (endpointError) {
            if (endpointError instanceof AxiosError && endpointError.response?.status !== 404) {
              throw endpointError;
            }
            continue;
          }
        }

        if (response && response.data) {
          let blocksData = response.data;
          
          if (blocksData.data) {
            blocksData = blocksData.data;
          }
          
          if (blocksData.blocks) {
            blocksData = blocksData.blocks;
          }

          if (Array.isArray(blocksData) && blocksData.length > 0) {
            setBlocks(blocksData);
          } else {
            console.warn("Blocks data is not in expected format, using defaults");
          }
        }
      } catch (err) {
        console.error("Failed to fetch blocks:", err);
        
        if (err instanceof AxiosError && err.response?.status === 401) {
          console.warn("Authentication required for blocks endpoint");
        } else if (err instanceof AxiosError && err.response?.status === 403) {
          console.warn("Access forbidden for blocks endpoint");
        } else {
          console.warn("Blocks endpoint not available, using default blocks");
        }
      } finally {
        setBlocksLoading(false);
      }
    };
    
    fetchFilterData();
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          level: selectedLevel,
          block: selectedBlock
        });
        
        if (selectedPeriod === 'custom' && dateRange?.from) {
          params.set('startDate', dateRange.from.toISOString());
          if (dateRange.to) params.set('endDate', dateRange.to.toISOString());
        }

        let response;
        const possibleReportEndpoints = [
          '/reports',
          '/api/reports',
          '/admin/reports',
          '/api/admin/reports'
        ];

        for (const endpoint of possibleReportEndpoints) {
          try {
            response = await api.get<ReportData>(`${endpoint}?${params}`);
            break;
          } catch (endpointError) {
            if (endpointError instanceof AxiosError && endpointError.response?.status !== 404) {
              throw endpointError;
            }
            continue;
          }
        }

        if (!response) {
          throw new Error('Reports endpoint not found');
        }

        setReportData(response.data);

      } catch (err) {
        console.error('Report fetch error:', err);
        
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setError('Authentication required. Please log in.');
          } else if (err.response?.status === 403) {
            setError('Access forbidden. You may not have permission to view reports.');
          } else if (err.response?.status === 404) {
            setError('Reports endpoint not found. Please contact your system administrator.');
          } else {
            setError(err.response?.data?.error || err.message || 'An unexpected error occurred. Please try again.');
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [selectedPeriod, selectedLevel, selectedBlock, dateRange]);

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        period: selectedPeriod,
        level: selectedLevel,
        block: selectedBlock,
        ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange?.to && { endDate: dateRange.to.toISOString() })
      });

      let response;
      const possibleExportEndpoints = [
        '/reports/export',
        '/api/reports/export',
        '/admin/reports/export',
        '/api/admin/reports/export'
      ];

      for (const endpoint of possibleExportEndpoints) {
        try {
          response = await api.get(`${endpoint}?${params}`, {
            responseType: 'blob',
          });
          break;
        } catch (endpointError) {
          if (endpointError instanceof AxiosError && endpointError.response?.status !== 404) {
            throw endpointError;
          }
          continue;
        }
      }

      if (!response) {
        throw new Error('Export endpoint not available');
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostel-report-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export report:', error);
      
      let errorMessage = 'Failed to export report. Please try again.';
      if (error instanceof AxiosError) {
        if (error.response?.status === 404 || error.message === 'Export endpoint not available') {
          errorMessage = 'Export feature is not available. Please contact your system administrator.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication required to export reports.';
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to export reports.';
        } else {
          errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred. Please try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Frown className="h-20 w-20 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Report</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive insights into hostel management and occupancy
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => exportReport('csv')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Customize your report parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Block</label>
                <Select value={selectedBlock} onValueChange={setSelectedBlock} disabled={blocksLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={blocksLoading ? "Loading blocks..." : "Select block"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blocks</SelectItem>
                    {blocks.map((block, index) => (
                      <SelectItem 
                        key={block.name || `block-${index}`} 
                        value={block.name}
                      >
                        Block {block.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {reportData && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.levelDistribution.reduce((sum, level) => sum + level.count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all levels
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Occupancy</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.roomOccupancy.length > 0
                      ? (reportData.roomOccupancy.reduce((sum, block) => sum + block.occupancyRate, 0) / reportData.roomOccupancy.length).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average across blocks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Allocated Students</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.allocationSummary.reduce((sum, block) => sum + block.allocated, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully placed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.allocationSummary.reduce((sum, block) => sum + (block.capacity - block.allocated), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Beds remaining
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Room Occupancy by Block</CardTitle>
                <CardDescription>Current occupancy rates across all hostel blocks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.roomOccupancy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="block" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="occupiedRooms" fill="#0088FE" name="Occupied Rooms" />
                    <Bar dataKey="availableRooms" fill="#00C49F" name="Available Rooms" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Student Distribution by Level</CardTitle>
                  <CardDescription>Breakdown of students across academic levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
  data={reportData.levelDistribution}
  cx="50%"
  cy="50%"
  labelLine={false}
  label={(props) => {
    const { payload } = props; 
    return `${payload.level}L (${payload.percentage}%)`;
  }}
  outerRadius={80}
  fill="#8884d8"
  dataKey="count"
>
  {reportData.levelDistribution.map((_entry, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Pie>
<Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allocation Summary by Block</CardTitle>
                  <CardDescription>Current allocation status across blocks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.allocationSummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="block" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="allocated" fill="#0088FE" name="Allocated" />
                      <Bar dataKey="capacity" fill="#E0E0E0" name="Total Capacity" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Daily registration and approval patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.registrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pending" stroke="#FFBB28" name="Pending" />
                    <Line type="monotone" dataKey="approved" stroke="#00C49F" name="Approved" />
                    <Line type="monotone" dataKey="rejected" stroke="#FF8042" name="Rejected" />
                    <Line type="monotone" dataKey="total" stroke="#0088FE" name="Total" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Registration vs Allocation</CardTitle>
                <CardDescription>Comparison of registrations received and allocations made</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="registrations" fill="#0088FE" name="Registrations" />
                    <Bar dataKey="allocations" fill="#00C49F" name="Allocations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Block Statistics</CardTitle>
                <CardDescription>Comprehensive breakdown of each blocks performance</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium">Block</th>
                        <th className="text-right p-4 font-medium">Total Rooms</th>
                        <th className="text-right p-4 font-medium">Occupied</th>
                        <th className="text-right p-4 font-medium">Available</th>
                        <th className="text-right p-4 font-medium">Occupancy Rate</th>
                        <th className="text-right p-4 font-medium">Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.roomOccupancy.map((block) => (
                        <tr key={block.block} className="border-t">
                          <td className="p-4 font-medium">Block {block.block}</td>
                          <td className="text-right p-4">{block.totalRooms}</td>
                          <td className="text-right p-4">{block.occupiedRooms}</td>
                          <td className="text-right p-4">{block.availableRooms}</td>
                          <td className="text-right p-4">{block.occupancyRate.toFixed(1)}%</td>
                          <td className="text-right p-4">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${block.occupancyRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {block.occupancyRate > 90 ? 'High' :
                                  block.occupancyRate > 70 ? 'Good' :
                                    block.occupancyRate > 50 ? 'Fair' : 'Low'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
