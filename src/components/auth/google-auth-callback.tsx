"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { socialAuthApi } from "@/lib/api/social-auth-api";
import { toast } from "sonner";

export function GoogleAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async (token: string) => {
      try {
        console.log("GoogleAuthCallback: Fetching user data with token");

        // Store the token in localStorage
        localStorage.setItem("accessToken", token);

        // Set the token in the API client
        socialAuthApi.setToken(token);

        // Fetch user data
        const response = await socialAuthApi.getCurrentUser();

        if (response.success && response.user) {
          console.log("GoogleAuthCallback: User data fetched successfully", response.user);

          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(response.user));

          // If user has a default profile, store it
          if (response.user.profileId) {
            localStorage.setItem("selectedProfileId", response.user.profileId);
            localStorage.setItem("selectedProfileToken", token);
          }

          // Redirect to select profile page
          router.replace("/select-profile");
        } else {
          console.error("GoogleAuthCallback: Failed to fetch user data", response);
          toast.error("Failed to complete login. Please try again.");
          router.replace("/login");
        }
      } catch (error) {
        console.error("GoogleAuthCallback: Error fetching user data", error);
        toast.error("Failed to complete login. Please try again.");
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    if (!searchParams) return;

    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const token = searchParams.get("token");

    console.log("GoogleAuthCallback: Processing callback", { error, success, token: token ? "exists" : "missing" });

    if (error) {
      console.error("GoogleAuthCallback: Error in callback", error);
      toast.error("Login failed. Please try again.");
      router.replace("/login");
    } else if (success === "true" && token) {
      console.log("GoogleAuthCallback: Success with token, fetching user data");
      fetchUserData(token);
    } else {
      console.error("GoogleAuthCallback: Invalid callback parameters");
      toast.error("Login failed. Please try again.");
      router.replace("/login");
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing login...</p>
        </div>
      </div>
    );
  }

  return null;
}
