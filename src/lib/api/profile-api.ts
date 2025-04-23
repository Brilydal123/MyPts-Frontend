import { ApiResponse } from '@/types/api';
import { getSession } from 'next-auth/react';

// Make sure this matches your backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
console.log('Profile API using URL:', API_URL);

/**
 * Profile API service
 */
export class ProfileApi {
  /**
   * Get headers with authentication tokens
   */
  private async getHeaders(profileToken?: string): Promise<HeadersInit> {
    // Get token from NextAuth session
    const session = await getSession();

    // Create headers with content type
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization headers if session exists
    if (session) {
      console.log('Session found for API request:', {
        hasAccessToken: !!session.accessToken,
        hasProfileToken: !!session.profileToken || !!profileToken,
        profileId: session.profileId
      });

      // We'll rely on cookies for authentication, but we'll still include the token
      // in the Authorization header as a fallback
      if (session.accessToken) {
        // Check if the token already has 'Bearer ' prefix
        const token = session.accessToken.startsWith('Bearer ')
          ? session.accessToken
          : `Bearer ${session.accessToken}`;

        headers['Authorization'] = token;
        console.log('Including token in Authorization header:', token);
      }

      // For profile-specific endpoints, we might need the profile token
      const token = profileToken || session.profileToken;
      if (token) {
        console.log('Profile token available:', token);
      }
    } else {
      console.warn('No session found for API request');
    }

    return headers;
  }

  /**
   * Get user profiles
   */
  async getUserProfiles(): Promise<ApiResponse<any>> {
    try {
      const session = await getSession();
      if (!session?.user?.id) {
        return {
          success: false,
          message: 'No user found in session'
        };
      }

      // Even if accessToken is empty, we'll proceed because the backend might be using cookies

      const headers = await this.getHeaders();
      console.log(`Making GET request to ${API_URL}/profiles/user-profiles`, { headers });

      // The correct endpoint is /api/profiles/user-profiles
      console.log('Full headers being sent:', JSON.stringify(headers));

      const response = await fetch(`${API_URL}/profiles/user-profiles`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies in the request
      });

      console.log(`Response from /profiles/user-profiles:`, {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();
      console.log('===== PROFILE API RESPONSE =====');
      console.log('Raw response data:', JSON.stringify(data, null, 2));
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));

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

      return {
        success: true,
        data: profiles,
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
  async getProfileDetails(profileId: string, profileToken?: string): Promise<ApiResponse<any>> {
    try {
      const headers = await this.getHeaders(profileToken);
      console.log(`Making GET request to ${API_URL}/profiles/${profileId}`, { headers });

      const response = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'GET',
        headers,
      });

      console.log(`Response from /profiles/${profileId}:`, {
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

      return {
        success: true,
        data: data.profile,
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
  async getProfileById(profileId: string): Promise<ApiResponse<any>> {
    return this.getProfileDetails(profileId);
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

      console.log(`Making GET request to /api/admin/profiles?${params.toString()}`);

      const response = await fetch(`/api/admin/profiles?${params.toString()}`, {
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
   * Get all profiles with pagination
   */
  async getAllProfiles(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const headers = await this.getHeaders();

      // Use the admin profiles endpoint
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      console.log(`Making GET request to /api/admin/profiles?${params.toString()}`);

      const response = await fetch(`/api/admin/profiles?${params.toString()}`, {
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

      const allProfilesResponse = await fetch(`/api/admin/profiles?limit=100`, {
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
