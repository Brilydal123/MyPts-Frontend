import { ApiResponse } from '@/types/api';
import { getSession } from 'next-auth/react';

// Make sure this matches your backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
console.log('Profile API using URL:', API_URL);

/**
 * Profile API service
 */
export class ProfileApi {
  private token: string | null = null;
  private profileCache: Map<string, any> = new Map(); // Cache for individual profiles
  private userProfilesCache: { data: any; timestamp: number } | null = null; // Cache for user profiles with timestamp
  private cacheExpiry = 60000; // Cache expiry time in ms (1 minute)

  /**
   * Set the token to use for API requests
   */
  setToken(token: string) {
    this.token = token;
    console.log('Token set in ProfileApi');
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.profileCache.clear();
    this.userProfilesCache = null;
    console.log('Profile cache cleared');
  }

  /**
   * Get a profile from cache or fetch it
   */
  private getCachedProfile(profileId: string): any | null {
    return this.profileCache.get(profileId) || null;
  }

  /**
   * Store a profile in cache
   */
  private cacheProfile(profileId: string, profile: any): void {
    this.profileCache.set(profileId, profile);
  }

  /**
   * Get headers with authentication tokens
   */
  private async getHeaders(profileToken?: string): Promise<HeadersInit> {
    // Get token from NextAuth session
    const session = await getSession();

    // Create headers with content type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Try to get tokens from localStorage first (for social auth users)
    let accessToken = '';
    let storedProfileToken = '';

    if (typeof window !== 'undefined') {
      accessToken = localStorage.getItem('accessToken') || '';
      storedProfileToken = localStorage.getItem('selectedProfileToken') || '';
    }

    // Add authorization headers if session exists or we have a token in localStorage
    if (session || accessToken) {
      console.log('Authentication info for API request:', {
        hasSession: !!session,
        hasAccessTokenInSession: !!session?.accessToken,
        hasAccessTokenInStorage: !!accessToken,
        hasProfileTokenInSession: !!session?.profileToken,
        hasProfileTokenInStorage: !!storedProfileToken,
        hasProvidedProfileToken: !!profileToken,
        profileId: session?.profileId || localStorage.getItem('selectedProfileId')
      });

      // Use the access token from session or localStorage
      const tokenToUse = session?.accessToken || accessToken;

      if (tokenToUse) {
        // Check if the token already has 'Bearer ' prefix
        const formattedToken = tokenToUse.startsWith('Bearer ')
          ? tokenToUse
          : `Bearer ${tokenToUse}`;

        headers['Authorization'] = formattedToken;
        console.log('Including token in Authorization header');
      }

      // For profile-specific endpoints, we might need the profile token
      const profileTokenToUse = profileToken || storedProfileToken || session?.profileToken;
      if (profileTokenToUse) {
        console.log('Profile token available');
      }
    } else {
      console.warn('No authentication info found for API request');
    }

    return headers;
  }

