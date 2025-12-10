'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, File, CheckCircle, AlertCircle, X, Download, Loader2, Edit } from "lucide-react"
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

interface DocumentFile {
    id: number
    name: string
    fileName: string
    file?: File
    status: 'pending' | 'verified' | 'rejected'
    rejectionReason?: string
    uploadedAt: string
    type: string
    fileSize: number
    mimeType: string
    fileUrl?: string
}

interface DocumentCategory {
    id: string
    title: string
    description: string
    required: boolean
    maxFiles: number
    acceptedFormats: string[]
    maxSize: number // in MB
    files: DocumentFile[]
    apiType: string // Maps to backend document type
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL

// Function to decode JWT and get student ID
const getStudentIdFromToken = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.studentId || payload.id || payload.sub;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Alternative: Fetch current user info from API
const getCurrentStudent = async () => {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const userData = await handleResponse(response);
        return userData.id || userData.studentId;
    } catch (error) {
        console.error('Error fetching current student:', error);
        return null;
    }
};

async function handleResponse(response: Response) {
    const responseText = await response.text();

    if (response.ok) {
        try {
            return JSON.parse(responseText);
        } catch {
            return {};
        }
    }

    let errorData;
    try {
        errorData = JSON.parse(responseText);
    } catch (jsonError) {
        console.error('API Error (non-JSON response):', responseText);
        throw new Error(`Server responded with a non-JSON error (Status: ${response.status})`);
    }

    throw new Error(
        (typeof errorData === 'object' && (errorData.error || errorData.message)) ||
        `Server Error: ${response.status} ${response.statusText}`
    );
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'verified':
            return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
        case 'pending':
            return <Badge className="bg-blue-100 text-blue-800"><Upload className="w-3 h-3 mr-1" />Pending</Badge>
        case 'rejected':
            return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>
        default:
            return <Badge variant="outline">Unknown</Badge>
    }
}

