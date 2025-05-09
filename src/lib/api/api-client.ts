import axios from 'axios';
import { getAuthToken } from './auth-helper';
import { handleNetworkError } from '@/components/shared/error-handlers';

// Create axios instance with default config
const apiClientInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Include credentials (cookies) in requests
  withCredentials: true,
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

        // Determine if the current request is for an endpoint that uses cookie-only auth
        const cookieOnlyAuthEndpoints = ['/referrals', '/referrals/tree', '/notifications', '/notifications/unread-count'];
        const isCookieOnlyAuthRoute = config.url && cookieOnlyAuthEndpoints.some(endpoint => config.url!.startsWith(endpoint));

        // Only add Authorization header if it's NOT a cookie-only auth route
        if (!isCookieOnlyAuthRoute) {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Add header to indicate token is verified by client
            config.headers["x-token-verified"] = "true";
          } else if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            // Add header to indicate token is verified by client
            config.headers["x-token-verified"] = "true";
          }
        } else {
          // For cookie-only auth routes, ensure no Authorization header is present,
          // relying solely on cookies via withCredentials: true
          delete config.headers.Authorization;
          delete config.headers["x-token-verified"];
          console.log(`Cookie-only auth route (${config.url}): Relying on cookie-based auth. Authorization header removed.`);
        }

        // Add profile token if available
        const profileToken = localStorage.getItem('selectedProfileToken');
        if (profileToken) {
          config.headers['X-Profile-Token'] = profileToken;
        }

        // Store admin status in a safer way that doesn't trigger CORS issues
        // Instead of adding custom headers that might not be allowed by the backend's CORS config,
        // we'll use standard Authorization headers and handle admin status in the backend
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const userRole = localStorage.getItem('userRole');

        if (isAdmin || userRole === 'admin') {
          console.log('User has admin privileges, using standard auth headers');
          // We're not adding custom headers that might trigger CORS issues
          // The backend should determine admin status based on the user ID in the token
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
  async (error) => {
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
          console.log('Unauthorized, attempting to refresh token via NextAuth.js');

          // Check if this is a retry to avoid infinite loops
          const isRetry = error.config._isRetry;
          const isAuthEndpoint = error.config.url && (
            error.config.url.includes('/auth/') ||
            error.config.url.includes('/login') ||
            error.config.url.includes('/refresh-token')
          );

          // Skip token refresh for auth endpoints and retries to avoid loops
          if (!isRetry && !isAuthEndpoint) {
            error.config._isRetry = true;

            try {
              // Import the checkSessionErrors function
              const { checkSessionErrors } = await import('./auth-helper');
              
              // Check if NextAuth session already has errors
              const sessionError = await checkSessionErrors();
              
              if (sessionError) {
                console.error('NextAuth session already has errors:', sessionError);
                // Session already has errors, redirect to login
                redirectToLogin();
                return Promise.reject(new Error(`Session error: ${sessionError}`));
              }
              
              // Get a new session which will trigger NextAuth's jwt callback
              // and its internal token refresh mechanism via /api/auth/frontend-refresh
              const { getSession } = await import('next-auth/react');
              
              // Note: We're calling getSession() without parameters to get a fresh session
              // This should still trigger the jwt callback in NextAuth.js
              const newSession = await getSession();
              
              if (newSession?.error) {
                console.error('NextAuth refresh failed:', newSession.error);
                // NextAuth refresh failed, redirect to login
                redirectToLogin();
                return Promise.reject(new Error(`NextAuth refresh failed: ${newSession.error}`));
              }
              
              if (newSession?.accessToken) {
                console.log('NextAuth token refresh successful, retrying original request');
                
                // Update the Authorization header for the failed request with the new token
                error.config.headers.Authorization = `Bearer ${newSession.accessToken}`;
                
                // Retry the original request with the new token
                return axios(error.config);
              } else {
                console.error('NextAuth refresh did not return a new accessToken');
                redirectToLogin();
                return Promise.reject(new Error('NextAuth refresh did not return a new accessToken'));
              }
            } catch (refreshError) {
              console.error('Error during NextAuth token refresh:', refreshError);
              redirectToLogin();
              return Promise.reject(refreshError);
            }
          } else if (isRetry) {
            console.log('This is a retry request, not attempting token refresh again');
          } else if (isAuthEndpoint) {
            console.log('This is an auth endpoint, not attempting token refresh');
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

// Helper function to handle redirecting to login
function redirectToLogin() {
  // Only redirect if we're not already on the login page
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    // Store the current location to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    // Store the current profile ID to use after login
    const profileId = localStorage.getItem('selectedProfileId');
    if (profileId) {
      localStorage.setItem('lastProfileId', profileId);
    }

    // Redirect to login page with cache busting
    console.log('Redirecting to login page');
    window.location.href = `/login?nocache=${Date.now()}`;
  }
}

// Export as a named export
export const apiClient = apiClientInstance;

// Also include a default export
export default apiClientInstance;
