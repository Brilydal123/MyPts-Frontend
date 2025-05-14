'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { refreshAccessToken, isTokenExpired, parseJwt } from '@/lib/auth/token-service';
import { getCookie } from '@/lib/auth/auth-utils';
import AUTH_CONFIG from '@/lib/auth/auth-config';

interface TokenRefreshProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages token refresh
 *
 * This component:
 * 1. Periodically checks token expiration
 * 2. Refreshes tokens before they expire
 * 3. Handles network reconnection
 */
export function TokenRefreshProvider({ children }: TokenRefreshProviderProps) {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const networkCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Skip token refresh on auth pages
  const isAuthPage = AUTH_CONFIG.publicRoutes.some(route => pathname?.includes(route));

  // Function to check token expiration and refresh if needed
  const checkTokenExpiration = async () => {
    if (isRefreshing || isAuthPage) return;

    try {
      // Get access token from cookies
      const accessToken = getCookie('accessToken') || getCookie('client-accessToken');

      if (!accessToken) return;

      // Check if token is expired or will expire soon
      if (isTokenExpired(accessToken, AUTH_CONFIG.tokens.refreshThreshold)) {
        console.log('Token expires soon, refreshing...');
        await refreshToken();
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  };

  // Function to refresh the token
  const refreshToken = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // First try using the token refresh API
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important to include cookies
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.tokens?.accessToken) {
          console.log('Token refreshed successfully');

          // Update localStorage with new tokens
          localStorage.setItem('accessToken', data.tokens.accessToken);

          // Set token expiry time (1 hour from now)
          const expiryTime = Date.now() + (60 * 60 * 1000);
          localStorage.setItem('tokenExpiry', expiryTime.toString());

          // Update profile information if available
          if (data.tokens.profileId) {
            localStorage.setItem('selectedProfileId', data.tokens.profileId);
          }

          if (data.tokens.profileToken) {
            localStorage.setItem('selectedProfileToken', data.tokens.profileToken);
          }

          // Update last activity timestamp
          localStorage.setItem('lastActivity', Date.now().toString());

          return;
        }
      }

      // If the API call fails, try the refreshAccessToken function
      const result = await refreshAccessToken();

      if (!result) {
        console.error('Failed to refresh token');

        // If we're not on an auth page, redirect to login
        if (!isAuthPage) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
          }

          toast.error('Your session has expired. Please log in again.');

          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = `${AUTH_CONFIG.routes.login}?nocache=${Date.now()}`;
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online');

      // Refresh token when coming back online
      checkTokenExpiration();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may be unavailable.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set up periodic token check
  useEffect(() => {
    // Skip for auth pages
    if (isAuthPage) return;

    // Initial check
    checkTokenExpiration();

    // Set up periodic check (every minute)
    refreshTimerRef.current = setInterval(checkTokenExpiration, 60000);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [pathname, isAuthPage]);

  // Check for returning users
  useEffect(() => {
    // Skip for auth pages
    if (isAuthPage) return;

    const checkReturningUser = async () => {
      try {
        const accessToken = getCookie('accessToken') || getCookie('client-accessToken');

        if (!accessToken) return;

        const lastActivity = localStorage.getItem('lastActivity');
        const now = Date.now();

        if (lastActivity) {
          const timeSinceLastActivity = now - parseInt(lastActivity);

          // If user is returning after some time, refresh token
          if (timeSinceLastActivity > AUTH_CONFIG.tokens.refreshThreshold * 2) {
            console.log('Returning user detected, refreshing token...');
            await refreshToken();
          }
        }

        // Update last activity
        localStorage.setItem('lastActivity', now.toString());
      } catch (error) {
        console.error('Error checking returning user:', error);
      }
    };

    checkReturningUser();

    // Update last activity periodically
    networkCheckTimerRef.current = setInterval(() => {
      localStorage.setItem('lastActivity', Date.now().toString());
    }, 300000); // Every 5 minutes

    return () => {
      if (networkCheckTimerRef.current) {
        clearInterval(networkCheckTimerRef.current);
      }
    };
  }, [isAuthPage]);

  return <>{children}</>;
}
