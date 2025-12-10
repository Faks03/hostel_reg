'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { AxiosError } from "axios";

export function StudentLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [matric, setMatric] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matric || !email) return alert("Enter matric number and email");

    try {
      // Call backend login API
      const res = await api.post("/auth/student/login", { matricNumber: matric, email });

      // Save token and studentId
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("studentId", res.data.student.id);

      // Redirect to student dashboard
      router.push("/student/dashboard");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        // Handle Axios-specific errors
        console.log(err.response?.data?.error)
        alert(err.response?.data?.error || "Login failed");
        
      } else {
        // Handle other types of errors (e.g., network issues)
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Student Login</CardTitle>
          <CardDescription>
            Enter your matric number and email to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              {/* Matric Number */}
              <div className="grid gap-3">
                <Label htmlFor="matric">Matric Number</Label>
                <Input
                  id="matric"
                  type="text"
                  placeholder="e.g., 196XXX"
                  value={matric}
                  onChange={(e) => setMatric(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Login Button */}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return alert("Please enter email and password.");

    try {
      const res = await api.post("/auth/admin/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminId", res.data.admin.id);
      router.push("/admin/dashboard");
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.error || "Login failed");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}