import axios from 'axios';

// Create axios instance with default config
const apiClientInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API URL for debugging
console.log('API client using URL:', apiClientInstance.defaults.baseURL);

// Request interceptor for adding auth token
apiClientInstance.interceptors.request.use(
  async (config) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        // Get tokens from multiple sources
        // 1. Check localStorage
        const accessTokenFromLocalStorage = localStorage.getItem('accessToken');
        const nextAuthTokenFromLocalStorage = localStorage.getItem('next-auth.session-token');
        const profileTokenFromLocalStorage = localStorage.getItem('selectedProfileToken');

        // 2. Check cookies
        const getCookieValue = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };

        const accessTokenFromCookie = getCookieValue('accessToken') ||
                                     getCookieValue('accesstoken') ||
                                     getCookieValue('client-accessToken');

        // Use the first available token for authorization
        const accessToken = accessTokenFromLocalStorage ||
                           nextAuthTokenFromLocalStorage ||
                           accessTokenFromCookie;

        // Use the first available profile token
        const profileToken = profileTokenFromLocalStorage;

        // Log available tokens for debugging
        console.log('API Request - Available tokens:', {
          hasAccessTokenInLocalStorage: !!accessTokenFromLocalStorage,
          hasNextAuthTokenInLocalStorage: !!nextAuthTokenFromLocalStorage,
          hasAccessTokenInCookie: !!accessTokenFromCookie,
          hasProfileToken: !!profileToken,
          url: config.url
        });

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add profile token if available
        if (profileToken) {
          config.headers['X-Profile-Token'] = profileToken;
        }

        // Add profile ID as a query parameter if available
        const profileId = localStorage.getItem('selectedProfileId');
        if (profileId && config.url && !config.url.includes('profileId=')) {
          const separator = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}profileId=${profileId}`;
        }

        // Add cache busting parameter to prevent caching
        if (config.url && !config.url.includes('_t=')) {
          const separator = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}_t=${Date.now()}`;
        }
      } catch (error) {
        console.error('Error setting auth headers:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper variables and functions for managing refresh state and queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthDataAndRedirect = () => {
  // Clear localStorage tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('next-auth.session-token');
  localStorage.removeItem('__Secure-next-auth.session-token');

  // Clear cookies
  const cookiesToClear = [
    'accessToken', 'accesstoken',
    'refreshToken', 'refreshtoken',
    'next-auth.session-token', '__Secure-next-auth.session-token',
    'client-accessToken', 'client-refreshToken'
  ];

  cookiesToClear.forEach(name => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=none`;
  });

  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    // Store the current path to redirect after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);

    // Add a small delay before redirecting to allow other operations to complete
    setTimeout(() => {
      // Redirect to login with cache busting
      window.location.href = `/login?nocache=${Date.now()}`;
    }, 100);

    console.log("Auth data cleared, redirecting to login.");
  }
};

// Response interceptor for error handling
apiClientInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Add more detailed logging for API errors
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Handle unauthorized errors (401) and not a retry attempt for token refresh itself
      if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/frontend-refresh') {
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._retry = true; // Mark this request as retried

          try {
            // The localRefreshToken is now primarily expected to be handled by the /api/auth/frontend-refresh route
            // if it's an HttpOnly cookie. If it's also in localStorage (e.g., from NextAuth session),
            // it could be passed, but the frontend-refresh route will prioritize the cookie.
            const localRefreshTokenFromStorage = localStorage.getItem('refreshToken');

            // If your /api/auth/frontend-refresh route solely relies on the HttpOnly cookie passed by the browser,
            // you might not even need to send a body or localRefreshTokenFromStorage here.
            // However, sending it if available from localStorage doesn't hurt, the backend can decide.
            // For this change, we assume /api/auth/frontend-refresh primarily uses the cookie it receives.

            console.log('Attempting token refresh via /api/auth/frontend-refresh...');
            // Use a relative path for the Next.js API route
            const refreshUrl = '/api/auth/frontend-refresh';

            const refreshResponse = await fetch(refreshUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              // Body might be optional if frontend-refresh uses HttpOnly cookie exclusively
              // For now, let's assume it can still accept it in the body as a fallback or for non-HttpOnly scenarios.
              body: JSON.stringify({ refreshToken: localRefreshTokenFromStorage }),
              credentials: 'include', // Important for sending cookies to the Next.js API route
            });

            const data = await refreshResponse.json();

            if (data.success && data.tokens) {
              console.log('Token refreshed successfully via interceptor (through frontend-refresh).');
              localStorage.setItem('accessToken', data.tokens.accessToken);
              if (data.tokens.refreshToken) {
                localStorage.setItem('refreshToken', data.tokens.refreshToken); // If backend sends new one
              }

              // Update the Authorization header for the original request and for subsequent requests
              apiClientInstance.defaults.headers.common['Authorization'] = 'Bearer ' + data.tokens.accessToken;
              originalRequest.headers['Authorization'] = 'Bearer ' + data.tokens.accessToken;

              // Dispatch event to notify NextAuth session needs update
              window.dispatchEvent(new CustomEvent('tokensRefreshed', { detail: data.tokens }));

              processQueue(null, data.tokens.accessToken);
              return apiClientInstance(originalRequest); // Retry the original request
            } else {
              console.error('Refresh token failed in interceptor:', data.message || 'Unknown error');
              clearAuthDataAndRedirect();
              processQueue(new Error(data.message || 'Refresh token failed'), null);
              return Promise.reject(new Error(data.message || 'Refresh token failed'));
            }
          } catch (refreshError: any) {
            console.error('Error during token refresh in interceptor:', refreshError);
            clearAuthDataAndRedirect();
            processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // Is refreshing, queue the original request
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                resolve(apiClientInstance(originalRequest));
              },
              reject: (err: any) => {
                reject(err);
              }
            });
          });
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', {
        request: error.request,
        url: error.config?.url,
        method: error.config?.method
      });
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
