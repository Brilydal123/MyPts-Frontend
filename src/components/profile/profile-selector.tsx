"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { profileApi } from "@/lib/api/profile-api";
import { userApi } from "@/lib/api/user-api";
import { socialAuthApi } from "@/lib/api/social-auth-api";
// Removed unused import: import { myPtsApi } from '@/lib/api/mypts-api';
import { Coins, Check } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion, AnimatePresence } from "framer-motion";

// Interface for profile data
interface ProfileData {
  id: string;
  name: string;
  description?: string;
  profileType?: string;
  accessToken?: string;
  balance?: number;
  formattedBalance?: string;
  isLoadingBalance?: boolean;
}

// Helper function to format profile data
const formatProfileData = (profile: any): ProfileData => {
  console.log("Formatting profile data:", JSON.stringify(profile, null, 2));

  return {
    id: profile._id || profile.id,
    name: profile.name === 'Untitled Profile' && profile.username ? profile.username : profile.name,
    description: profile.description || "",
    profileType: profile.profileType || (profile.type?.subtype || "personal"),
    accessToken: profile.accessToken || "",
    balance: profile.balance?.balance || profile.balanceInfo?.balance || 0,
    formattedBalance: profile.formattedBalance || `${(profile.balance?.balance || profile.balanceInfo?.balance || 0).toLocaleString()} MyPts`,
    isLoadingBalance: false,
  };
};

