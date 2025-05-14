"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { socialAuthApi } from "@/lib/api/social-auth-api";
import { toast } from "sonner";
import axios from "axios";

export function GoogleAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to check if user is admin and redirect if needed
    const checkAdminAndRedirect = async (token: string) => {
      try {
        console.log("GoogleAuthCallback: Checking if user is admin via API");

        // Make a direct request to our admin check API
        const adminCheckResponse = await fetch('/api/auth/check-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (adminCheckResponse.ok) {
          const adminData = await adminCheckResponse.json();

          if (adminData.isAdmin) {
            console.log("GoogleAuthCallback: User is admin (confirmed by API), redirecting to admin dashboard IMMEDIATELY");

            // Store the token in localStorage
            localStorage.setItem("accessToken", token);

            // Store admin status in localStorage
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRole', 'admin');

            // Set admin cookies
            document.cookie = `isAdmin=true; path=/; max-age=2592000; SameSite=Lax`;
            document.cookie = `X-User-Role=admin; path=/; max-age=2592000; SameSite=Lax`;

            // Redirect directly to admin dashboard with a hard redirect
            window.location.href = "/admin";
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
    };

    // Function to extract referral code from URL
    const extractReferralCode = () => {
      if (!searchParams) return null;

      // Check for referral code in URL parameters
      const refCode = searchParams.get('ref');
      if (refCode) {
        console.log("GoogleAuthCallback: Referral code found in URL:", refCode);
        return refCode;
      }

      return null;
    };

    const fetchUserData = async (token: string) => {
      try {
        // First, check if user is admin and redirect if needed
        const isAdmin = await checkAdminAndRedirect(token);
        if (isAdmin) {
          return; // Stop processing if user is admin
        }

        console.log("GoogleAuthCallback: Fetching user data with token");

        console.log("GoogleAuthCallback: Setting tokens in storage and headers");

        // Store the token in localStorage and cookies for middleware
        localStorage.setItem("accessToken", token);

        // Set cookie with various options to ensure it's accessible
        document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `accesstoken=${token}; path=/; max-age=3600; SameSite=Lax`; // Lowercase version

        // Set the token in the API client
        socialAuthApi.setToken(token);

        // Set custom headers for the API client
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        axios.defaults.headers.common["x-token-verified"] = "true";
        axios.defaults.headers.common["x-access-token"] = token;

        // Set a flag to indicate we're in the Google auth flow
        localStorage.setItem("googleAuthFlow", "true");

        // Check for referral code in URL
        const referralCode = extractReferralCode();
        if (referralCode) {
          // Store referral code in localStorage to use it in the complete-profile page
          localStorage.setItem("pendingReferralCode", referralCode);
          console.log("GoogleAuthCallback: Stored referral code in localStorage:", referralCode);
        }

        // Fetch user data
        const response = await socialAuthApi.getCurrentUser();

        if (response.success && response.user) {
          console.log("GoogleAuthCallback: User data fetched successfully", response.user);

          // Check if user is admin FIRST - before doing anything else
          const isAdmin = response.user.role === 'admin' || response.user.isAdmin === true;

          if (isAdmin) {
            console.log("GoogleAuthCallback: User is admin, redirecting to admin dashboard IMMEDIATELY");

            // Store admin status in localStorage
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRole', 'admin');

            // Store user data in localStorage
            localStorage.setItem("user", JSON.stringify(response.user));

            // Store country information separately for easier access
            if (response.user.countryOfResidence) {
              localStorage.setItem("userCountry", response.user.countryOfResidence);
              console.log(`Stored admin user country in localStorage: ${response.user.countryOfResidence}`);

              // Also store in a cookie for cross-page access
              document.cookie = `userCountry=${encodeURIComponent(response.user.countryOfResidence)}; path=/; max-age=2592000; SameSite=Lax`;
            }

            // If user has a default profile, store the ID
            if (response.user.profileId) {
              localStorage.setItem("selectedProfileId", response.user.profileId);
            }

            // Redirect directly to admin dashboard with a hard redirect
            // This is more immediate than router.replace
            window.location.href = "/admin";
            return;
          }

          // For non-admin users, continue with normal flow
          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(response.user));

          // Store country information separately for easier access
          if (response.user.countryOfResidence) {
            localStorage.setItem("userCountry", response.user.countryOfResidence);
            console.log(`Stored user country in localStorage: ${response.user.countryOfResidence}`);

            // Also store in a cookie for cross-page access
            document.cookie = `userCountry=${encodeURIComponent(response.user.countryOfResidence)}; path=/; max-age=2592000; SameSite=Lax`;
          }

          // If user has a default profile, store the ID but don't set the token yet
          // The profile token will be generated when the user selects a profile
          if (response.user.profileId) {
            localStorage.setItem("selectedProfileId", response.user.profileId);
            // We don't set selectedProfileToken here anymore
          }

          // Check if user needs to complete their profile
          const needsProfileCompletion = !response.user.dateOfBirth || !response.user.countryOfResidence;

          if (needsProfileCompletion) {
            console.log("GoogleAuthCallback: User needs to complete profile");
            // Redirect to complete profile page
            router.replace("/complete-profile");
          } else {
            // Redirect to select profile page
            router.replace("/select-profile");
          }
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

    const handleCallback = async () => {
      if (error) {
        console.error("GoogleAuthCallback: Error in callback", error);
        toast.error("Login failed. Please try again.");
        router.replace("/login");
      } else if (success === "true" && token) {
        console.log("GoogleAuthCallback: Success with token, checking admin status first");

        // Check for referral code in URL
        const referralCode = extractReferralCode();
        if (referralCode) {
          console.log("GoogleAuthCallback: Found referral code in URL:", referralCode);
        }

        // First check if user is admin and redirect if needed
        const isAdmin = await checkAdminAndRedirect(token);
        if (isAdmin) {
          // If user is admin, we've already redirected
          return;
        }

        // If not admin, continue with normal flow
        console.log("GoogleAuthCallback: Not admin, continuing with normal flow");
        fetchUserData(token);
      } else {
        console.error("GoogleAuthCallback: Invalid callback parameters");
        toast.error("Login failed. Please try again.");
        router.replace("/login");
      }
    };

    if (searchParams) {
      handleCallback();
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
