"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";

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

// Validation schema for the email field
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    console.log("Submitting forgot password request for email:", values.email);

    try {
      console.log('Submitting to:', `${API_URL}/auth/forgot-password`);
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      });

      const result = await response.json(); // Attempt to parse JSON regardless of status

      if (!response.ok) {
        // Use the message from the backend if available, otherwise a generic error
        throw new Error(result?.message || `Server responded with status: ${response.status}`);
      }

      // Backend should send a success message, even if it doesn't confirm email existence for security
      setSuccess(result?.message || "If an account exists for this email, a password reset link has been sent.");
      form.reset(); // Clear the form

    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      // Clear success message if an error occurs
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Forgot Your Password?</CardTitle>
        <CardDescription>
          Enter your email address below and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {/* Display success message only when not loading and no error exists */}
            {success && !isLoading && !error && <p className="text-sm font-medium text-green-600">{success}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
