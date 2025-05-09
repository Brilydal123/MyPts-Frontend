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
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { countries } from "@/lib/countries";
import { authApi } from "@/lib/api/auth-api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import ReferralService from "@/services/referralService";
import { Loader2 } from "lucide-react";

// Animated ellipsis component
function AnimatedEllipsis() {
  return (
    <span className="inline-flex ml-1">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        .
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
      >
        .
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }}
      >
        .
      </motion.span>
    </span>
  );
}

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
  wasReferred: z.boolean().optional(),
  referralCode: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Referral code must be at least 6 characters if provided",
    }),
});

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [referralAnswer, setReferralAnswer] = useState<"yes" | "no">("no");
  const [isValidatingReferralCode, setIsValidatingReferralCode] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateOfBirth: undefined,
      countryOfResidence: "",
      wasReferred: false,
      referralCode: "",
    },
  });

  // Watch referral code for validation
  const referralCode = form.watch("referralCode");

  // Handle referral code validation
  useEffect(() => {
    // If user manually enters a referral code and the field wasn't empty before
    if (referralCode && referralCode.length > 0 && referralAnswer !== "yes") {
      console.log("User manually entered a referral code, setting referralAnswer to yes");
      setReferralAnswer("yes");
    }

    // Debounced validation of the referral code
    if (referralCode && referralCode.length >= 6 && referralAnswer === "yes") {
      // Clear any previous errors
      form.clearErrors("referralCode");

      // Set a small delay before validating to avoid too many API calls
      const timer = setTimeout(() => {
        console.log("Validating referral code:", referralCode);
        setIsValidatingReferralCode(true);

        ReferralService.validateReferralCode(referralCode)
          .then(result => {
            if (result.valid) {
              console.log("Referral code is valid:", referralCode);
              // Clear any errors
              form.clearErrors("referralCode");
            } else {
              console.warn("Invalid referral code:", referralCode);
              // Set error
              form.setError("referralCode", {
                type: "manual",
                message: "Invalid referral code. Please check and try again."
              });
            }
          })
          .catch(error => {
            console.error("Error validating referral code:", error);
          })
          .finally(() => {
            setIsValidatingReferralCode(false);
          });
      }, 800); // 800ms debounce

      return () => clearTimeout(timer);
    }
  }, [referralCode, referralAnswer, form]);

  useEffect(() => {
    // Check for token in localStorage (this is set during social auth)
    const accessToken = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    const isGoogleAuthFlow = localStorage.getItem("googleAuthFlow") === "true";

    // Check for pending referral code from social auth
    const pendingReferralCode = localStorage.getItem("pendingReferralCode");

    console.log("CompleteProfile: Auth state check", {
      isLoading,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      hasUserData: !!userData,
      isGoogleAuthFlow,
      pendingReferralCode
    });

    // If we're in the Google auth flow, we're definitely authenticated
    if (isGoogleAuthFlow) {
      console.log("CompleteProfile: In Google auth flow, skipping auth check");
      // Clear the flag after we've used it
      localStorage.removeItem("googleAuthFlow");

      // If there's a pending referral code, set it in the form
      if (pendingReferralCode) {
        console.log("CompleteProfile: Found pending referral code:", pendingReferralCode);
        setReferralAnswer("yes");
        form.setValue("wasReferred", true);
        form.setValue("referralCode", pendingReferralCode);

        // Validate the referral code
        ReferralService.validateReferralCode(pendingReferralCode)
          .then(result => {
            if (result.valid) {
              console.log("Referral code is valid:", pendingReferralCode);
              form.clearErrors("referralCode");
            } else {
              console.warn("Invalid referral code:", pendingReferralCode);
              form.setError("referralCode", {
                type: "manual",
                message: "Invalid referral code. Please check and try again."
              });
            }
          })
          .catch(error => {
            console.error("Error validating referral code:", error);
          });

        // Clear the pending referral code after using it
        localStorage.removeItem("pendingReferralCode");
      }
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
  }, [user, isAuthenticated, isLoading, router, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Format date to ISO string for API
      const formattedDate = values.dateOfBirth.toISOString();

      // Prepare update data
      const updateData: any = {
        dateOfBirth: formattedDate,
        countryOfResidence: values.countryOfResidence,
      };

      // Add referral information if user was referred
      if (referralAnswer === "yes" && values.referralCode) {
        // Validate referral code before submitting
        try {
          const validationResult = await ReferralService.validateReferralCode(values.referralCode);

          if (!validationResult.valid) {
            form.setError("referralCode", {
              type: "manual",
              message: "Invalid referral code. Please check and try again.",
            });
            toast.error("Invalid referral code", {
              description: "The referral code you entered is not valid. Please check and try again.",
            });
            setIsSubmitting(false);
            return;
          }

          // Add valid referral code to update data
          updateData.referralCode = values.referralCode;
          updateData.wasReferred = true;
        } catch (error) {
          console.error("Error validating referral code:", error);
          form.setError("referralCode", {
            type: "manual",
            message: "Error validating referral code. Please try again.",
          });
          toast.error("Error validating referral code", {
            description: "We encountered an error while validating your referral code. Please try again.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      console.log("Submitting profile update:", updateData);

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
          body: JSON.stringify(updateData)
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
              if (updateData.referralCode) {
                parsedUser.referralCode = updateData.referralCode;
                parsedUser.wasReferred = true;
              }
              localStorage.setItem("user", JSON.stringify(parsedUser));
            }

            // Make sure we have the refresh token stored
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken && directData.tokens?.refreshToken) {
              console.log("Storing refresh token from response");
              localStorage.setItem("refreshToken", directData.tokens.refreshToken);

              // Also set in cookie for better compatibility
              document.cookie = `refreshtoken=${directData.tokens.refreshToken}; path=/; max-age=2592000`; // 30 days
            }

            // Update access token if provided
            if (directData.tokens?.accessToken) {
              console.log("Updating access token from response");
              localStorage.setItem("accessToken", directData.tokens.accessToken);

              // Also set in cookie for better compatibility
              document.cookie = `accesstoken=${directData.tokens.accessToken}; path=/; max-age=86400`; // 1 day
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
      const response = await authApi.updateProfile(updateData);

      if (response.success) {
        toast.success("Profile updated successfully");

        // Update local user data
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            parsedUser.dateOfBirth = formattedDate;
            parsedUser.countryOfResidence = values.countryOfResidence;
            if (updateData.referralCode) {
              parsedUser.referralCode = updateData.referralCode;
              parsedUser.wasReferred = true;
            }
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }

          // Store tokens in localStorage if provided
          if (response.data?.tokens?.accessToken) {
            console.log("Storing new access token from API client response");
            localStorage.setItem("accessToken", response.data.tokens.accessToken);

            // Also set in cookie for better compatibility
            document.cookie = `accesstoken=${response.data.tokens.accessToken}; path=/; max-age=3600`; // 1 hour
          }

          if (response.data?.tokens?.refreshToken) {
            console.log("Storing new refresh token from API client response");
            localStorage.setItem("refreshToken", response.data.tokens.refreshToken);

            // Also set in cookie for better compatibility
            document.cookie = `refreshtoken=${response.data.tokens.refreshToken}; path=/; max-age=2592000`; // 30 days
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading<AnimatedEllipsis /></p>
        </div>
      </div>
    );
  }

  // Direct handler functions for referral buttons
  const handleYesClick = () => {
    console.log("YES button clicked, setting referralAnswer to yes");
    setReferralAnswer("yes");
    form.setValue("wasReferred", true);
  };

  const handleNoClick = () => {
    console.log("NO button clicked, setting referralAnswer to no");
    setReferralAnswer("no");
    form.setValue("wasReferred", false);
    form.setValue("referralCode", "");
  };

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
              {/* Referral Question */}
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium">Did someone refer you?</p>
                <div className="flex justify-center space-x-4">
                  <Button
                    type="button"
                    variant={referralAnswer === "yes" ? "default" : "outline"}
                    onClick={handleYesClick}
                    className="w-full rounded-full"
                  >
                    YES
                  </Button>
                  <Button
                    type="button"
                    variant={referralAnswer === "no" ? "default" : "outline"}
                    onClick={handleNoClick}
                    className="w-full rounded-full"
                  >
                    NO
                  </Button>
                </div>
              </div>

              {/* Referral Code Field (conditionally rendered) */}
              <AnimatePresence>
                {referralAnswer === "yes" && (
                  <motion.div
                    key="referral-code-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code</FormLabel>
                          <FormControl>
                            <FloatingLabelInput
                              label="Enter Referral Code"
                              {...field}
                              className={`rounded-md ${isValidatingReferralCode ? 'checking' : ''} ${referralCode
                                ? form.formState.errors.referralCode
                                  ? "border-red-300"
                                  : "border-green-300"
                                : ""
                                }`}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

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
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving<AnimatedEllipsis />
                  </span>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
