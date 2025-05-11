import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/profile-api';
import { myPtsApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';

// Define query keys for better organization
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: any) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};

// Process profile data to ensure consistency
const processProfileData = (profile: any) => {
  if (!profile) return null;

  // Create a copy to avoid mutating the original
  const processedProfile = { ...profile };

  // Handle balance fields
  if (processedProfile.balance !== undefined && processedProfile.myPtsBalance === undefined) {
    processedProfile.myPtsBalance = processedProfile.balance;
  }

  // Ensure ProfileMypts is an object
  if (typeof processedProfile.ProfileMypts === 'string' || processedProfile.ProfileMypts === undefined) {
    processedProfile.ProfileMypts = {
      currentBalance: processedProfile.balance || processedProfile.myPtsBalance || 0,
      lifetimeMypts: processedProfile.lifetimeMypts || 0
    };
  } else if (processedProfile.ProfileMypts && typeof processedProfile.ProfileMypts === 'object') {
    // Make sure myPtsBalance is set from ProfileMypts if not already set
    if (!processedProfile.myPtsBalance && processedProfile.ProfileMypts.currentBalance !== undefined) {
      processedProfile.myPtsBalance = processedProfile.ProfileMypts.currentBalance;
    }
  }

  return processedProfile;
};

// Hook to fetch a profile by ID
export const useProfile = (id: string, options = {}) => {
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: async () => {
      console.log(`Fetching profile with ID: ${id}`);
      const response = await profileApi.getProfileByIdAdmin(id);

      if (response.success && response.data) {
        return processProfileData(response.data);
      }

      throw new Error(response.message || `Failed to fetch profile with ID: ${id}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook to fetch all profiles
export const useProfiles = (params = {}, options = {}) => {
  return useQuery({
    queryKey: profileKeys.list(params),
    queryFn: async () => {
      console.log('Fetching all profiles with params:', params);
      const response = await profileApi.getAllProfiles(params);

      if (response.success && response.data?.profiles) {
        return {
          profiles: response.data.profiles.map(processProfileData),
          pagination: response.data.pagination
        };
      }

      throw new Error(response.message || 'Failed to fetch profiles');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook to search profiles
export const useSearchProfiles = (searchQuery: string, options = {}) => {
  return useQuery({
    queryKey: [...profileKeys.lists(), 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return { profiles: [] };
      }

      console.log('Searching profiles with query:', searchQuery);
      const response = await profileApi.searchProfiles(searchQuery);

      if (response.success && response.data) {
        return {
          profiles: response.data.map(processProfileData)
        };
      }

      throw new Error(response.message || 'Failed to search profiles');
    },
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook to award MyPts to a profile
export const useAwardMyPts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, amount, reason }: { profileId: string, amount: number, reason: string }) => {
      // Validate inputs
      if (!profileId) {
        throw new Error("Profile ID is required");
      }

      if (!amount || amount <= 0) {
        throw new Error("Amount must be a positive number");
      }

      // Clean and validate the profile ID
      const cleanProfileId = profileId.toString().trim();

      // Ensure it's a valid MongoDB ObjectId (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(cleanProfileId)) {
        console.error(`Invalid profile ID format: ${cleanProfileId}`);
        throw new Error('Invalid profile ID format. Must be a 24-character hex string.');
      }

      console.log(`Awarding ${amount} MyPts to profile ${cleanProfileId}`);

      // Get the access token
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication token is missing. Please log in again.");
      }

      // Log the request details (without the full token)
      console.log('Award request details:', {
        profileId: cleanProfileId,
        amount: Number(amount),
        reason: reason || 'Admin reward',
        tokenPrefix: accessToken.substring(0, 10) + '...'
      });

      // Make the API call
      try {
        // Determine the correct API endpoint URL based on environment
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api';
        const awardEndpoint = `${apiBaseUrl}/my-pts/award`;
        console.log('Using API endpoint:', awardEndpoint);

        // Update the selected profile ID in localStorage to match the one we're awarding to
        if (typeof window !== 'undefined') {
          const currentProfileId = localStorage.getItem('selectedProfileId');
          if (currentProfileId !== cleanProfileId) {
            console.log(`Temporarily updating selectedProfileId in localStorage from ${currentProfileId} to ${cleanProfileId}`);
            // Save the original profile ID so we can restore it later
            localStorage.setItem('originalProfileId', currentProfileId || '');
            localStorage.setItem('selectedProfileId', cleanProfileId);
          }
        }

        // Make the API call
        const response = await fetch(awardEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            profileId: cleanProfileId,
            amount: Number(amount),
            reason: reason || 'Admin reward'
          })
        });

        console.log('API response status:', response.status);

        // Parse the response JSON
        const responseData = await response.json();
        console.log('API response data:', responseData);

        // Restore the original profile ID in localStorage if it was changed
        if (typeof window !== 'undefined') {
          const currentProfileId = localStorage.getItem('selectedProfileId');
          const originalProfileId = localStorage.getItem('originalProfileId');
          if (originalProfileId && currentProfileId !== originalProfileId) {
            console.log(`Restoring original selectedProfileId in localStorage from ${currentProfileId} to ${originalProfileId}`);
            localStorage.setItem('selectedProfileId', originalProfileId);
            localStorage.removeItem('originalProfileId');
          }
        }

        // Check if the response was successful
        if (!response.ok) {
          throw new Error(responseData.message || `API error: ${response.status}`);
        }

        return responseData;
      } catch (error: any) {
        console.error('Award API call failed:', error);

        // Restore the original profile ID in localStorage if it was changed
        if (typeof window !== 'undefined') {
          const currentProfileId = localStorage.getItem('selectedProfileId');
          const originalProfileId = localStorage.getItem('originalProfileId');
          if (originalProfileId && currentProfileId !== originalProfileId) {
            console.log(`Restoring original selectedProfileId in localStorage from ${currentProfileId} to ${originalProfileId}`);
            localStorage.setItem('selectedProfileId', originalProfileId);
            localStorage.removeItem('originalProfileId');
          }
        }

        // Provide a more helpful error message
        if (error.message.includes('profile not found')) {
          throw new Error(`Profile with ID ${cleanProfileId} not found or you don't have permission to award MyPts to it.`);
        }

        throw error;
      }
    },
    onSuccess: (data, variables) => {
      toast.success(`Successfully awarded ${variables.amount} MyPts to the profile`);

      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.profileId) });

      // Also invalidate the profiles list to update the list view
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
    onError: (error: any) => {
      // Extract the most user-friendly error message
      let errorMessage = error.message || "Failed to award MyPts due to an API error.";

      // Check for specific error messages and provide more helpful information
      if (errorMessage.includes("Cannot move") && errorMessage.includes("to circulation when only")) {
        errorMessage = "There aren't enough MyPts in the reserve. Please contact the system administrator to issue more MyPts.";
      } else if (errorMessage.includes("hex string must be") || errorMessage.includes("Invalid profile ID format")) {
        errorMessage = "Invalid profile ID format. Please try selecting the profile again.";
      } else if (errorMessage.includes("Failed to issue")) {
        errorMessage = "Failed to issue new MyPts. Please contact the system administrator to check the MyPts supply.";
      } else if (errorMessage.includes("profile not found") || errorMessage.includes("not owned by user")) {
        errorMessage = "The selected profile was not found or you don't have permission to award MyPts to it. Please try selecting the profile again.";
      } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("Authentication token")) {
        errorMessage = "Your session may have expired. Please try logging out and logging back in.";
      }

      toast.error(errorMessage);
      console.error("Original error:", error);
    }
  });
};

