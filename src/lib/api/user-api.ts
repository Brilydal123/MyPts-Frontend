import { ApiResponse } from '@/types/api';
import { getSession } from 'next-auth/react';

// Make sure this matches your backend API URL
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_URL = "https://my-profile-server-api.onrender.com/api";
console.log('User API using URL:', API_URL);

/**
 * User API service
 */
export class UserApi {
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

    // Add authorization headers if session exists
    if (session) {
      console.log('Session found for User API request:', {
        hasAccessToken: !!session.accessToken,
        userId: session.user?.id
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
    } else {
      console.warn('No session found for User API request');
    }

    return headers;
  }

  /**
   * Get current user details
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const session = await getSession();
      console.log("🚀 ~ UserApi ~ getCurrentUser ~ session:", session)
      if (!session?.user?.id) {
        return {
          success: false,
          message: 'No user found in session'
        };
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