export function ProfileSelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadProfiles = async () => {
      console.log("===== PROFILE SELECTOR =====");
      console.log("Session:", JSON.stringify(session, null, 2));

      // Check if user is admin from localStorage first (fastest check)
      if (typeof window !== 'undefined') {
        const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('userRole') === 'admin';
        if (isAdminFromStorage) {
          console.log("ADMIN USER DETECTED IN LOCALSTORAGE - Redirecting immediately to admin dashboard");
          window.location.href = '/admin';
          return;
        }

        // Check if user is admin from user data in localStorage
        try {
          const userDataStr = localStorage.getItem('user');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData && (userData.role === 'admin' || userData.isAdmin === true)) {
              console.log("ADMIN USER DETECTED IN USER DATA - Redirecting immediately to admin dashboard");
              localStorage.setItem('isAdmin', 'true');
              localStorage.setItem('userRole', 'admin');
              window.location.href = '/admin';
              return;
            }
          }
        } catch (error) {
          console.error("Error checking admin status from localStorage:", error);
        }
      }

      // Check if user is admin from session
      if (session?.user?.role === 'admin' || session?.user?.isAdmin === true) {
        console.log("ADMIN USER DETECTED IN SESSION - Redirecting immediately to admin dashboard");
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('userRole', 'admin');
        }
        window.location.href = '/admin';
        return;
      }

      // Check for access token and user data in localStorage (for social auth)
      const accessTokenFromStorage =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      const userDataString =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      let userDataFromStorage = null;

      try {
        if (userDataString) {
          userDataFromStorage = JSON.parse(userDataString);
        }
      } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
      }

      console.log(
        "Access token in localStorage:",
        accessTokenFromStorage ? "Present" : "Not found"
      );
      console.log(
        "User data in localStorage:",
        userDataFromStorage ? "Present" : "Not found"
      );

      // If we have an access token in localStorage, set it in the API clients
      if (accessTokenFromStorage) {
        console.log("Setting access token from localStorage in API clients");
        profileApi.setToken(accessTokenFromStorage);
        userApi.setToken(accessTokenFromStorage);
      }

      // For social auth, we might not have a session but we have data in localStorage
      if (!session?.user?.id && !userDataFromStorage) {
        console.log(
          "Missing user ID in session and no user data in localStorage"
        );

        // Try to fetch user data from the API if we have an access token
        if (accessTokenFromStorage) {
          console.log("Attempting to fetch user data with access token");
          try {
            const userResponse = await socialAuthApi.getCurrentUser();
            if (userResponse.success && userResponse.user) {
              console.log(
                "Successfully fetched user data from API:",
                userResponse.user
              );

              // Store the user data in localStorage
              localStorage.setItem("user", JSON.stringify(userResponse.user));

              // Update userDataFromStorage with the fetched data
              userDataFromStorage = userResponse.user;
            } else {
              console.error(
                "Failed to fetch user data from API:",
                userResponse
              );
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error fetching user data from API:", error);
            setLoading(false);
            return;
          }
        } else {
          setLoading(false);
          return;
        }
      }

      // Use user ID from session or localStorage
      const userId = session?.user?.id || userDataFromStorage?.id;
      console.log("Using user ID:", userId);

      // Even if accessToken is empty, we'll proceed because the backend might be using cookies
      console.log(
        "Access token in session:",
        session?.accessToken || "Using cookie or localStorage authentication"
      );

      console.log(
        "Access token present:",
        !!(session?.accessToken || accessTokenFromStorage)
      );

      // If we're using social auth, try to get profiles directly from the user data in localStorage
      if (
        !session?.user?.id &&
        userDataFromStorage &&
        userDataFromStorage.profiles &&
        userDataFromStorage.profiles.length > 0
      ) {
        console.log(
          "Found profiles in localStorage user data:",
          userDataFromStorage.profiles
        );

        try {
          // Map the profiles to the expected format
          const mappedProfiles = userDataFromStorage.profiles.map(
            (profileId: string) => {
              // Create a basic profile object with the ID
              // We'll need to fetch the full profile details later
              return {
                id: profileId,
                name: `Profile ${profileId.substring(0, 6)}...`,
                description: "Loading profile details...",
                profileType: "personal",
                accessToken: accessTokenFromStorage || "",
              };
            }
          );

          setProfiles(mappedProfiles);

          // Don't auto-select profiles, even if there's only one
          console.log(
            "Found profiles from localStorage:",
            mappedProfiles.length > 0 ? mappedProfiles.map((p: { id: any; }) => p.id) : "none"
          );

          // Try to fetch full profile details for each profile
          mappedProfiles.forEach(async (profile: { id: string }) => {
            try {
              const profileDetails = await profileApi.getProfileDetails(
                profile.id
              );
              console.log(`Profile details for ${profile.id}:`, profileDetails);

              if (profileDetails.success && profileDetails.data) {
                // Update the profile in the list with the full details
                setProfiles((prevProfiles) =>
                  prevProfiles.map((p) =>
                    p.id === profile.id
                      ? {
                        ...p,
                        name: p.name !== 'Untitled Profile' ? p.name : (profileDetails.data.name || p.name),
                        description:
                          profileDetails.data.description || p.description,
                        profileType:
                          profileDetails.data.profileType ||
                          profileDetails.data.type ||
                          p.profileType,
                      }
                      : p
                  )
                );
              }
            } catch (e) {
              console.error(
                `Error fetching details for profile ${profile.id}:`,
                e
              );
            }
          });
        } catch (e) {
          console.error("Error processing profiles from localStorage:", e);
        }
      }

      try {
        // Get profiles directly from the profile API with caching
        console.log("Getting profiles from profile API with caching...");
        const response = await profileApi.getUserProfiles();
        console.log("Profile API response:", response);

        // If we got profiles from cache or API, process them
        if (response.success && response.data) {
          console.log(`Got ${Array.isArray(response.data) ? response.data.length : 'unknown'} profiles from ${response.fromCache ? 'cache' : 'API'}`);

          // If we need to check admin status, do it in parallel
          if (!response.fromCache) {
            // Check admin status in the background
            userApi.getCurrentUser().then(userResponse => {
              if (
                userResponse.success &&
                userResponse.data &&
                (userResponse.data.role === 'admin' || userResponse.data.isAdmin === true)
              ) {
                console.log("ADMIN USER DETECTED IN API RESPONSE - Redirecting to admin dashboard");

                // Store admin status in localStorage
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('userRole', 'admin');

                // Redirect to admin dashboard
                window.location.href = '/admin';
              }
            }).catch(error => {
              console.error("Error checking admin status:", error);
            });
          }
          // Handle authentication errors
          if (response.message?.includes("authentication") ||
            response.message?.includes("token") ||
            response.message?.includes("Unauthorized")) {
            console.error("Authentication error:", response.message);
            toast.error("Your session has expired. Please log in again.");
            // Wait a moment before redirecting
            setTimeout(() => {
              router.push("/login");
            }, 2000);
            return;
          }

          // Process the profiles data
          console.log("Processing profile data");
          console.log("Raw response data:", JSON.stringify(response.data, null, 2));

          // Extract profiles from the response
          let processedProfiles: ProfileData[] = [];

          // If profiles is an object with categories
          if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
            // Flatten the profiles from all categories
            Object.entries(response.data).forEach(([_category, categoryProfiles]: [string, any]) => {
              if (Array.isArray(categoryProfiles)) {
                const mappedProfiles = categoryProfiles.map((profile: any) => formatProfileData(profile));
                processedProfiles = [...processedProfiles, ...mappedProfiles];
              }
            });
          }
          // If profiles is already an array
          else if (Array.isArray(response.data)) {
            processedProfiles = response.data.map((profile: any) => formatProfileData(profile));
          }

          console.log(`Processed ${processedProfiles.length} profiles`);
          console.log("Processed profiles:", JSON.stringify(processedProfiles, null, 2));
          setProfiles(processedProfiles);

          // Don't auto-select profiles, even if there's only one
          console.log(
            "Found profiles from profile API:",
            processedProfiles.length > 0 ? processedProfiles.map(p => p.id) : "none"
          );

          // Clear any stored profile ID to ensure the user can select a profile
          if (typeof window !== "undefined") {
            localStorage.removeItem("selectedProfileId");
            localStorage.removeItem("selectedProfileToken");
          }

          // Don't auto-select profiles from session either
          console.log("Not auto-selecting profile from session");
        }
      } catch (error) {
        console.error("Error loading profiles:", error);
        toast.error("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [session]);

  // Removed fetchAllProfileBalances function as we're getting balance data directly from the profile

  // No need to fetch balances separately as they're included in the profile data
  // This comment is kept to explain why we removed the balance fetching code

  const handleSelectProfile = async (profileId: string) => {
    try {
      console.log("Selecting profile:", { profileId });

      // Find the selected profile to get its name and type
      const selectedProfile = profiles.find((p) => p.id === profileId);

      // Reset redirect attempts counter
      localStorage.setItem("redirectAttempts", "0");

      // Store the profile ID in localStorage
      localStorage.setItem("selectedProfileId", profileId);

      // Also store the profile name and type for display purposes
      if (selectedProfile) {
        localStorage.setItem("selectedProfileName", selectedProfile.name);
        localStorage.setItem(
          "selectedProfileType",
          selectedProfile.profileType || ""
        );
      }

      // Preserve admin role if it exists
      try {
        // Try to get from session
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json();

        if (sessionData?.user?.isAdmin === true || sessionData?.user?.role === "admin") {
          console.log("Preserving admin role in localStorage");
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("isAdmin", "true");
        } else {
          // Check localStorage for existing admin role
          const userDataStr = localStorage.getItem("user");
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.isAdmin === true || userData.role === "admin") {
                console.log("Preserving admin role from localStorage");
                localStorage.setItem("userRole", "admin");
                localStorage.setItem("isAdmin", "true");
              }
            } catch (parseError) {
              console.error("Error parsing user data:", parseError);
            }
          }
        }
      } catch (roleError) {
        console.error("Error preserving admin role:", roleError);
      }

      // Get the access token from localStorage or session
      let accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        try {
          const response = await fetch("/api/auth/session");
          const session = await response.json();
          console.log("Session during profile selection:", session);

          // Store the access token in localStorage
          if (session?.accessToken) {
            accessToken = session.accessToken;
            // Ensure accessToken is a string before setting it in localStorage
            localStorage.setItem("accessToken", session.accessToken);
            console.log("Access token stored in localStorage");
          }
        } catch (sessionError) {
          console.error("Error getting session:", sessionError);
        }
      }

      // Request a profile-specific token from the backend
      try {
        console.log("Requesting profile token for profile:", profileId);
        const profileTokenResponse = await fetch(
          `/api/profiles/${profileId}/token`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (profileTokenResponse.ok) {
          const tokenData = await profileTokenResponse.json();
          if (tokenData.success && tokenData.profileToken) {
            console.log("Received profile token from backend");
            localStorage.setItem(
              "selectedProfileToken",
              tokenData.profileToken
            );
          } else {
            console.warn(
              "Profile token response did not contain a valid token:",
              tokenData
            );
            // Fallback: Use the profile's accessToken if available
            if (selectedProfile?.accessToken) {
              localStorage.setItem(
                "selectedProfileToken",
                selectedProfile.accessToken
              );
            }
          }
        } else {
          console.warn(
            "Failed to get profile token from backend, status:",
            profileTokenResponse.status
          );
          // Fallback: Use the profile's accessToken if available
          if (selectedProfile?.accessToken) {
            localStorage.setItem(
              "selectedProfileToken",
              selectedProfile.accessToken
            );
          }
        }
      } catch (tokenError) {
        console.error("Error requesting profile token:", tokenError);
        // Fallback: Use the profile's accessToken if available
        if (selectedProfile?.accessToken) {
          localStorage.setItem(
            "selectedProfileToken",
            selectedProfile.accessToken
          );
        }
      }

      // Set cookies for the backend
      try {
        const profileToken = localStorage.getItem("selectedProfileToken") || "";

        // Get user role and admin status from session or localStorage
        let isAdmin = false;
        let role = "user";

        // Try to get from session
        try {
          const sessionResponse = await fetch("/api/auth/session");
          const sessionData = await sessionResponse.json();
          console.log("Session data for cookies:", sessionData);

          if (sessionData?.user) {
            isAdmin = sessionData.user.isAdmin === true;
            role = sessionData.user.role || "user";
          }
        } catch (sessionError) {
          console.error("Error getting session for cookies:", sessionError);
        }

        // If not in session, try localStorage
        if (!isAdmin) {
          const userDataStr = localStorage.getItem("user");
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              isAdmin = userData.isAdmin === true || userData.role === "admin";
              role = userData.role || "user";
            } catch (parseError) {
              console.error("Error parsing user data from localStorage:", parseError);
            }
          }
        }

        console.log("Setting cookies with admin status:", { isAdmin, role });

        // Call our API endpoint to set cookies
        const cookieResponse = await fetch("/api/profile/set-cookies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profileId, profileToken, isAdmin, role }),
          credentials: "include",
        });

        if (!cookieResponse.ok) {
          throw new Error("Failed to set profile cookies");
        }

        console.log("Profile cookies set successfully");
      } catch (cookieError) {
        console.error("Error setting profile cookies:", cookieError);
        // Continue anyway, as localStorage might be enough
      }

      toast.success("Profile selected");

      // Add a small delay before redirecting to ensure localStorage is updated
      setTimeout(() => {
        // Double-check that the profile ID was actually stored
        const storedProfileId = localStorage.getItem("selectedProfileId");
        console.log("Verifying profile ID before redirect:", {
          storedProfileId,
          expectedProfileId: profileId,
          isStored: storedProfileId === profileId,
        });

        if (!storedProfileId || storedProfileId !== profileId) {
          console.warn("Profile ID not properly stored, trying again...");
          // Try storing it again
          localStorage.setItem("selectedProfileId", profileId);

          // Wait a bit longer before redirecting
          setTimeout(() => {
            console.log("Second attempt to store profile ID, redirecting now");
            // Redirect to dashboard with a hard navigation to ensure a clean state
            window.location.href = "/dashboard";
          }, 500);
        } else {
          console.log(
            "Profile ID successfully stored, redirecting to dashboard"
          );
          // Redirect to dashboard with a hard navigation to ensure a clean state
          window.location.href = "/dashboard";
        }
      }, 500);
    } catch (error) {
      console.error("Error selecting profile:", error);
      toast.error("Failed to select profile");
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Select a Profile</CardTitle>
            <CardDescription>Choose a profile to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="flex items-center space-x-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.2,
                  ease: "easeOut",
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Profiles Found</CardTitle>
            <CardDescription>You don't have any profiles yet</CardDescription>
          </CardHeader>
          <CardFooter>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button
                onClick={() => router.push("/create-profile")}
                className="w-full"
              >
                Create a Profile
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Select a Profile</CardTitle>
          <CardDescription>Choose a profile to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                borderColor:
                  selectedProfileId === profile.id
                    ? ["#000", "#3B82F6", "#000"]
                    : "#e5e7eb",
                borderWidth: selectedProfileId === profile.id ? "1px" : "1px",
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
                borderColor: {
                  duration: 2,
                  repeat: selectedProfileId === profile.id ? Infinity : 0,
                  ease: "easeInOut",
                },
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Add a small animation effect when selecting a profile
                if (selectedProfileId !== profile.id) {
                  setSelectedProfileId(profile.id);
                }
              }}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedProfileId === profile.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.profileType ?
                      (profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)) :
                      'Personal'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.description}
                  </p>

                  {/* Balance display */}
                  <div className="mt-2 flex items-center">
                    <img
                      src="/mdi_coins-outline.svg"
                      className="h-4 w-4 mr-1"
                    />
                    <span className="text-sm font-medium">
                      {profile.formattedBalance || `${(profile.balance || 0).toLocaleString()} MyPts`}
                    </span>
                  </div>
                </div>
                <AnimatePresence>
                  {selectedProfileId === profile.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="flex items-center justify-center"
                    >
                      <motion.div
                        className="h-8 w-8 rounded-full bg-primary flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(0, 0, 0, 0)",
                            "0 0 0 4px rgba(0, 0, 0, 0.1)",
                            "0 0 0 0 rgba(0, 0, 0, 0)",
                          ],
                        }}
                        transition={{
                          boxShadow: {
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                          },
                        }}
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <motion.div
            whileHover={selectedProfileId ? { scale: 1.02 } : {}}
            whileTap={selectedProfileId ? { scale: 0.98 } : {}}
            className="w-full"
            animate={{
              y: [0, selectedProfileId ? -5 : 0, 0],
              transition: {
                duration: 0.5,
                repeat: selectedProfileId ? Infinity : 0,
                repeatType: "reverse",
                ease: "easeInOut",
                repeatDelay: 2,
              },
            }}
          >
            <AnimatedButton
              onClick={() => {
                const selectedProfile = profiles.find(
                  (p) => p.id === selectedProfileId
                );
                if (selectedProfile) {
                  handleSelectProfile(selectedProfile.id);
                } else {
                  toast.error("Please select a profile");
                }
              }}
              disabled={!selectedProfileId}
              type="button"
              className="h-12 w-full bg-black"
              style={{
                backgroundColor: selectedProfileId ? "black" : "white",
                color: selectedProfileId ? "white" : "black",
                borderColor: "black",
                borderWidth: "1px",
              }}
            >
              Continue
            </AnimatedButton>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
