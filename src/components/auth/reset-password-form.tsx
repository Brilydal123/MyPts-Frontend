"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation"; // For navigation and URL params
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils"; // Assuming shadcn/ui setup
import { Eye, EyeOff } from "lucide-react"; // Import eye icons

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Toast import removed - using simple text messages instead

// Import API URL from constants
import { API_URL } from "@/lib/constants";

// Define the validation schema using Zod
const formSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Set the error on the confirm password field
});

type ResetPasswordFormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get("token") : null;
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Password reset token is missing or invalid.");
      setIsLoading(false);
      return;
    }

    console.log("Submitting password reset for token:", token);
    console.log("New password length:", values.newPassword.length);
    console.log("Request payload:", JSON.stringify({
      token: token,
      password: values.newPassword
    }));

    try {
      // --- API Call ---
      console.log('Submitting to:', `${API_URL}/auth/reset-password`);
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: values.newPassword, // Changed from newPassword to password to match backend expectations
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password.");
      }

      setSuccess("Password has been reset successfully! You can now log in with your new password.");
      form.reset(); // Clear the form
      // Optionally redirect to login page after a delay
      // setTimeout(() => router.push('/login'), 3000);

    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Display message if token is invalid or missing early
  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>The password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Please request a new password reset link.</p>
          {/* Optionally link back to forgot password page */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it's secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {success && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-green-600">{success}</p>
                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push('/login')}
                >
                  Back to Login
                </Button>
              </div>
            )}

            {!success && (
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
