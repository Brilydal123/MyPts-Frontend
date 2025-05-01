import { ApiResponse } from '@/types/api';
import { getSession } from 'next-auth/react';

// Make sure this matches your backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
// const API_URL = "https://my-profile-server-api.onrender.com/api";
console.log('User API using URL:', API_URL);

/**
 * User API service
 */
export class UserApi {
  private token: string | null = null;

  /**
   * Set the token to use for API requests
   */
  setToken(token: string) {
    this.token = token;
    console.log('Token set in UserApi');
  }

  /**
   * Get headers with authentication tokens
   */
  private async getHeaders(): Promise<HeadersInit> {
    // Get token from NextAuth session
    const session = await getSession();

    // Create headers with content type
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Check for token in localStorage (for social auth)
    let accessTokenFromStorage = '';
    if (typeof window !== 'undefined') {
      accessTokenFromStorage = localStorage.getItem('accessToken') || '';
    }

    // Add authorization headers if session exists or we have a token
    if (session || this.token || accessTokenFromStorage) {
      console.log('Authentication info for User API request:', {
        hasSession: !!session,
        hasAccessTokenInSession: !!session?.accessToken,
        hasAccessTokenInInstance: !!this.token,
        hasAccessTokenInStorage: !!accessTokenFromStorage,
        userId: session?.user?.id
      });

      // Use the best available token
      // Priority: 1. Instance token, 2. Session token, 3. localStorage token
      const tokenToUse = this.token || session?.accessToken || accessTokenFromStorage;

      if (tokenToUse) {
        // Check if the token already has 'Bearer ' prefix
        const formattedToken = tokenToUse.startsWith('Bearer ')
          ? tokenToUse
          : `Bearer ${tokenToUse}`;

        headers['Authorization'] = formattedToken;
        console.log('Including token in Authorization header');
      }
    } else {
      console.warn('No authentication info found for User API request');
    }

    return headers;
  }

  /**
   * Get current user details
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const session = await getSession();
      console.log("🚀 ~ UserApi ~ getCurrentUser ~ session:", session);

      // Check for user data in localStorage (for social auth)
      let userDataFromStorage = null;
      let accessTokenFromStorage = null;

      if (typeof window !== 'undefined') {
        const userDataString = localStorage.getItem('user');
        accessTokenFromStorage = localStorage.getItem('accessToken');

        try {
          if (userDataString) {
            userDataFromStorage = JSON.parse(userDataString);
          }
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }

      console.log('User data in localStorage:', userDataFromStorage ? 'Present' : 'Not found');
      console.log('Access token in localStorage:', accessTokenFromStorage ? 'Present' : 'Not found');

      // For social auth, we might not have a session but we have data in localStorage
      if (!session?.user?.id && !userDataFromStorage) {
        return {
          success: false,
          message: 'No user found in session or localStorage'
        };
      }

      // If we have a token in the instance, use it
      if (this.token) {
        console.log('Using token from instance');
      }

      // Even if accessToken is empty, we'll proceed because the backend might be using cookies
      const headers = await this.getHeaders();
      console.log(`Making GET request to ${API_URL}/users/me`, { headers });

      // Make sure to include credentials to send cookies with the request
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers,
        credentials: 'include', // This is crucial for sending cookies
      });

      // Log cookies for debugging
      console.log('Document cookies:', document.cookie);

      console.log(`Response from /users/me:`, {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();
      console.log('===== USER API RESPONSE =====');
      console.log('Raw response data:', JSON.stringify(data, null, 2));
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch user details',
          error: data.error,
        };
      }

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      console.error(`Error in getCurrentUser:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user details',
      };
    }
  }
}

// Export instance
export const userApi = new UserApi();
