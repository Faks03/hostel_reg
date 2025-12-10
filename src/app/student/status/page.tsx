'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle, Clock, XCircle, AlertCircle, Edit, FileText,
  UserCheck, Home, Loader2, Hash, Send, File, Mail, Phone
} from "lucide-react"
import Link from "next/link"
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
import { useRouter } from "next/navigation"

// Define a type for your hostel registration status data from the backend
interface HostelStatusData {
  applicationId?: string;
  submittedAt?: string; // ISO 8601 string, can be null if not submitted
  updatedAt: string; // ISO 8601 string
  status: 'NOT-SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  roomId?: string; // New field to check for room allocation
  documents?: DocumentData[];
}

interface StatusStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending' | 'rejected'
  completedAt?: string
  rejectionReason?: string
}

interface DocumentData {
  id: number;
  type: string;
  status: 'pending' | 'verified' | 'rejected'; 
}

export default function HostelRegistrationStatus() {
  const [registrationData, setRegistrationData] = useState<HostelStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) {
          router.push("/student/login");
          return;
        }

        const res = await api.get<HostelStatusData>('/hostel/registration');
        const data = res.data;

        // Generate a sample application ID if the backend doesn't provide one
        if (!data.applicationId) {
          const year = new Date().getFullYear();
          const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
          data.applicationId = `HST-${year}-${randomNum}`;
        }
        // Set submittedAt to the current time if it's missing but a submission exists
        if (!data.submittedAt && data.status !== 'NOT-SUBMITTED') {
          data.submittedAt = new Date().toISOString();
        }

        setRegistrationData(data);

      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) {
            // No application found for the user
            setRegistrationData({ status: 'NOT-SUBMITTED', updatedAt: new Date().toISOString() });
          } else if (err.response?.status === 401) {
            // Unauthorized, token expired, etc.
            router.push("/student/login?message=session-expired");
          } else {
            setError("Failed to fetch hostel registration status. Please try again later.");
          }
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [router]);

  // Updated logic for generating timeline steps
const getTimelineSteps = (data: HostelStatusData | null): StatusStep[] => {
  const currentStatus = data?.status;
  const submittedAt = data?.submittedAt;
  const updatedAt = data?.updatedAt;

  const steps: StatusStep[] = [
    { id: 'submission', title: 'Application Submission', description: 'Fill out and submit your hostel application form.', icon: <FileText className="h-5 w-5" />, status: 'pending', completedAt: submittedAt },
    { id: 'verification', title: 'Document Verification', description: 'Documents are being reviewed by administration.', icon: <UserCheck className="h-5 w-5" />, status: 'pending' },
    { id: 'review', title: 'Application Review', description: 'Your application is being reviewed for approval.', icon: <Clock className="h-5 w-5" />, status: 'pending' },
    { id: 'allocation', title: 'Room Allocation', description: '', icon: <Home className="h-5 w-5" />, status: 'pending', completedAt: updatedAt }
  ];

  switch (currentStatus) {
    case 'SUBMITTED':
  steps[0].status = 'completed';
  steps[0].description = 'Your application has been received.';

  // 🔍 Check document statuses
  if (data?.documents?.every(doc => doc.status === 'verified')) {
    steps[1].status = 'completed';
    steps[1].description = 'All documents have been verified.';

    // ✅ If documents are verified, move application review forward
    steps[2].status = 'completed';
    steps[2].description = 'Your application has been accepted.';
  } else if (data?.documents?.some(doc => doc.status === 'rejected')) {
    steps[1].status = 'rejected';
    steps[1].description = 'One or more documents were rejected.';
    steps[2].status = 'pending';
  } else {
    steps[1].status = 'current';
    steps[1].description = 'Documents are being reviewed.';
    steps[2].status = 'pending'; // Wait until docs are verified
  }

  if (data?.roomId) {
    steps[3].status = 'completed';
    steps[3].description = 'A hostel room and bed have been assigned to you.';
  } else {
    steps[3].status = 'pending';
    steps[3].description = 'Awaiting room and bed assignment.';
  }
  break;


    case 'REJECTED':
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      steps[2].status = 'rejected';
      steps[2].rejectionReason = data?.rejectionReason || 'Please review your application and resubmit.';
      steps[3].description = 'Room allocation not possible for rejected applications.';
      break;

    case 'NOT-SUBMITTED':
    default:
      steps[0].status = 'current';
      steps[3].description = 'Room allocation will be available once you submit your application.';
      break;
  }

  return steps;
};

  const steps = getTimelineSteps(registrationData);

  const getStatusColor = (status: StatusStep['status'], stepId: string) => {
    switch (status) {
      case 'completed':
        // Special case for Room Allocation based on roomId
        if (stepId === 'allocation' && registrationData?.roomId) {
          return 'text-green-600 bg-green-100';
        }
        return 'text-green-600 bg-green-100';
      case 'current': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

const getCurrentStatusText = (steps: StatusStep[], status: HostelStatusData['status'] | undefined, roomId?: string): string => {
  if (!status || status === 'NOT-SUBMITTED') return 'Not Submitted';
  if (status === 'REJECTED') return 'Action Required';
  if (status === 'APPROVED') {
    return roomId ? 'Room Allocated' : 'Approved';
  }
  if (status === 'SUBMITTED') {
    return roomId ? 'Room Allocated' : 'Submitted';
  }
  const currentStep = steps.find(step => step.status === 'current');
  return currentStep ? currentStep.title : 'Under Review';
};


  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
    });
  };

