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
      console.log(`Awarding ${amount} MyPts to profile ${profileId}`);
      
      // Try a direct API call to the backend
      try {
        const directResponse = await fetch(`https://my-profile-server-api.onrender.com/my-pts/award`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          credentials: 'include',
          body: JSON.stringify({
            profileId,
            amount: Number(amount),
            reason: reason || 'Admin reward'
          })
        });
        
        console.log('Direct award API response status:', directResponse.status);
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log('Direct award API response:', data);
          return data;
        }
      } catch (error) {
        console.error('Direct API call failed:', error);
      }
      
      // Fallback to the client-side API
      console.log('Falling back to client-side API');
      const response = await myPtsApi.awardMyPts(profileId, amount, reason);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to award MyPts');
      }
      
      return response;
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
      } else if (errorMessage.includes("hex string must be")) {
        errorMessage = "Invalid profile ID format. Please try selecting the profile again.";
      } else if (errorMessage.includes("Failed to issue")) {
        errorMessage = "Failed to issue new MyPts. Please contact the system administrator to check the MyPts supply.";
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
