'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Filter, Download, ArrowLeft, ArrowRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import axios from "axios"
import api from "@/utils/api"

interface Student {
    id: string
    firstName: string
    lastName: string
    matricNumber: string
    level: string
    phoneNumber: string
    email: string
    status: 'Submitted' | 'Unregistered' | 'NOT-SUBMITTED'
    submissionDate: string
    documentsVerified: boolean
}

export default function ViewRegistrations() {
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [levelFilter, setLevelFilter] = useState<string>('all')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [statusFilter, setStatusFilter] = useState("submitted"); 

    useEffect(() => {
        fetchStudents()
    }, [])

    useEffect(() => {
        filterStudents()
        setCurrentPage(1);
    }, [students, searchTerm, statusFilter, levelFilter])

    const fetchStudents = async () => {
        try {
            // Use the Axios instance to make the GET request
            // The request interceptor in api.ts will automatically add the JWT token.
            const response = await api.get('/students/registrations/status');

            if (response.status === 200) {
                setStudents(response.data)
            } else {
                console.error('Failed to fetch students:', response.statusText);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error:', error.response?.data || error.message);
            } else {
                console.error('Failed to fetch students:', error);
            }
        } finally {
            setLoading(false)
        }
    }

    const filterStudents = () => {
        let filtered = students

        if (searchTerm) {
            filtered = filtered.filter(student =>
                student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(student =>
                student.status.toLowerCase() === statusFilter.toLowerCase()
            )
        }

        if (levelFilter !== 'all') {
            filtered = filtered.filter(student =>
                student.level?.toString() === levelFilter.toString()
            )
        }

        setFilteredStudents(filtered)
    }

    const exportData = () => {
        const csvContent = [
            ['Name', 'Matric Number', 'Level', 'Status', 'Email', 'Phone', 'Submission Date'].join(','),
            ...filteredStudents.map(student => [
                `"${student.firstName} ${student.lastName}"`,
                student.matricNumber,
                student.level,
                student.status,
                student.email,
                student.phoneNumber,
                new Date(student.submissionDate).toLocaleDateString()
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'registrations.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'submitted': return 'default'
            case 'unregistered': return 'secondary'
            case 'not-submitted': return 'destructive'
            default: return 'outline'
        }
    }

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentStudents = filteredStudents.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        )
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
                        <BreadcrumbPage>Registrations</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Student Registrations</h2>
                        <p className="text-muted-foreground">
                            Manage and review all student registration applications.
                        </p>
                    </div>
                    <Button onClick={exportData} variant="outline" className="w-full md:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter & Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="search" className="text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search name or matric..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger id="status-filter">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="unregistered">Unregistered</SelectItem>
                                        <SelectItem value="not-submitted">Not Submitted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="level-filter" className="text-sm font-medium">Level</label>
                                <Select value={levelFilter} onValueChange={setLevelFilter}>
                                    <SelectTrigger id="level-filter">
                                        <SelectValue placeholder="Select Level" />
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
                        </div>
                    </CardContent>
                </Card>

                {/* Students Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Matric Number</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submission Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentStudents.length > 0 ? (
                                    currentStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">
                                                {student.firstName} {student.lastName}
                                            </TableCell>
                                            <TableCell>{student.matricNumber}</TableCell>
                                            <TableCell>{student.level} Level</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(student.status)}>
                                                    {student.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(student.submissionDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedStudent(student)}
                                                            aria-label="View student details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-bold">
                                                                {selectedStudent?.firstName} {selectedStudent?.lastName}
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Matric No: {selectedStudent?.matricNumber}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-4">
                                                            {/* Personal Information Section */}
                                                            <div className="space-y-2">
                                                                <h3 className="text-lg font-semibold text-gray-700">Personal Information</h3>
                                                                <Separator />
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                                                                        <span className="text-base">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                                                                        <span className="text-base">{selectedStudent?.email}</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-muted-foreground">Phone Number</span>
                                                                        <span className="text-base">{selectedStudent?.phoneNumber}</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-muted-foreground">Level</span>
                                                                        <span className="text-base">{selectedStudent?.level} Level</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Registration Status Section */}
                                                            <div className="space-y-2">
                                                                <h3 className="text-lg font-semibold text-gray-700">Registration Status</h3>
                                                                <Separator />
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                                                                        <Badge variant={getStatusBadgeVariant(selectedStudent?.status || 'outline')} className="w-fit text-sm">
                                                                            {selectedStudent?.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No registrations found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 py-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                            </Button>
                            <span className="text-sm font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </>
    )
}