const getProgressValue = (steps: StatusStep[]): number => {
  if (!steps || steps.length === 0) return 0;

  // Count completed steps
  const completedSteps = steps.filter(step => step.status === "completed").length;

  // Progress = (completed steps / total steps) * 100
  return Math.round((completedSteps / steps.length) * 100);
};



  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-red-500">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4">{error}</p>
      </div>
    );
  }

  const overallProgress = getProgressValue(steps);
  const currentStatusText = getCurrentStatusText(steps, registrationData?.status, registrationData?.roomId);


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
                <BreadcrumbItem><BreadcrumbLink href="/student/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Hostel Status</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Hostel Registration Status</h1>
                <p className="text-muted-foreground">Track the progress of your hostel application.</p>
              </div>
            </div>
          </div>

          {/* Conditional Action Cards */}
          {registrationData?.status === 'NOT-SUBMITTED' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>You have not submitted a hostel application yet. Click the button below to begin.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/student/registration">
                    <FileText className="mr-2 h-4 w-4" /> Start Application
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {registrationData?.status === 'REJECTED' && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
                <CardDescription>Your application was rejected. Please review the feedback and resubmit your application.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="destructive">
                  <Link href="/student/registration">
                    <Edit className="mr-2 h-4 w-4" /> Review and Resubmit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {registrationData?.status === 'APPROVED' && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Congratulations!</CardTitle>
                <CardDescription>Your hostel application has been approved. Further details about your room allocation will be sent to you.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Application Overview Card */}
          {registrationData && registrationData.status !== 'NOT-SUBMITTED' && (
            <Card>
              <CardHeader>
                <CardTitle>Application Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  {registrationData.applicationId && (
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Application ID</p>
                        <p className="font-medium">{registrationData.applicationId}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Current Status</p>
                      <p className="font-medium">{currentStatusText}</p>
                    </div>
                  </div>
                  {/* The submitted date row has been removed */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{formatDateTime(registrationData.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <Label htmlFor="progress">Progress ({overallProgress}% Complete)</Label>
                  <Progress id="progress" value={overallProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Actions Card */}
          {registrationData?.status !== 'APPROVED' && registrationData?.status !== 'NOT-SUBMITTED' && (
            <Card>
              <CardHeader>
                <CardTitle>What you can do next</CardTitle>
                <CardDescription>Use the links below to manage your application.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="flex flex-col h-auto p-4 items-start text-left">
                  <Link href="/student/hostel-registration">
                    <Edit className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Edit Application</span>
                    <span className="text-muted-foreground font-normal text-sm">Update your information.</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex flex-col h-auto p-4 items-start text-left">
                  <Link href="/student/upload">
                    <File className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Manage Documents</span>
                    <span className="text-muted-foreground font-normal text-sm">Review or upload new files.</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Detailed Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className="relative flex items-start">
                    {stepIdx < steps.length - 1 && (<div className="absolute left-5 top-10 -ml-px mt-1 w-0.5 h-full bg-gray-300" aria-hidden="true" />)}
                    <div className="flex-shrink-0 z-10">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusColor(step.status, step.id)}`}>
                        {step.status === 'completed' && step.id !== 'allocation' ? <CheckCircle className="h-6 w-6" /> : step.icon}
                        {step.status === 'completed' && step.id === 'allocation' && registrationData?.roomId ? <CheckCircle className="h-6 w-6" /> : null}
                        {step.status === 'completed' && step.id === 'allocation' && !registrationData?.roomId ? <XCircle className="h-6 w-6" /> : null}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-lg">{step.title}</h4>
                      <p className="text-muted-foreground">{step.description}</p>
                      {step.status === 'completed' && step.completedAt && (
                        <p className="text-sm text-green-600 mt-1">Completed: {formatDateTime(step.completedAt)}</p>
                      )}
                      {step.status === 'current' && (
                        <p className="text-sm text-blue-600 mt-1">In Progress...</p>
                      )}
                      {step.status === 'rejected' && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-semibold text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{step.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* New Important Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-1 text-green-500" />
                <p>You will receive email notifications for major status updates.</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 flex-shrink-0 mt-1 text-blue-500" />
                <p>Document verification typically takes 3-5 business days.</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 flex-shrink-0 mt-1 text-orange-500" />
                <p>Ensure all uploaded documents are clear and legible to avoid delays.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}