'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Token will be refreshed when it has 5 minutes left
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// When a user returns to the site, we'll try to refresh the token if it's been more than this time
const RETURNING_USER_REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to manage token refresh
 *
 * This hook will:
 * 1. Check the expiration of the current access token
 * 2. Refresh the token proactively before it expires
 * 3. Handle errors and redirect to login if needed
 *
 * @returns Object with isRefreshing state
 */
export function useTokenRefreshManager() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Function to check token expiration and refresh if needed
    const checkTokenExpiration = async () => {
      // Only run in browser environment
      if (typeof window === 'undefined') return;

      try {
        // Check if this is a returning user by looking at the last activity timestamp
        const lastActivity = localStorage.getItem('lastActivity');
        const now = Date.now();
        const isReturningUser = lastActivity && (now - parseInt(lastActivity)) > RETURNING_USER_REFRESH_THRESHOLD_MS;

        // Always update the last activity timestamp
        localStorage.setItem('lastActivity', now.toString());

        // Check multiple sources for access token
        const accessTokenFromLocalStorage = localStorage.getItem('accessToken');
        const nextAuthTokenFromLocalStorage = localStorage.getItem('next-auth.session-token');

        // Get tokens from cookies
        const getCookieValue = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };

        const accessTokenFromCookie = getCookieValue('accessToken') || getCookieValue('accesstoken');
        const clientAccessToken = getCookieValue('client-accessToken');

        // Use the first available token
        const accessToken = accessTokenFromLocalStorage || nextAuthTokenFromLocalStorage || accessTokenFromCookie || clientAccessToken;

        // Check for refresh token in multiple sources
        const refreshTokenFromLocalStorage = localStorage.getItem('refreshToken');
        const refreshTokenFromCookie = getCookieValue('refreshToken') || getCookieValue('refreshtoken');
        const hasRefreshToken = !!refreshTokenFromLocalStorage || !!refreshTokenFromCookie;

        if (!accessToken && !hasRefreshToken) {
          console.log('No access token or refresh token found, skipping token refresh check');
          return;
        }

        // If this is a returning user or we only have a refresh token, try to refresh immediately
        if (isReturningUser || (!accessToken && hasRefreshToken)) {
          console.log(`${isReturningUser ? 'Returning user' : 'Missing access token but has refresh token'}, refreshing token immediately...`);
          await refreshToken();
          return;
        }

        if (!accessToken) {
          console.log('No access token found, skipping token refresh check');
          return;
        }

        // Decode the JWT to check expiration
        // Note: This doesn't verify the signature, just decodes the payload
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const expiresAt = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();

          // Log token expiration for debugging - only in development or when close to expiry
          if (process.env.NODE_ENV === 'development' || expiresAt - now < REFRESH_THRESHOLD_MS * 2) {
            console.debug(`Token expires in ${Math.round((expiresAt - now) / 1000)} seconds (${Math.round((expiresAt - now) / 60000)} minutes)`);
          }

          // If token will expire in less than the threshold, refresh it
          if (expiresAt - now < REFRESH_THRESHOLD_MS) {
            console.log(`Token expires soon, refreshing...`);
            await refreshToken();
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          // Token might be invalid, try to refresh anyway
          await refreshToken();
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    };

    // Function to refresh the token
    const refreshToken = async () => {
      if (isRefreshing) return; // Prevent multiple simultaneous refreshes

      setIsRefreshing(true);

      try {
        // Try multiple sources for refresh token with detailed logging
        const refreshTokenFromLocalStorage = localStorage.getItem('refreshToken');

        // Get tokens from cookies
        const getCookieValue = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };

        const refreshTokenFromCookie = getCookieValue('refreshToken') || getCookieValue('refreshtoken');
        const accessToken = localStorage.getItem('accessToken') || getCookieValue('accessToken') || getCookieValue('accesstoken');
        const nextAuthToken = localStorage.getItem('next-auth.session-token');

        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.debug('Available token sources:', {
            hasRefreshTokenInLocalStorage: !!refreshTokenFromLocalStorage,
            hasRefreshTokenInCookie: !!refreshTokenFromCookie,
            hasAccessToken: !!accessToken,
            hasNextAuthToken: !!nextAuthToken
          });
        }

        // Use the first available refresh token
        const refreshToken = refreshTokenFromLocalStorage || refreshTokenFromCookie;

        console.log('Attempting to refresh token...');

        // Try the frontend-refresh endpoint first (which uses HttpOnly cookies)
        // Include the access token in the Authorization header as a fallback
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const frontendRefreshResponse = await fetch('/api/auth/frontend-refresh', {
          method: 'POST',
          headers,
          credentials: 'include' // Important to include cookies
        });

        // If frontend-refresh fails and we have a refresh token, fall back to the regular refresh endpoint
        let response;
        if (frontendRefreshResponse.ok) {
          response = frontendRefreshResponse;
        } else if (refreshToken) {
          console.log('Frontend refresh failed, trying regular refresh endpoint with explicit token...');
          response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include'
          });
        } else {
          console.error('No refresh token found and frontend refresh failed');

          // If we're not on the login page, redirect
          if (!window.location.pathname.includes('/login')) {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            toast.error("No valid session found. Please log in again.");
            setTimeout(() => {
              window.location.href = '/login?nocache=' + Date.now();
            }, 2000);
          }
          return;
        }

        const data = await response.json();

        if (data.success && data.tokens) {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', data.tokens.accessToken);
          if (data.tokens.refreshToken) {
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
            console.log('Refresh token updated');

            // Also set in cookie as backup (non-HttpOnly so it's accessible to JS)
            const secure = window.location.protocol === 'https:';
            const sameSite = secure ? 'None' : 'Lax';
            document.cookie = `refreshtoken=${data.tokens.refreshToken}; path=/; max-age=2592000; ${secure ? 'Secure;' : ''} SameSite=${sameSite}`; // 30 days
          }

          // Set access token in cookie as backup (non-HttpOnly so it's accessible to JS)
          const secure = window.location.protocol === 'https:';
          const sameSite = secure ? 'None' : 'Lax';
          document.cookie = `accesstoken=${data.tokens.accessToken}; path=/; max-age=3600; ${secure ? 'Secure;' : ''} SameSite=${sameSite}`; // 1 hour

          console.log('Token refreshed successfully');

          // Update the last activity timestamp
          localStorage.setItem('lastActivity', Date.now().toString());

          // If there was a user object in localStorage, make sure it's preserved
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const userData = JSON.parse(userStr);
              // Ensure the user data is preserved
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (e) {
            console.error('Error preserving user data:', e);
          }
        } else {
          console.error('Failed to refresh token:', data);

          // If we're not on the login page, redirect
          if (!window.location.pathname.includes('/login')) {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            toast.error("Session expired. Please log in again to continue.");
            setTimeout(() => {
              window.location.href = '/login?nocache=' + Date.now();
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Check immediately on mount
    checkTokenExpiration();

    // Then check periodically (every minute)
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [isRefreshing]);

  return { isRefreshing };
}
