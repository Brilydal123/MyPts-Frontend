'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  const [socialAuthUser, setSocialAuthUser] = useState<any>(null);
  const [isSocialAuthenticated, setIsSocialAuthenticated] = useState(false);
  const [localStorageAdmin, setLocalStorageAdmin] = useState<boolean>(false);

  // Effect to check both NextAuth and social authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const nextAuthToken = localStorage.getItem('next-auth.session-token');
      const profileToken = localStorage.getItem('selectedProfileToken');
      const userDataString = localStorage.getItem('user');

      if (accessToken && userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          const enhancedUserData = {
            ...userData,
            name: userData.fullName || userData.name || userData.username,
            image: userData.profileImage || userData.image
          };
          setSocialAuthUser(enhancedUserData);
          setIsSocialAuthenticated(true);
        } catch (e) {
          console.error('Error parsing user data:', e);
          setIsSocialAuthenticated(false);
        }
      }

      // Check admin status
      const storedIsAdmin = localStorage?.getItem('isAdmin') === 'true';
      setLocalStorageAdmin(storedIsAdmin);

      // If no valid tokens, redirect to login
      if (!accessToken && !nextAuthToken && !profileToken && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  const isAuthenticated = status === 'authenticated' || isSocialAuthenticated;
  const isLoading = status === 'loading' && !isSocialAuthenticated;

  const isAdmin =
    session?.user?.role === 'admin' ||
    session?.user?.isAdmin === true ||
    localStorageAdmin ||
    socialAuthUser?.role === 'admin';

  const user = session?.user || socialAuthUser;

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        console.log('Starting logout process...');

        // Store tokens before clearing for API calls
        const accessToken = localStorage.getItem('accessToken') || session?.accessToken;

        // 1. Clear localStorage immediately
        console.log('Clearing localStorage...');
        localStorage.clear();

        // 2. Clear sessionStorage
        console.log('Clearing sessionStorage...');
        sessionStorage.clear();

        // 3. Clear cookies with multiple approaches
        console.log('Clearing cookies...');
        const cookiesToClear = document.cookie.split(';');
        const paths = ['/', '/api', '/dashboard', '/login', ''];
        const domains = [window.location.hostname, `.${window.location.hostname}`, ''];

        // Clear all cookies found
        cookiesToClear.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (!name) return;

          paths.forEach(path => {
            domains.forEach(domain => {
              if (domain) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
              } else {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
              }
            });
          });

          // Also try secure flag combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`;
        });

        // 4. Specifically target auth-related cookies
        console.log('Targeting specific auth cookies...');
        [
          'next-auth.session-token', 'next-auth.callback-url', 'next-auth.csrf-token',
          '__Secure-next-auth.session-token', '__Host-next-auth.csrf-token',
          'accesstoken', 'refreshtoken', 'accessToken', 'refreshToken',
          'profileId', 'profileToken', 'selectedProfileId', 'selectedProfileToken'
        ].forEach(cookieName => {
          paths.forEach(path => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
          });
        });

        // 5. Call API endpoints in the background (don't await)
        console.log('Calling logout API endpoints...');
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

        // Don't await these calls to ensure immediate redirect
        if (accessToken) {
          fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }).catch(error => console.error('Error during backend logout:', error));
        }

        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        }).catch(error => console.error('Error during API logout:', error));

        // 6. Sign out from NextAuth (don't await)
        console.log('Signing out from NextAuth...');
        signOut({ redirect: false }).catch(error => console.error('Error during NextAuth signOut:', error));

        // 7. Immediately redirect to login with cache-busting parameter
        console.log('Redirecting to login page...');
        window.location.href = `/login?logout=true&t=${Date.now()}`;
        return;
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      window.location.href = `/login?logout=true&error=1&t=${Date.now()}`;
    }
  };

  // Get tokens and IDs from various sources
  const profileId = session?.profileId ||
    (typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null);

  const accessToken = session?.accessToken ||
    (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  const profileToken = session?.profileToken ||
    (typeof window !== 'undefined' ? localStorage.getItem('selectedProfileToken') : null);

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    logout,
    user,
    accessToken,
    profileId,
    profileToken,
    isSocialAuthenticated
  };
}
