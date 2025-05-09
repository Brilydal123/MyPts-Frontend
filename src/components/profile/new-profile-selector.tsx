'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedButton } from '@/components/ui/animated-button';
import { GoogleAvatar } from '@/components/shared/google-avatar';
import { profileApi } from '@/lib/api/profile-api';
import { userApi } from '@/lib/api/user-api';
import { Card } from '../ui/card';

// Define the profile data structure
interface ProfileData {
  id: string;
  name: string;
  description: string;
  profileType: string;
  accessToken?: string; // Make accessToken optional
  balance: number;
  formattedBalance: string;
  profileImage?: string; // Add profile image field
}

export function NewProfileSelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        // Check for social auth tokens
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const isSocialAuthenticated = !!accessToken && !!userDataString;

        console.log("Profile selector - authentication check:", {
          nextAuthStatus: session ? 'authenticated' : 'unauthenticated',
          isSocialAuthenticated,
          hasAccessToken: !!accessToken,
          hasUserData: !!userDataString
        });

        // Get profiles from the API with caching
        const response = await profileApi.getUserProfiles();

        if (!response.success) {
          // Handle authentication errors
          if (response.message?.includes("authentication") ||
            response.message?.includes("token") ||
            response.message?.includes("Unauthorized")) {
            toast.error("Your session has expired. Please log in again.");
            setTimeout(() => router.push("/login"), 2000);
            return;
          }

          // If we couldn't get profiles from the API, create a default profile
          console.log("Failed to get profiles from API, creating default profile");

          // Get user data from localStorage
          let userData = null;
          if (typeof window !== 'undefined') {
            const userDataString = localStorage.getItem('user');
            if (userDataString) {
              try {
                userData = JSON.parse(userDataString);
              } catch (e) {
                console.error('Error parsing user data from localStorage:', e);
              }
            }
          }

          // If we have user data, create a default profile
          if (userData) {
            const defaultProfile = {
              id: userData.id + '_default',
              name: userData.fullName || userData.username || 'My Profile',
              username: userData.username || '',
              description: 'Default profile',
              profileType: 'personal',
              type: {
                category: 'individual',
                subtype: 'personal'
              },
              balance: 0,
              formattedBalance: '0 MyPts',
              profileImage: userData.profileImage || userData.image || ''
            };

            setProfiles([defaultProfile]);
            setLoading(false);
            return;
          }

          throw new Error(response.message || "Failed to load profiles");
        }

        // Process the profiles data
        const processedProfiles = processProfileData(response.data);
        console.log(`Processed ${processedProfiles.length} profiles`);

        // Set the profiles
        setProfiles(processedProfiles);

        // Clear any stored profile ID to ensure the user can select a profile
        if (typeof window !== "undefined") {
          localStorage.removeItem("selectedProfileId");
          localStorage.removeItem("selectedProfileToken");
        }

        // Check for admin status in the background
        checkAdminStatus();
      } catch (error) {
        console.error("Error loading profiles:", error);
        toast.error("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [router, session]);

  // Process profile data from API response
  const processProfileData = (data: any): ProfileData[] => {
    let processedProfiles: ProfileData[] = [];

    // If profiles is an object with categories
    if (data && typeof data === "object" && !Array.isArray(data)) {
      // Flatten the profiles from all categories
      Object.entries(data).forEach(([_category, categoryProfiles]: [string, any]) => {
        if (Array.isArray(categoryProfiles)) {
          const mappedProfiles = categoryProfiles.map(formatProfileData);
          processedProfiles = [...processedProfiles, ...mappedProfiles];
        }
      });
    }
    // If profiles is already an array
    else if (Array.isArray(data)) {
      processedProfiles = data.map(formatProfileData);
    }

    return processedProfiles;
  };

  // Format individual profile data
  const formatProfileData = (profile: any): ProfileData => {
    // Extract profile type for display
    const profileType = profile.profileType
      ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
      : profile.type?.subtype
        ? profile.type.subtype.charAt(0).toUpperCase() + profile.type.subtype.slice(1)
        : "Personal";

    // Get the base name (either username or name)
    let baseName = profile.name === 'Untitled Profile' && profile.username
      ? profile.username
      : profile.name;

    // Capitalize the first letter of the name
    if (baseName && typeof baseName === 'string' && baseName.length > 0) {
      baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }

    // Format the name as "Name ProfileType Profile"
    const formattedName = `${baseName} ${profileType} Profile`;

    // Extract profile image from various possible locations
    const profileImage = profile.profileImage ||
      profile.ProfileFormat?.profileImage ||
      profile.avatar ||
      profile.image ||
      "";

    return {
      id: profile._id || profile.id,
      name: formattedName,
      description: profile.description || "",
      profileType: profile.profileType || (profile.type?.subtype || "personal"),
      accessToken: profile.accessToken || "",
      balance: profile.balance?.balance || profile.balanceInfo?.balance || 0,
      formattedBalance: profile.formattedBalance || `${(profile.balance?.balance || profile.balanceInfo?.balance || 0).toLocaleString()} MyPts`,
      profileImage: profileImage,
    };
  };

  // Check if user is admin
  const checkAdminStatus = async () => {
    try {
      const userResponse = await userApi.getCurrentUser();

      if (userResponse.success &&
        userResponse.data &&
        (userResponse.data.role === 'admin' || userResponse.data.isAdmin === true)) {
        console.log("Admin user detected - redirecting to admin dashboard");
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('userRole', 'admin');
        window.location.href = '/admin';
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  // Handle profile selection
  const handleSelectProfile = async (profileId: string) => {
    try {
      const selectedProfile = profiles.find((p) => p.id === profileId);
      if (!selectedProfile) {
        toast.error("Profile not found");
        return;
      }

      // Store profile data in localStorage
      localStorage.setItem("selectedProfileId", profileId);
      localStorage.setItem("selectedProfileName", selectedProfile.name);
      localStorage.setItem("selectedProfileType", selectedProfile.profileType || "");

      // Get access token
      const accessToken = localStorage.getItem("accessToken") || session?.accessToken || "";

      // Request profile token
      try {
        const profileTokenResponse = await fetch(`/api/profiles/${profileId}/token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (profileTokenResponse.ok) {
          const tokenData = await profileTokenResponse.json();
          if (tokenData.success && tokenData.profileToken) {
            localStorage.setItem("selectedProfileToken", tokenData.profileToken);
          } else if (selectedProfile.accessToken) {
            localStorage.setItem("selectedProfileToken", selectedProfile.accessToken);
          }
        } else if (selectedProfile.accessToken) {
          localStorage.setItem("selectedProfileToken", selectedProfile.accessToken);
        }
      } catch (error) {
        console.error("Error requesting profile token:", error);
        if (selectedProfile.accessToken) {
          localStorage.setItem("selectedProfileToken", selectedProfile.accessToken);
        }
      }

      toast.success("Profile selected");

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Error selecting profile:", error);
      toast.error("Failed to select profile");
    }
  };

  // Loading state - Apple-like design
  if (loading) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto px-4"
        >
          <div className="mb-8 text-center">
            {/* <h1 className="text-2xl font-semibold tracking-tight mb-2">Select a Profile</h1> */}
            <p className="text-sm text-gray-500">Choose a profile to continue with MyPts</p>
          </div>

          <div className="space-y-3 mb-8">
            {/* Just one loading skeleton for a cleaner look */}
            <motion.div
              className="p-5 border border-gray-100 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                borderRadius: "16px",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)"
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 flex">
                  {/* Avatar skeleton */}
                  <Skeleton className="h-10 w-10 rounded-full mr-3 flex-shrink-0" />

                  <div>
                    <Skeleton className="h-5 w-[180px] mb-2 rounded-md" />
                    <Skeleton className="h-4 w-[100px] mb-3 rounded-md" />
                    <div className="flex items-center mt-4">
                      <Skeleton className="h-9 w-9 rounded-full mr-3" />
                      <Skeleton className="h-5 w-[100px] rounded-md" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </motion.div>
          </div>

          <Skeleton className="h-12 w-full rounded-xl mb-4" />
        </motion.div>
      </Card>
    );
  }

  // No profiles found - Apple-like design
  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto px-4"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">No Profiles Found</h1>
          <p className="text-sm text-gray-500">You don't have any profiles yet</p>
        </div>

        <div className="mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-32 h-32 rounded-full flex items-center justify-center"
          >
            <GoogleAvatar
              profileImageUrl=""
              fallbackText="P"
              size={128}
              className="ring-4 ring-gray-100"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button
            onClick={() => router.push("/create-profile")}
            className="h-12 w-full rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            Create a Profile
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Profile list - Apple-like design
  return (
    <Card className='w-full max-w-md mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Apple-like spring easing
        className="w-full max-w-md mx-auto px-4"
      >
        <div className="mb-8 text-center">
          {/* <h1 className="text-2xl font-semibold tracking-tight mb-2">Select a Profile</h1> */}
          <p className="text-sm text-gray-500">Choose a profile to continue with MyPts</p>
        </div>

        <div className="space-y-3 mb-8">
          {profiles.map((profile, index) => {
            // Extract profile type for display
            const profileType = profile.profileType
              ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
              : 'Personal';

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  background: selectedProfileId === profile.id
                    ? "linear-gradient(145deg, rgba(0, 122, 255, 0.08), rgba(0, 122, 255, 0.15))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(250, 250, 252, 1))"
                }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1], // Apple-like spring easing
                }}
                whileHover={{
                  scale: 1.01,
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
                  background: selectedProfileId === profile.id
                    ? "linear-gradient(145deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.2))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(245, 245, 247, 1))"
                }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (selectedProfileId !== profile.id) {
                    setSelectedProfileId(profile.id);
                  }
                }}
                className={`p-5 border backdrop-blur-sm rounded-xl cursor-pointer transition-all ${selectedProfileId === profile.id
                  ? "border-[#007AFF] shadow-sm"
                  : "border-[#E1E1E6] hover:border-[#D1D1D6]"
                  }`}
                style={{
                  borderRadius: "16px",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)"
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex">
                    {/* Profile Avatar */}
                    <div className="mr-3 flex-shrink-0">
                      <GoogleAvatar
                        profileImageUrl={profile.profileImage || ""}
                        fallbackText={profile.name.charAt(0)}
                        size={40}
                        className="ring-2 ring-blue-100 font-extrabold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-base" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}>{profile.name}</h3>
                      </div>

                      <div className="mt-1 flex items-center">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}
                        >
                          {profileType}
                        </span>
                      </div>

                      {/* Balance display - Simple Apple-like design */}
                      <div className="mt-4 flex items-center">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-2 mr-3 shadow-sm">
                          <img
                            src="/mdi_coins-outline.svg"
                            className="h-5 w-5"
                            alt="MyPts"
                          />
                        </div>
                        <span className="text-base font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif', letterSpacing: '-0.01em' }}>
                          {profile.formattedBalance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedProfileId === profile.id ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="flex items-center justify-center"
                      >
                        <motion.div
                          className="h-8 w-8 rounded-full bg-black flex items-center justify-center shadow-md"
                          whileHover={{ scale: 1.05 }}
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(59, 130, 246, 0)",
                              "0 0 0 4px rgba(59, 130, 246, 0.15)",
                              "0 0 0 0 rgba(59, 130, 246, 0)",
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
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-8 w-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1]
          }}
          className=''
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
            // className={`h-12 acti w-full font-medium transition-all auth-button active ${selectedProfileId
            //   ? "bg-[#007AFF] hover:bg-[#0071EB] active:bg-[#0068D6] text-white shadow-sm hover:shadow-md"
            //   : "bg-gray-100 text-gray-400 cursor-not-allowed"
            //   }`}
            className={`h-12 font-medium transition-all w-full auth-button active rounded-md ${!selectedProfileId && "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            style={{
              // borderRadius: "20px", // More rounded corners like Apple buttons
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            Continue
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </Card>
  );
}
