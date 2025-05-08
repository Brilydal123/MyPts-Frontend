import axios from 'axios';
import { getAuthToken } from './auth-helper';
import { handleNetworkError } from '@/components/shared/error-handlers';

// Create axios instance with default config
const apiClientInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API URL for debugging
console.log('API client using URL:', apiClientInstance.defaults.baseURL);

// Request interceptor for adding auth token - safely handle browser vs server
apiClientInstance.interceptors.request.use(
  async (config) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        // Try to get the auth token from various sources
        const token = await getAuthToken();

        // Check for access token in localStorage (direct or from NextAuth)
        const accessToken = localStorage.getItem('accessToken') ||
                           localStorage.getItem('next-auth.session-token');

        // Use the token from getAuthToken or fallback to localStorage
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add profile token if available
        const profileToken = localStorage.getItem('selectedProfileToken');
        if (profileToken) {
          config.headers['X-Profile-Token'] = profileToken;
        }

        // Add profile ID as a query parameter if available and not an admin route
        const profileId = localStorage.getItem('selectedProfileId');
        const isAdminRoute = config.url && (config.url.includes('/admin/') || config.url.startsWith('/admin'));

        // Skip adding profileId for admin routes since admins don't have profiles
        if (profileId && config.url && !config.url.includes('profileId=') && !isAdminRoute) {
          const separator = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}profileId=${profileId}`;
          console.log(`Added profileId to request URL: ${config.url}`);
        }
      } catch (error) {
        console.error('Error setting auth headers:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClientInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add more detailed logging for API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });

      // Handle unauthorized errors (401)
      if (error.response.status === 401) {
        // Only attempt to handle if in browser context
        if (typeof window !== 'undefined') {
          console.log('Unauthorized, attempting to refresh token');

          // Check if this is a retry to avoid infinite loops
          const isRetry = error.config._isRetry;

          if (!isRetry && !error.config.url.includes('/auth/')) {
            error.config._isRetry = true;

            // This is not a retry and not an auth endpoint, so try to refresh the token
            return new Promise((resolve, reject) => {
              (async () => {
                try {
                  // Get the refresh token
                  const refreshToken = localStorage.getItem('refreshToken') ||
                                      document.cookie.match(/refreshtoken=([^;]+)/)?.[1];

                  if (refreshToken) {
                    console.log('Found refresh token, attempting to refresh access token');

                    // Call the refresh token endpoint
                    const response = await fetch('/api/auth/refresh-token', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ refreshToken }),
                      credentials: 'include'
                    });

                    const data = await response.json();

                    if (data.success && data.tokens) {
                      console.log('Token refresh successful, retrying original request');

                      // Store the new tokens
                      localStorage.setItem('accessToken', data.tokens.accessToken);

                      // Update the Authorization header for the failed request
                      error.config.headers.Authorization = `Bearer ${data.tokens.accessToken}`;

                      // Retry the original request
                      try {
                        const retryResponse = await axios(error.config);
                        resolve(retryResponse);
                        return;
                      } catch (retryError) {
                        console.error('Retry after token refresh failed:', retryError);
                        reject(retryError);
                        return;
                      }
                    } else {
                      console.error('Token refresh failed:', data);
                    }
                  }

                  // If we get here, token refresh failed
                  console.log('Token refresh failed or no refresh token found');

                  // Store the current profile ID to use after login
                  const profileId = localStorage.getItem('selectedProfileId');
                  if (profileId) {
                    localStorage.setItem('lastProfileId', profileId);
                  }

                  // Only redirect if we're not already on the login page
                  if (!window.location.pathname.includes('/login')) {
                    // Store the current location to redirect back after login
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);

                    // Redirect to login page
                    console.log('Redirecting to login page');
                    window.location.href = '/login';
                  }

                  reject(error);
                } catch (refreshError) {
                  console.error('Error during token refresh:', refreshError);
                  reject(error);
                }
              })();
            });
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', {
        request: error.request,
        url: error.config?.url,
        method: error.config?.method
      });

      // Handle network errors with our custom handler
      if (error.message === 'Network Error') {
        // Don't show toast here as it would appear for every failed request
        // Let the components handle the UI feedback
        handleNetworkError(error, { showToast: false });
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Setup:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    return Promise.reject(error);
  }
);

// Export as a named export
export const apiClient = apiClientInstance;

// Also include a default export
export default apiClientInstance;