const DocumentCategoryCard = ({ category, studentId, onUpdateDocuments, onAddFilesToCategory, onRemoveFileFromCategory, setError, allowEditing }: {
    category: DocumentCategory
    studentId: number
    onUpdateDocuments: () => void
    onAddFilesToCategory: (categoryId: string, newFiles: DocumentFile[]) => void
    onRemoveFileFromCategory: (categoryId: string, fileId: number) => void
    setError: (message: string | null) => void
    allowEditing: boolean
}) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const fileArray = Array.from(files)
        const oversizedFiles = fileArray.filter(file => file.size > category.maxSize * 1024 * 1024)

        if (oversizedFiles.length > 0) {
            setError(`Files exceed maximum size of ${category.maxSize}MB: ${oversizedFiles.map(f => f.name).join(', ')}`)
            return
        }

        if (category.files.length + fileArray.length > category.maxFiles) {
            setError(`Cannot upload more than ${category.maxFiles} file${category.maxFiles > 1 ? 's' : ''} for ${category.title}`)
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData()

            fileArray.forEach((file) => {
                formData.append('documents', file)
            })
            formData.append(`type_documents`, category.apiType)

            const response = await fetch(`${API_BASE}/documents/upload/${studentId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            })

            const uploadedFiles: DocumentFile[] = await handleResponse(response)

            onAddFilesToCategory(category.id, uploadedFiles)

        } catch (err) {
            console.error('Upload error:', err)
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const removeFile = async (fileId: number) => {
        try {
            const response = await fetch(`${API_BASE}/documents/delete/${fileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            await handleResponse(response)

            onRemoveFileFromCategory(category.id, fileId)
        } catch (err) {
            console.error('Delete error:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete document')
        }
    }

    const downloadFile = (fileId: number) => {
        const downloadUrl = `${API_BASE}/documents/download/${fileId}`
        window.open(downloadUrl, '_blank')
    }

    return (
        <Card key={category.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {category.title}
                            {category.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                            {category.maxFiles > 1 && <span className="text-xs text-primary font-semibold">(multiple)</span>}
                        </CardTitle>
                        <CardDescription className="mt-1">{category.description}</CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                            Accepted formats: {category.acceptedFormats.join(', ')} | Max size: {category.maxSize}MB | Max files: {category.maxFiles}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="text-center space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                            <label htmlFor={`file-${category.id}`} className="cursor-pointer">
                                <span className="text-sm font-medium text-primary hover:underline">Click to upload</span>
                                <span className="text-sm text-muted-foreground"> or drag and drop</span>
                            </label>
                            <input
                                id={`file-${category.id}`}
                                type="file"
                                multiple={category.maxFiles > 1}
                                accept={category.acceptedFormats.join(',')}
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                disabled={category.files.length >= category.maxFiles || isUploading || !allowEditing}
                            />
                        </div>
                        {(category.files.length >= category.maxFiles || !allowEditing) && (
                            <p className="text-xs text-muted-foreground">Maximum number of files reached or editing is disabled</p>
                        )}
                    </div>
                </div>
                {isUploading && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Uploading files...</span>
                    </div>
                )}
                {category.files.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Uploaded Files</h4>
                        <div className="space-y-2">
                            {category.files.map((file, idx) => (
                                <div key={file.id ? file.id : `${file.name}-${idx}`} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <File className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" title={file.fileName || file.name}>
                                                {file.fileName || file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(file.uploadedAt).toLocaleDateString()} • {Math.round(file.fileSize / 1024)} KB
                                            </p>
                                            {file.status === 'rejected' && file.rejectionReason && (
                                                <p className="text-xs text-red-600 mt-1">{file.rejectionReason}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(file.status)}
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => downloadFile(file.id)} title="Download">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            {allowEditing && file.status !== 'verified' && (
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-800" onClick={() => removeFile(file.id)} title="Remove">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function UploadDocuments() {
    const [studentId, setStudentId] = useState<number | null>(null);
    const [localStorageKey, setLocalStorageKey] = useState<string>('');

    const [documents, setDocuments] = useState<DocumentCategory[]>([
        { id: 'passport-photos', title: 'Passport Photograph', description: 'Upload a recent passport photograph', required: true, maxFiles: 1, acceptedFormats: ['.jpg', '.jpeg', '.png'], maxSize: 2, files: [], apiType: 'passport photo' },
        { id: 'school-fees', title: 'School Fees Receipt', description: 'Current session school fees payment receipt', required: true, maxFiles: 1, acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'], maxSize: 5, files: [], apiType: 'fee receipt' },
        { id: 'accommodation-receipt', title: 'Accommodation Receipt', description: 'Hostel accommodation fee payment receipt (Hall Dues)', required: true, maxFiles: 1, acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'], maxSize: 5, files: [], apiType: 'hall dues' }
    ])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false)

    // ✅ Helper to check verification
    const allDocumentsVerified = () => {
        return documents.every(category =>
            category.files.length > 0 && category.files.every(file => file.status === "verified")
        )
    }

    useEffect(() => {
        const initializeStudent = async () => {
            setLoading(true);

            let currentStudentId = getStudentIdFromToken();

            if (!currentStudentId) {
                currentStudentId = await getCurrentStudent();
            }

            if (currentStudentId) {
                setStudentId(currentStudentId);
                const storageKey = `student-${currentStudentId}-submission-success`;
                setLocalStorageKey(storageKey);

                if (typeof window !== 'undefined') {
                    setSubmissionSuccess(localStorage.getItem(storageKey) === 'true');
                }
            } else {
                setError('Unable to identify current student. Please try logging in again.');
                setLoading(false);
            }
        };

        initializeStudent();
    }, []);

    const handleAddFilesToCategory = useCallback((categoryId: string, newFiles: DocumentFile[]) => {
        setDocuments(prevDocs => prevDocs.map(category => {
            if (category.id === categoryId) {
                const updatedFiles = category.maxFiles === 1 ? newFiles : [...category.files, ...newFiles];
                return { ...category, files: updatedFiles };
            }
            return category;
        }));
    }, []);

    const handleRemoveFileFromCategory = useCallback((categoryId: string, fileId: number) => {
        setDocuments(prevDocs => prevDocs.map(category => {
            if (category.id === categoryId) {
                const updatedFiles = category.files.filter(file => file.id !== fileId);
                return { ...category, files: updatedFiles };
            }
            return category;
        }));
    }, []);

    const fetchExistingDocuments = useCallback(async () => {
        if (!studentId) return;

        setError(null)
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem('token') : null
            const response = await fetch(`${API_BASE}/documents/my-documents/${studentId}`, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            })
            const existingDocs: DocumentFile[] = await handleResponse(response)

            setDocuments(prevDocs => prevDocs.map(category => ({
                ...category,
                files: existingDocs
                    .filter(doc => typeof doc.type === "string" && doc.type.toLowerCase() === category.apiType.toLowerCase())
                    .map(doc => ({
                        ...doc,
                        name: doc.fileName,
                        uploadedAt: new Date(doc.uploadedAt).toISOString()
                    }))
            })))
        } catch (err) {
            console.error('Error fetching documents:', err)
            setError(err instanceof Error ? err.message : 'Failed to load existing documents')
        } finally {
            setLoading(false)
        }
    }, [studentId])

    useEffect(() => {
        if (studentId) {
            fetchExistingDocuments()
        }
    }, [fetchExistingDocuments, studentId])

    const allRequiredUploaded = () => {
        return documents.filter(doc => doc.required).every(doc => doc.files.length > 0)
    }

    const submitAllDocuments = async () => {
        if (!studentId) {
            setError('Student ID not available');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const documentsToSubmit = documents.flatMap(cat =>
                cat.files.map(file => ({
                    type: cat.apiType,
                    fileName: file.fileName || file.name,
                    mimeType: file.mimeType,
                    fileSize: file.fileSize,
                    fileUrl: file.fileUrl
                }))
            );

            const response = await fetch(`${API_BASE}/registration/apply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documents: documentsToSubmit })
            });

            await handleResponse(response);

            setSubmissionSuccess(true);
            if (localStorageKey) {
                localStorage.setItem(localStorageKey, 'true');
            }
            fetchExistingDocuments()

        } catch (err) {
            console.error('Submission error:', err);
            setError(err instanceof Error ? err.message : 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleEditClick = () => {
        setIsEditing(true)
        setSubmissionSuccess(false)
        if (localStorageKey) {
            localStorage.removeItem(localStorageKey)
        }
    }

    if (loading || !studentId) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex flex-1 flex-col">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        {error && <p className="ml-2 text-red-600">{error}</p>}
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
                    <div className="flex flex-col gap-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbPage>Upload Documents</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div>
                            <h1 className="text-3xl font-bold">Upload Documents</h1>
                            <p className="text-muted-foreground">Submit your required documents for verification.</p>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* ✅ Success / Verified Alerts */}
                    {submissionSuccess && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {allDocumentsVerified() ? (
                                <>
                                    <AlertTitle className="text-green-800">VERIFIED</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        All documents have been successfully verified!
                                    </AlertDescription>
                                </>
                            ) : (
                                <>
                                    <AlertTitle className="text-green-800">SUBMITTED</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        All documents have been submitted successfully for verification! You will be notified once the review process is complete.
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={handleEditClick}
                                    >
                                        <Edit className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                </>
                            )}
                        </Alert>
                    )}

                    <div className="space-y-6">
                        {documents.map(category => (
                            <DocumentCategoryCard
                                key={category.id}
                                category={category}
                                studentId={studentId as number}
                                onUpdateDocuments={fetchExistingDocuments}
                                onAddFilesToCategory={handleAddFilesToCategory}
                                onRemoveFileFromCategory={handleRemoveFileFromCategory}
                                setError={setError}
                                allowEditing={isEditing || !submissionSuccess}
                            />
                        ))}
                    </div>

                    {/* ✅ Hide button row once everything is verified */}
                    {!allDocumentsVerified() && (
                        <div className="flex justify-end pt-4">
                            <Button
                                size="lg"
                                disabled={!allRequiredUploaded() || isSubmitting || submissionSuccess}
                                className="px-8"
                                onClick={submitAllDocuments}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit All Documents
                            </Button>
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}