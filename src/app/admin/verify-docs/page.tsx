"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Eye, Download, FileText, Image, AlertCircle, Filter, Search } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_BASE_URL = 'http://localhost:5000/api'

type DocumentObject = {
  url: string;
  verified: boolean | null;
};

type DocumentKey = 'passportPhoto' | 'schoolFeesReceipt' | 'accommodationReceipt';

interface StudentDocument {
  id: string
  firstName: string
  lastName: string
  matricNumber: string
  level: string | number;
  email: string
  submissionDate: string
  documents: {
    passportPhoto?: DocumentObject;
    schoolFeesReceipt?: DocumentObject;
    accommodationReceipt?: DocumentObject;
  };
  overallDocumentStatus: 'pending' | 'verified' | 'rejected'
}

type FilterType = 'all' | 'pending' | 'verified' | 'rejected';
type LevelFilterType = 'all' | '100' | '200' | '300' | '400';

export default function VerifyDocuments() {
  const [students, setStudents] = useState<StudentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [levelFilter, setLevelFilter] = useState<LevelFilterType>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    fetchPendingDocuments()
  }, [])

  const fetchPendingDocuments = async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('No authentication token found')
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`${API_BASE_URL}/documents/pending`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      } else {
        console.error('Failed to fetch pending documents:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Failed to fetch pending documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyDocument = async (
    studentId: string,
    documentType: DocumentKey,
    status: 'verified' | 'rejected'
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${API_BASE_URL}/documents/verify/${studentId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          documentType,
          status,
        }),
      });

      if (response.ok) {
        setStudents(prev =>
          prev.map(student => {
            if (student.id === studentId) {
              const updatedStudent = { ...student };
              const doc = updatedStudent.documents[documentType];

              if (doc) {
                doc.verified = status === 'verified';
              }

              const allDocs = Object.values(updatedStudent.documents).filter(Boolean) as DocumentObject[];
              const allVerified = allDocs.length > 0 && allDocs.every(d => d.verified === true);
              const anyRejected = allDocs.some(d => d.verified === false);

              updatedStudent.overallDocumentStatus = allVerified
                ? 'verified'
                : anyRejected
                  ? 'rejected'
                  : 'pending';

              return updatedStudent;
            }
            return student;
          })
        );
      } else {
        const errorText = await response.text();
        console.error('Failed to verify document:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to verify document:', error);
    }
  };

  const updateStudentDocuments = async (
    studentId: string,
    status: 'verified' | 'rejected'
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const documentTypes = Object.keys(student.documents) as DocumentKey[];

    try {
      await Promise.all(
        documentTypes.map(docType => verifyDocument(studentId, docType, status))
      );
    } catch (error) {
      console.error('Failed to update student documents:', error);
    }
  };

  const getDocumentStatus = (document: DocumentObject | undefined): string => {
    if (!document) return 'missing';
    if (document.verified === true) return 'verified';
    if (document.verified === false) return 'rejected';
    return 'pending';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      case 'missing': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default: return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const filteredStudents = [...students]
    .filter(student => {
      // Filter by overall status
      const statusMatch = activeFilter === 'all' || student.overallDocumentStatus === activeFilter;

      // Filter by level
      const levelMatch = levelFilter === 'all' || String(student.level) === levelFilter;

      // Filter by search term (name or matric number only)
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const studentName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const studentMatric = String(student.matricNumber).toLowerCase();
      const searchMatch = searchTerm.trim() === '' || studentName.includes(lowerCaseSearchTerm) || studentMatric.includes(lowerCaseSearchTerm);

      return statusMatch && levelMatch && searchMatch;
    })
    .sort((a, b) => {
      if (activeFilter === 'all') {
        if (a.overallDocumentStatus === 'pending' && b.overallDocumentStatus !== 'pending') {
          return -1;
        }
        if (a.overallDocumentStatus !== 'pending' && b.overallDocumentStatus === 'pending') {
          return 1;
        }
      }
      return 0;
    });

  const statusCounts = {
    all: students.length,
    pending: students.filter(s => s.overallDocumentStatus === 'pending').length,
    verified: students.filter(s => s.overallDocumentStatus === 'verified').length,
    rejected: students.filter(s => s.overallDocumentStatus === 'rejected').length,
  };

  const DocumentDialog = ({ student, documentType, document }: {
    student: StudentDocument,
    documentType: DocumentKey,
    document: DocumentObject
  }) => {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {documentType === 'passportPhoto' ? 'Passport Photo' :
              documentType === 'schoolFeesReceipt' ? 'School Fees Receipt' :
                'Accommodation Receipt (Hall Dues)'}
          </DialogTitle>
          <DialogDescription>
            {student.firstName} {student.lastName} - {student.matricNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 text-center">
            {documentType === 'passportPhoto' ? (
              <img
                src={document.url}
                alt="Passport Photo"
                className="max-w-full max-h-96 mx-auto rounded"
              />
            ) : (
              <div className="py-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-500 mb-4">Document preview not available</p>
                <Button variant="outline" asChild>
                  <a href={document.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Open Document
                  </a>
                </Button>
              </div>
            )}
          </div>

          {getDocumentStatus(document) === 'pending' && (
            <div className="flex gap-2">
              <Button
                onClick={() => verifyDocument(student.id, documentType, 'verified')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => verifyDocument(student.id, documentType, 'rejected')}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const levels = ['100', '200', '300', '400'];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Documents</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Document Verification</h2>
          <p className="text-muted-foreground">
            Review and verify uploaded student documents
          </p>
        </div>

        {/* Filter and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-lg">Filter & Search</CardTitle>
            </div>
            <CardDescription>Filter and search students by status, level, name, or matric number</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Level Filter on the same row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
              {/* Level Dropdown Filter */}
              <div className="flex-1 min-w-[150px]">
                <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as LevelFilterType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map(level => (
                      <SelectItem key={level} value={level}>{level} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or matric number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('all')}
                className="h-12 flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">All ({statusCounts.all})</span>
              </Button>
              <Button
                variant={activeFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('pending')}
                className="h-12 flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Pending ({statusCounts.pending})</span>
              </Button>
              <Button
                variant={activeFilter === 'verified' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('verified')}
                className="h-12 flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Verified ({statusCounts.verified})</span>
              </Button>
              <Button
                variant={activeFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('rejected')}
                className="h-12 flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4"
              >
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Rejected ({statusCounts.rejected})</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students with Documents */}
        <div className="space-y-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <Card key={student.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {index + 1}. {student.firstName} {student.lastName}
                      </CardTitle>
                      <CardDescription>
                        {student.matricNumber} • {student.level} Level • Submitted {new Date(student.submissionDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(student.overallDocumentStatus)}>
                      {student.overallDocumentStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Passport Photo */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        <span className="text-sm font-medium">Passport Photo</span>
                        {getStatusIcon(getDocumentStatus(student.documents.passportPhoto))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {student.documents.passportPhoto ? (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DocumentDialog
                                student={student}
                                documentType="passportPhoto"
                                document={student.documents.passportPhoto}
                              />
                            </Dialog>
                            {getDocumentStatus(student.documents.passportPhoto) === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => verifyDocument(student.id, 'passportPhoto', 'verified')}
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => verifyDocument(student.id, 'passportPhoto', 'rejected')}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">Not uploaded</Badge>
                        )}
                      </div>
                    </div>

                    {/* School Fees Receipt */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">School Fees Receipt</span>
                        {getStatusIcon(getDocumentStatus(student.documents.schoolFeesReceipt))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {student.documents.schoolFeesReceipt ? (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DocumentDialog
                                student={student}
                                documentType="schoolFeesReceipt"
                                document={student.documents.schoolFeesReceipt}
                              />
                            </Dialog>
                            <Button variant="outline" size="sm" asChild>
                              <a href={student.documents.schoolFeesReceipt.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                            {getDocumentStatus(student.documents.schoolFeesReceipt) === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => verifyDocument(student.id, 'schoolFeesReceipt', 'verified')}
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => verifyDocument(student.id, 'schoolFeesReceipt', 'rejected')}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">Not uploaded</Badge>
                        )}
                      </div>
                    </div>

                    {/* Accommodation Receipt */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Accommodation Receipt</span>
                        {getStatusIcon(getDocumentStatus(student.documents.accommodationReceipt))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {student.documents.accommodationReceipt ? (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DocumentDialog
                                student={student}
                                documentType="accommodationReceipt"
                                document={student.documents.accommodationReceipt}
                              />
                            </Dialog>
                            <Button variant="outline" size="sm" asChild>
                              <a href={student.documents.accommodationReceipt.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                            {getDocumentStatus(student.documents.accommodationReceipt) === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => verifyDocument(student.id, 'accommodationReceipt', 'verified')}
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => verifyDocument(student.id, 'accommodationReceipt', 'rejected')}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">Not uploaded</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {student.overallDocumentStatus === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        onClick={() => updateStudentDocuments(student.id, 'verified')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve All Documents
                      </Button>
                      <Button
                        onClick={() => updateStudentDocuments(student.id, 'rejected')}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject All Documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                {students.length === 0 ? (
                  <>
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-medium mb-2">All documents verified!</h3>
                    <p className="text-muted-foreground">
                      There are no pending documents to review at this time.
                    </p>
                  </>
                ) : (
                  <>
                    <Filter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No documents found</h3>
                    <p className="text-muted-foreground">
                      No documents match the current filter or search criteria.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}