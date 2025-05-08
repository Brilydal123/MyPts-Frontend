'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Token will be refreshed when it has 5 minutes left
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

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
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        // Decode the JWT to check expiration
        // Note: This doesn't verify the signature, just decodes the payload
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const expiresAt = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();

          // If token will expire in less than the threshold, refresh it
          if (expiresAt - now < REFRESH_THRESHOLD_MS) {
            console.log(`Token expires in ${Math.round((expiresAt - now) / 1000)} seconds, refreshing...`);
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
        const refreshToken = localStorage.getItem('refreshToken') ||
                            document.cookie.match(/refreshtoken=([^;]+)/)?.[1];

        if (!refreshToken) {
          console.error('No refresh token found');
          return;
        }

        console.log('Proactively refreshing token...');

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
          localStorage.setItem('accessToken', data.tokens.accessToken);
          console.log('Token refreshed proactively');
        } else {
          console.error('Failed to refresh token:', data);

          // If we're not on the login page, redirect
          if (!window.location.pathname.includes('/login')) {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);

            toast.error("Session expired. Please log in again to continue.");

            // Short delay to allow toast to be seen
            setTimeout(() => {
              window.location.href = '/login';
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