// Hook to refresh a profile's MyPts balance
export const useRefreshMyPtsBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      console.log(`Refreshing MyPts balance for profile ${profileId}`);

      const response = await fetch(`https://my-profile-server-api.onrender.com/my-pts/balance?profileId=${profileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh MyPts balance');
      }

      const data = await response.json();
      console.log('Direct MyPts balance response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to refresh MyPts balance');
      }

      return data.data;
    },
    onSuccess: (data, profileId) => {
      toast.success('Balance refreshed successfully');

      // Update the profile in the cache with the new balance
      queryClient.setQueryData(profileKeys.detail(profileId), (oldData: any) => {
        if (!oldData) return null;

        // Create a new ProfileMypts object if it doesn't exist or is a string
        const updatedProfileMypts = typeof oldData.ProfileMypts === 'object' && oldData.ProfileMypts !== null
          ? {
              ...oldData.ProfileMypts,
              currentBalance: data.balance,
              lifetimeMypts: data.lifetimeEarned
            }
          : {
              currentBalance: data.balance,
              lifetimeMypts: data.lifetimeEarned
            };

        return {
          ...oldData,
          myPtsBalance: data.balance,
          balance: data.balance,
          ProfileMypts: updatedProfileMypts
        };
      });
    },
    onError: (error: any) => {
      toast.error('Failed to refresh balance', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
};
