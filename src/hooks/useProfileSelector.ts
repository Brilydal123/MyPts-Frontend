import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api/profile-api';
import { userApi } from '@/lib/api/user-api';

// Define the profile data structure
export interface ProfileData {
  id: string;
  secondaryId?: string;
  name: string;
  description: string;
  profileType: string;
  accessToken?: string;
  balance: number;
  formattedBalance: string;
  profileImage?: string;
}

export function useProfileSelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Query to fetch user profiles
  const {
    data: profiles = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: async () => {
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
            return [];
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

            return [defaultProfile];
          }

          throw new Error(response.message || "Failed to load profiles");
        }

        // Process the profiles data
        const processedProfiles = processProfileData(response.data);
        console.log(`Processed ${processedProfiles.length} profiles`);

        // Clear any stored profile ID to ensure the user can select a profile
        if (typeof window !== "undefined") {
          localStorage.removeItem("selectedProfileId");
          localStorage.removeItem("selectedProfileToken");
        }

        // Check for admin status in the background
        checkAdminStatus();

        return processedProfiles;
      } catch (error) {
        console.error("Error loading profiles:", error);
        toast.error("Failed to load profiles");
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
      secondaryId: profile.secondaryId || null,
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

  // Mutation to select a profile
  const selectProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const selectedProfile = profiles.find((p) => p.id === profileId);
      if (!selectedProfile) {
        throw new Error("Profile not found");
      }

      // Store profile data in localStorage
      localStorage.setItem("selectedProfileId", profileId);
      localStorage.setItem("selectedProfileName", selectedProfile.name);
      localStorage.setItem("selectedProfileType", selectedProfile.profileType || "");

      // Store secondary ID if available
      const secondaryId = 'secondaryId' in selectedProfile ? selectedProfile.secondaryId : undefined;
      if (secondaryId) {
        localStorage.setItem("selectedProfileSecondaryId", secondaryId);
      }

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
          } else {
            // Check if profile has accessToken property
            const profileAccessToken = 'accessToken' in selectedProfile ? selectedProfile.accessToken : undefined;
            if (profileAccessToken) {
              localStorage.setItem("selectedProfileToken", profileAccessToken);
            }
          }
        } else {
          // Check if profile has accessToken property
          const profileAccessToken = 'accessToken' in selectedProfile ? selectedProfile.accessToken : undefined;
          if (profileAccessToken) {
            localStorage.setItem("selectedProfileToken", profileAccessToken);
          }
        }
      } catch (error) {
        console.error("Error requesting profile token:", error);
        // Check if profile has accessToken property
        const profileAccessToken = 'accessToken' in selectedProfile ? selectedProfile.accessToken : undefined;
        if (profileAccessToken) {
          localStorage.setItem("selectedProfileToken", profileAccessToken);
        }
      }

      return selectedProfile;
    },
    onSuccess: () => {
      toast.success("Profile selected");

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    },
    onError: (error) => {
      console.error("Error selecting profile:", error);
      toast.error("Failed to select profile");
    }
  });

  // Handle profile selection
  const handleSelectProfile = (profileId: string) => {
    selectProfileMutation.mutate(profileId);
  };

  return {
    profiles,
    isLoading,
    error,
    selectedProfileId,
    setSelectedProfileId,
    handleSelectProfile,
    selectProfileMutation
  };
}
