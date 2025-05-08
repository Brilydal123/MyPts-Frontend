"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/responsive-date-picker";
import { CountrySelector } from "@/components/ui/country-selector";
import { countries } from "@/lib/countries";
import { authApi } from "@/lib/api/auth-api";
import { useAuth } from "@/hooks/use-auth";

// Schema for the form
const formSchema = z.object({
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine(date => {
    // Check if user is at least 18 years old
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return date <= eighteenYearsAgo;
  }, "You must be at least 18 years old to use this platform"),
  countryOfResidence: z.string({
    required_error: "Country of residence is required",
  }).min(1, "Country of residence is required"),
});

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateOfBirth: undefined,
      countryOfResidence: "",
    },
  });

  useEffect(() => {
    // Check for token in localStorage (this is set during social auth)
    const accessToken = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    const isGoogleAuthFlow = localStorage.getItem("googleAuthFlow") === "true";

    console.log("CompleteProfile: Auth state check", {
      isLoading,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      hasUserData: !!userData,
      isGoogleAuthFlow
    });

    // If we're in the Google auth flow, we're definitely authenticated
    if (isGoogleAuthFlow) {
      console.log("CompleteProfile: In Google auth flow, skipping auth check");
      // Clear the flag after we've used it
      localStorage.removeItem("googleAuthFlow");
    }
    // If we have no authentication at all, redirect to login
    else if (!isLoading && !isAuthenticated && !accessToken && !userData) {
      console.log("CompleteProfile: No authentication detected, redirecting to login");
      router.push("/login");
      return;
    }

    // If user data is available (either from hook or localStorage), check if profile is complete
    const userObj = user || (userData ? JSON.parse(userData) : null);

    if (userObj) {
      const missing: string[] = [];

      if (!userObj.dateOfBirth) {
        missing.push("dateOfBirth");
      }

      if (!userObj.countryOfResidence) {
        missing.push("countryOfResidence");
      }

      setMissingFields(missing);

      // If no missing fields, redirect to dashboard
      if (missing.length === 0) {
        console.log("Profile is complete, redirecting to select-profile");
        router.push("/select-profile");
      } else {
        console.log("Profile is incomplete, staying on complete-profile page", missing);
      }
    } else {
      console.log("No user data available yet");
    }
  }, [user, isAuthenticated, isLoading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Format date to ISO string for API
      const formattedDate = values.dateOfBirth.toISOString();

      console.log("Submitting profile update:", {
        dateOfBirth: formattedDate,
        countryOfResidence: values.countryOfResidence
      });

      // Get token from localStorage
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("No access token found in localStorage");
        toast.error("Authentication error. Please try logging in again.");
        router.push("/login");
        return;
      }

      // First try direct API call with fetch
      try {
        console.log("Attempting direct API call");
        const directResponse = await fetch("/api/auth/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "x-token-verified": "true",
            "x-access-token": accessToken
          },
          body: JSON.stringify({
            dateOfBirth: formattedDate,
            countryOfResidence: values.countryOfResidence,
          })
        });

        const directData = await directResponse.json();

        if (directData.success) {
          console.log("Direct API call successful:", directData);

          // Update local user data
          if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
              const parsedUser = JSON.parse(userData);
              parsedUser.dateOfBirth = formattedDate;
              parsedUser.countryOfResidence = values.countryOfResidence;
              localStorage.setItem("user", JSON.stringify(parsedUser));
            }
          }

          toast.success("Profile updated successfully");

          // Redirect to select profile page
          router.push("/select-profile");
          return;
        } else {
          console.warn("Direct API call failed, falling back to auth API:", directData);
        }
      } catch (directError) {
        console.warn("Direct API call error, falling back to auth API:", directError);
      }

      // Fall back to using the auth API client
      const response = await authApi.updateProfile({
        dateOfBirth: formattedDate,
        countryOfResidence: values.countryOfResidence,
      });

      if (response.success) {
        toast.success("Profile updated successfully");

        // Update local user data
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            parsedUser.dateOfBirth = formattedDate;
            parsedUser.countryOfResidence = values.countryOfResidence;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        }

        // Redirect to select profile page
        router.push("/select-profile");
      } else {
        console.error("Profile update failed:", response);
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide the following information to complete your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {missingFields.includes("dateOfBirth") && (
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <div className="text-xs text-muted-foreground mb-1">
                        You must be at least 18 years old to use this platform
                      </div>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Date of Birth (18+ years old)"
                          disabled={isSubmitting}
                          minAge={18} // Enforce minimum age of 18
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {missingFields.includes("countryOfResidence") && (
                <FormField
                  control={form.control}
                  name="countryOfResidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Residence</FormLabel>
                      <FormControl>
                        <CountrySelector
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Country of Residence"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