  /**
   * Get user profiles
   */
  async getUserProfiles(forceRefresh = false): Promise<ApiResponse<any>> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh && this.userProfilesCache &&
          (Date.now() - this.userProfilesCache.timestamp < this.cacheExpiry)) {
        console.log('Returning user profiles from cache');
        return {
          success: true,
          data: this.userProfilesCache.data,
          fromCache: true
        };
      }

      // Check for authentication from NextAuth session or social auth
      const session = await getSession();
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const isSocialAuthenticated = !!accessToken && !!userDataString;

      console.log('Authentication check in getUserProfiles:', {
        hasSession: !!session,
        hasSessionUser: !!session?.user,
        hasSessionUserId: !!session?.user?.id,
        isSocialAuthenticated,
        hasAccessToken: !!accessToken,
        hasUserData: !!userDataString
      });

      // If not authenticated via NextAuth or social auth, return error
      if (!session?.user?.id && !isSocialAuthenticated) {
        return {
          success: false,
          message: 'No user found in session or social authentication'
        };
      }

      // Even if accessToken is empty, we'll proceed because the backend might be using cookies
      const headers = await this.getHeaders();
      console.log(`Making GET request to ${API_URL}/profiles/p`, { headers });

      const response = await fetch(`${API_URL}/profiles/p`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies in the request
      });

      console.log(`Response from /profiles/p:`, {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch user profiles',
          error: data.error,
        };
      }

      // The API might return data in different formats
      // It could be { success: true, profiles: {...} }
      // Or it could be { success: true, data: { profiles: {...} } }
      const profiles = data.profiles || (data.data && data.data.profiles) || [];

      console.log('Raw profiles data:', JSON.stringify(profiles, null, 2));

      // No default profile creation - handled by the backend

      // Process profiles to ensure they have proper names and structure
      const processedProfiles = Array.isArray(profiles) ? profiles.map(profile => {
        // Ensure profile has a proper name
        if (profile.name === 'Untitled Profile' && profile.username) {
          profile.name = profile.username;
        }

        // Format the profile name with the profile type
        // Extract profile type for display
        const profileType = profile.profileType
          ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
          : profile.type?.subtype
            ? profile.type.subtype.charAt(0).toUpperCase() + profile.type.subtype.slice(1)
            : 'Personal';

        // Get the base name (either username or name)
        let baseName = profile.name;

        // Capitalize the first letter of the name
        if (baseName && typeof baseName === 'string' && baseName.length > 0) {
          baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        }

        // Format the name as "Name ProfileType Profile"
        profile.formattedName = `${baseName} ${profileType} Profile`;

        // Cache individual profiles
        if (profile._id) {
          this.cacheProfile(profile._id, profile);
        }

        return profile;
      }) : profiles;

      // Update cache
      this.userProfilesCache = {
        data: processedProfiles,
        timestamp: Date.now()
      };

      return {
        success: true,
        data: processedProfiles,
      };
    } catch (error) {
      console.error(`Error in getUserProfiles:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user profiles',
      };
    }
  }

  /**
   * Get profile details
   */
  async getProfileDetails(profileId: string, profileToken?: string, forceRefresh = false): Promise<ApiResponse<any>> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedProfile = this.getCachedProfile(profileId);
        if (cachedProfile) {
          console.log(`Returning profile ${profileId} from cache`);
          return {
            success: true,
            data: cachedProfile,
            fromCache: true
          };
        }
      }

      // If profile is not in cache or we're forcing refresh, fetch it
      const headers: Record<string, string> = await this.getHeaders(profileToken) as Record<string, string>;
      console.log(`Making GET request to ${API_URL}/profiles/p/${profileId}`, { headers });

      // For social auth users, we need to include the access token in the Authorization header
      // Get the access token from localStorage if available
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken && !headers['Authorization']) {
          headers['Authorization'] = `Bearer ${accessToken}`;
          console.log('Added access token from localStorage to Authorization header');
        }
      }

      const response = await fetch(`${API_URL}/profiles/p/${profileId}`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies in the request
      });

      console.log(`Response from /profiles/p/${profileId}:`, {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch profile details',
          error: data.error,
        };
      }

      // Process profile to ensure it has a proper name
      const profile = data.profile;
      if (profile) {
        // Ensure profile has a proper name
        if (profile.name === 'Untitled Profile' && profile.username) {
          profile.name = profile.username;
        }

        // Format the profile name with the profile type
        // Extract profile type for display
        const profileType = profile.profileType
          ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
          : profile.type?.subtype
            ? profile.type.subtype.charAt(0).toUpperCase() + profile.type.subtype.slice(1)
            : 'Personal';

        // Get the base name (either username or name)
        let baseName = profile.name;

        // Capitalize the first letter of the name
        if (baseName && typeof baseName === 'string' && baseName.length > 0) {
          baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        }

        // Format the name as "Name ProfileType Profile"
        profile.formattedName = `${baseName} ${profileType} Profile`;

        // Cache the profile
        this.cacheProfile(profileId, profile);
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      console.error(`Error in getProfileDetails:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch profile details',
      };
    }
  }

  /**
   * Get profile by ID (alias for getProfileDetails)
   */
  async getProfileById(profileId: string, forceRefresh = false): Promise<ApiResponse<any>> {
    return this.getProfileDetails(profileId, undefined, forceRefresh);
  }

  /**
   * Search profiles
   */
  async searchProfiles(query: string): Promise<ApiResponse<any[]>> {
    try {
      const headers = await this.getHeaders();

      // Use the admin profiles endpoint which is known to work
      const params = new URLSearchParams();
      params.append('name', query); // Search by name
      params.append('limit', '10'); // Limit results

      console.log(`Making GET request to ${API_URL}/admin/profiles?${params.toString()}`);

      const response = await fetch(`${API_URL}/admin/profiles?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      console.log(`Response from /api/admin/profiles:`, {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Failed to search profiles',
          error: data.error,
        };
      }

      return {
        success: true,
        data: data.data?.profiles || [],
      };
    } catch (error) {
      console.error(`Error in searchProfiles:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search profiles',
        data: [],
      };
    }
  }

  /**
   * Get all profiles with pagination and sorting
   */
  async getAllProfiles(options: {
    page?: string | number;
    limit?: string | number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<any>> {
    try {
      const headers = await this.getHeaders();

      // Use the admin profiles endpoint
      const params = new URLSearchParams();
      params.append('page', options.page?.toString() || '1');
      params.append('limit', options.limit?.toString() || '10');

      // Add sorting parameters if provided
      if (options.sortBy) {
        params.append('sortBy', options.sortBy);
      }
      if (options.sortOrder) {
        params.append('sortOrder', options.sortOrder);
      }

      console.log(`Making GET request to ${API_URL}/admin/profiles?${params.toString()}`);

      const response = await fetch(`${API_URL}/admin/profiles?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      console.log(`Response from /api/admin/profiles:`, {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Failed to fetch profiles',
          error: data.error,
        };
      }

      return {
        success: true,
        data: data.data || {},
      };
    } catch (error) {
      console.error(`Error in getAllProfiles:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch profiles',
      };
    }
  }

  /**
   * Get profile by ID using multiple approaches
   */
  async getProfileByIdAdmin(profileId: string): Promise<ApiResponse<any>> {
    try {
      const headers = await this.getHeaders();

      // Skip the ID filter approach since it's not working correctly
      console.log(`Skipping ID filter approach due to backend issues`);

      // Skip the direct profile endpoint since it's causing errors
      console.log(`Skipping direct profile endpoint due to known issues`);

      // Third try: Use the all profiles endpoint and filter client-side
      console.log(`Third attempt: Fetching all profiles and filtering client-side`);

      const allProfilesResponse = await fetch(`${API_URL}/admin/profiles?limit=100`, {
        method: 'GET',
        headers,
        credentials: 'include',
      }).catch(err => {
        console.error('Error in all profiles fetch:', err);
        return null;
      });

      if (allProfilesResponse && allProfilesResponse.ok) {
        const allProfilesData = await allProfilesResponse.json();
        console.log('All profiles response:', allProfilesData);

        if (allProfilesData.success && allProfilesData.data?.profiles) {
          const matchingProfile = allProfilesData.data.profiles.find(
            (p: any) => p._id === profileId || p.id === profileId
          );

          if (matchingProfile) {
            return {
              success: true,
              data: matchingProfile,
            };
          }
        }
      }

      // If all attempts failed, return an error
      return {
        success: false,
        message: 'Failed to fetch profile by ID after multiple attempts',
      };
    } catch (error) {
      console.error(`Error in getProfileByIdAdmin:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch profile by ID',
      };
    }
  }
}

// Export instance
export const profileApi = new ProfileApi();
