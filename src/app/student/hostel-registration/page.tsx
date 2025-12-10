'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, FileText, Send, Edit } from "lucide-react"

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

// Define a type for your form data
interface HostelRegistrationData {
  matricNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  level: string;
  preferredBlock: string;
  specialRequests: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

// Define your status types based on the new names
type RegistrationStatus = 'NOT-SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export default function StudentRegistration() {
  const [formData, setFormData] = useState<HostelRegistrationData>({
    matricNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    level: "",
    preferredBlock: "",
    specialRequests: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('NOT-SUBMITTED');
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // This useEffect hook is the main logic that runs on page load and handles persistence from the database.
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) {
          router.push("/student");
          return;
        }

        // 1. Fetch student's profile data to pre-fill the form
        const profileRes = await api.get('/students/profile');
        const profileData = profileRes.data;

        setFormData(prev => ({
          ...prev,
          matricNumber: profileData.matricNumber,
          firstName: profileData.firstname,
          lastName: profileData.lastname,
          email: profileData.email,
          phone: profileData.phone || '',
          department: profileData.department,
          level: String(profileData.level),
        }));

        // 2. Check for an existing hostel registration
        try {
          const registrationRes = await api.get('/hostel/registration');
          const registrationData = registrationRes.data;

          if (registrationData) {
            setFormData(prev => ({
              ...prev,
              preferredBlock: registrationData.preferredBlock || "",
              specialRequests: registrationData.specialRequests || "",
              emergencyContactName: registrationData.emergencyContactName,
              emergencyContactPhone: registrationData.emergencyContactPhone,
              emergencyContactRelation: registrationData.emergencyContactRelation || "",
            }));

            // CRITICAL STEP: Set the status from the backend to persist on refresh.
            const statusFromDb = registrationData.status.toUpperCase() as RegistrationStatus;
            setRegistrationStatus(statusFromDb);

            // Determine if the form should be editable based on the status from the backend.
            if (statusFromDb === 'SUBMITTED' || statusFromDb === 'APPROVED') {
              setIsEditing(false); // If submitted/approved, disable editing.
            } else if (statusFromDb === 'REJECTED' || statusFromDb === 'NOT-SUBMITTED') {
              setIsEditing(true); // If rejected/not-submitted, allow editing.
            }
          }
        } catch (err: unknown) {
          // If the API returns a 404, it means no registration exists yet.
          if (err instanceof AxiosError && err.response?.status === 404) {
            setRegistrationStatus('NOT-SUBMITTED');
            setIsEditing(true); // Allow a new user to fill out the form.
          } else {
            setFetchError("Failed to load existing registration data.");
          }
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setFetchError(err.response?.data?.error || "Failed to load profile data.");
        } else {
          setFetchError("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [router]);


  const departments = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Engineering",
    "Economics",
    "Business Administration"
  ];

  const levels = ["100", "200", "300", "400", "500"];
  
  // New arrays for dropdown options
  const preferredBlocks = ["Block A", "Block B", "Block C", "Block D"];
  const emergencyContactRelations = ["Parent", "Guardian", "Sibling", "Spouse", "Friend", "Other"];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.matricNumber) newErrors.matricNumber = "Matric number is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.level) newErrors.level = "Level is required";
    if (!formData.emergencyContactName) newErrors.emergencyContactName = "Emergency contact name is required";
    if (!formData.emergencyContactPhone) newErrors.emergencyContactPhone = "Emergency contact phone is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFetchError(null); // Clear any previous submission errors

    try {
      // 1. Prepare and submit the Student Profile payload
      const profilePayload = {
        firstname: formData.firstName,
        lastname: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        level: Number(formData.level), // Ensure level is a number
      };

      // Call the profile update API using PUT
      await api.put('/students/profile', profilePayload);

      // 2. Prepare and submit the Hostel Registration payload
      const registrationPayload = {
        matricNumber: formData.matricNumber,
        preferredBlock: formData.preferredBlock,
        specialRequests: formData.specialRequests,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelation: formData.emergencyContactRelation,
      };

      // Decide whether to POST (new registration) or PUT (update existing)
      if (registrationStatus === 'NOT-SUBMITTED' || registrationStatus === 'REJECTED') {
        await api.post('/hostel/register', registrationPayload); // Create new registration
        setRegistrationStatus('SUBMITTED');
      } else {
        await api.put('/hostel/registration', registrationPayload); // Update existing registration
      }

      setIsEditing(false); // Lock the form after successful submission
      alert("Profile and registration updated successfully!");
    } catch (error) {
      console.error("Submission failed:", error);
      if (error instanceof AxiosError && error.response) {
        setFetchError(error.response.data.error || "Failed to submit registration. Please try again.");
      } else {
        setFetchError("An unexpected error occurred during submission.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFetchError(null); // Clear any previous errors when entering edit mode
  };

  const getStatusBadge = () => {
    switch (registrationStatus) {
      case 'SUBMITTED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />SUBMITTED</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />APPROVED</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />REJECTED</Badge>;
      default:
        return <Badge variant="outline">NOT-SUBMITTED</Badge>;
    }
  };

  // The form is disabled if it's not in editing mode
  const isFormDisabled = !isEditing;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div>Loading registration data...</div>
      </div>
    );
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
                  <BreadcrumbPage>Registration</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Hostel Registration</h1>
                <p className="text-muted-foreground">Complete your hostel accommodation application</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {/* The Edit button is shown when the form is not editable and a submitted status exists. */}
                {(registrationStatus === 'SUBMITTED' || registrationStatus === 'REJECTED' || registrationStatus === 'APPROVED') && !isEditing && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {fetchError && (
              <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {fetchError}
              </AlertDescription>
            </Alert>
          )}

          {registrationStatus === 'SUBMITTED' && !isEditing && ( // Only show if submitted and not actively editing
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Submitted</AlertTitle>
              <AlertDescription>
                Your registration has been submitted successfully. It is currently under review.
                <span className="ml-2">Click Edit if you need to make changes.</span>
              </AlertDescription>
            </Alert>
          )}

          {registrationStatus === 'APPROVED' && !isEditing && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Approved!</AlertTitle>
              <AlertDescription>
                Your hostel registration has been approved. You will receive further instructions shortly.
              </AlertDescription>
            </Alert>
          )}

          {registrationStatus === 'REJECTED' && !isEditing && ( // Only show if rejected and not actively editing
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Rejected</AlertTitle>
              <AlertDescription>
                Your registration was rejected. Please review and update your information before resubmitting.
              </AlertDescription>
            </Alert>
          )}

          {isEditing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are now in **editing mode**. Make your changes and click Submit Registration to save them.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Enter your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricNumber">Matric Number *</Label>
                    <Input
                      id="matricNumber"
                      value={formData.matricNumber}
                      onChange={(e) => handleInputChange('matricNumber', e.target.value)}
                      className={errors.matricNumber ? "border-red-500" : ""}
                      placeholder="e.g., CSC/2021/001"
                      disabled={isFormDisabled}
                    />
                    {errors.matricNumber && (
                      <p className="text-sm text-red-500">{errors.matricNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                      placeholder="your.email@student.edu.ng"
                      disabled={isFormDisabled}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? "border-red-500" : ""}
                      disabled={isFormDisabled}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? "border-red-500" : ""}
                      disabled={isFormDisabled}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={errors.phone ? "border-red-500" : ""}
                      placeholder="+234 803 123 4567"
                      disabled={isFormDisabled}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>Your academic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)} disabled={isFormDisabled}>
                      <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <p className="text-sm text-red-500">{errors.department}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)} disabled={isFormDisabled}>
                      <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>{level} Level</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.level && (
                      <p className="text-sm text-red-500">{errors.level}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hostel Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Hostel Preferences</CardTitle>
                <CardDescription>Choose your preferred accommodation (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredBlock">Preferred Block</Label>
                    {/* Replaced Input with Select */}
                    <Select
                      value={formData.preferredBlock}
                      onValueChange={(value) => handleInputChange('preferredBlock', value)}
                      disabled={isFormDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a block" />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredBlocks.map((block) => (
                          <SelectItem key={block} value={block}>{block}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Any special accommodation needs or requests..."
                    rows={3}
                    disabled={isFormDisabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Provide emergency contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      className={errors.emergencyContactName ? "border-red-500" : ""}
                      disabled={isFormDisabled}
                    />
                    {errors.emergencyContactName && (
                      <p className="text-sm text-red-500">{errors.emergencyContactName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      className={errors.emergencyContactPhone ? "border-red-500" : ""}
                      placeholder="+234 803 123 4567"
                      disabled={isFormDisabled}
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-sm text-red-500">{errors.emergencyContactPhone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelation">Relationship</Label>
                    {/* Replaced Input with Select */}
                    <Select
                      value={formData.emergencyContactRelation}
                      onValueChange={(value) => handleInputChange('emergencyContactRelation', value)}
                      disabled={isFormDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {emergencyContactRelations.map((relation) => (
                          <SelectItem key={relation} value={relation}>{relation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            {(isEditing || registrationStatus === 'NOT-SUBMITTED') && (
              <div className="flex justify-end gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Registration
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}