import { API_BASE_URL } from '@/lib/config';

/**
 * API functions for social authentication
 */
export const socialAuthApi = {
  /**
   * Set the access token for API requests
   * @param token The access token to use for API requests
   */
  setToken: (token: string): void => {
    // Store the token for future API calls
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  },
  /**
   * Get the Google OAuth URL
   * @param frontendCallbackUrl The frontend URL to redirect to after authentication
   * @param state Optional state parameter for CSRF protection
   * @param referralCode Optional referral code to include in the authentication flow
   * @returns The Google OAuth URL
   */
  getGoogleAuthUrl: (frontendCallbackUrl: string, state?: string, referralCode?: string): string => {
    // Use the new endpoint for initiating Google login
    const baseUrl = `${API_BASE_URL}/auth/social/google`;
    const params = new URLSearchParams();

    // Pass the frontend URL (not the full callback URL) as a custom parameter
    // The backend will use this to redirect back to the frontend after authentication
    const frontendUrl = frontendCallbackUrl.split('/auth/google/callback')[0];
    params.append('callback_url', frontendUrl);

    if (state) {
      params.append('state', state);
    }

    // Include referral code if provided
    if (referralCode) {
      params.append('ref', referralCode);
    }

    return `${baseUrl}?${params.toString()}`;
  },

  /**
   * Exchange a Google authorization code for tokens
   * @param code The authorization code from Google
   * @param frontendCallbackUrl The frontend URL to redirect to after authentication
   * @param state Optional state parameter for CSRF protection
   * @returns Promise with the authentication result
   */
  exchangeGoogleCode: async (code: string, frontendCallbackUrl: string, state?: string) => {
    try {
      console.log('Exchanging Google code for tokens:', {
        code: code.substring(0, 10) + '...',
        frontendCallbackUrl,
        state: state ? state.substring(0, 5) + '...' : undefined
      });

      // Extract the base frontend URL
      const frontendUrl = frontendCallbackUrl.split('/auth/google/callback')[0];

      // With our new implementation, we don't need to make a POST request
      // The backend handles the code exchange during the redirect
      // This is just a fallback in case the redirect doesn't work
      const response = await fetch(`${API_BASE_URL}/auth/social/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          callback_url: frontendUrl,
          state
        }),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response from Google callback:', data);
        throw new Error(data.error || data.message || 'Failed to authenticate with Google');
      }

      return data;
    } catch (error) {
      console.error('Error exchanging Google code:', error);
      throw error;
    }
  },

  /**
   * Get the current user's profile from the social auth API
   * @returns Promise with the user profile
   */
  getCurrentUser: async () => {
    try {
      // Check for access token in localStorage
      let accessToken = null;
      if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('accessToken');
      }

      // Prepare headers with token if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('Including access token in Authorization header for social auth API');
      }

      const response = await fetch(`${API_BASE_URL}/auth/social/user/me`, {
        method: 'GET',
        headers,
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get user profile');
      }

      const data = await response.json();
      console.log('Social auth getCurrentUser response:', data);

      // Ensure we return a consistent format
      return {
        success: data.success || true,
        user: data.user || data.data || data,
        message: data.message || ''
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        success: false,
        user: null,
        message: error instanceof Error ? error.message : 'Failed to get user profile'
      };
    }
  },
};
