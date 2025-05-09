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
          const isAuthEndpoint = error.config.url && (
            error.config.url.includes('/auth/') ||
            error.config.url.includes('/login') ||
            error.config.url.includes('/refresh-token')
          );

          // Skip token refresh for auth endpoints to avoid loops
          if (!isRetry && !isAuthEndpoint) {
            error.config._isRetry = true;

            // This is not a retry and not an auth endpoint, so try to refresh the token
            return new Promise((resolve, reject) => {
              (async () => {
                try {
                  // Try multiple sources for refresh token with detailed logging
                  const refreshTokenFromLocalStorage = localStorage.getItem('refreshToken');
                  const refreshTokenFromCookie = document.cookie.match(/refreshtoken=([^;]+)/)?.[1] ||
                                                document.cookie.match(/refreshToken=([^;]+)/)?.[1];
                  const nextAuthToken = localStorage.getItem('next-auth.session-token');

                  console.log('Available token sources for refresh:', {
                    hasRefreshTokenInLocalStorage: !!refreshTokenFromLocalStorage,
                    hasRefreshTokenInCookie: !!refreshTokenFromCookie,
                    hasNextAuthToken: !!nextAuthToken,
                    url: error.config.url
                  });

                  // Use the first available token
                  const refreshToken = refreshTokenFromLocalStorage || refreshTokenFromCookie;

                  if (refreshToken) {
                    console.log('Found refresh token, attempting to refresh access token');

                    // Try the frontend-refresh endpoint first (which uses HttpOnly cookies)
                    try {
                      console.log('Trying frontend-refresh endpoint first...');
                      const frontendRefreshResponse = await fetch('/api/auth/frontend-refresh', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        credentials: 'include' // Important to include cookies
                      });

                      // If frontend-refresh fails, fall back to the regular refresh endpoint
                      let response;
                      if (frontendRefreshResponse.ok) {
                        response = frontendRefreshResponse;
                        console.log('Frontend refresh succeeded');
                      } else {
                        console.log('Frontend refresh failed, trying regular refresh endpoint...');
                        response = await fetch('/api/auth/refresh-token', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ refreshToken }),
                          credentials: 'include'
                        });
                      }

                      const data = await response.json();

                      if (data.success && data.tokens) {
                        console.log('Token refresh successful, retrying original request');

                        // Store tokens in multiple places for better compatibility
                        localStorage.setItem('accessToken', data.tokens.accessToken);
                        if (data.tokens.refreshToken) {
                          localStorage.setItem('refreshToken', data.tokens.refreshToken);

                          // Also set in cookie as backup
                          document.cookie = `refreshtoken=${data.tokens.refreshToken}; path=/; max-age=2592000`; // 30 days
                        }

                        // Set access token in cookie as backup
                        document.cookie = `accesstoken=${data.tokens.accessToken}; path=/; max-age=3600`; // 1 hour

                        // Also store NextAuth compatible token for better integration
                        localStorage.setItem('next-auth.session-token', data.tokens.accessToken);

                        // Update the Authorization header for the failed request
                        error.config.headers.Authorization = `Bearer ${data.tokens.accessToken}`;

                        // Add header to indicate token is verified by client
                        error.config.headers["x-token-verified"] = "true";

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
                    } catch (refreshError) {
                      console.error('Error during token refresh:', refreshError);
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

                    // Clear all tokens to force a fresh login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('next-auth.session-token');
                    localStorage.removeItem('__Secure-next-auth.session-token');

                    // Clear cookies
                    document.cookie = 'accesstoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    document.cookie = 'refreshtoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    document.cookie = '__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

                    // Redirect to login page with cache busting
                    console.log('Redirecting to login page');
                    window.location.href = `/login?nocache=${Date.now()}`;
                  }

                  reject(error);
                } catch (refreshError) {
                  console.error('Error during token refresh:', refreshError);
                  reject(error);
                }
              })();
            });
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

// Export as a named export
export const apiClient = apiClientInstance;

// Also include a default export
export default apiClientInstance;
