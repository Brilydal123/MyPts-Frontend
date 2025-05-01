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
        // Clear localStorage
        localStorage.clear();

        // Clear cookies
        const cookiesToClear = document.cookie.split(';');
        const paths = ['/', '/api', ''];
        const domains = [window.location.hostname, `.${window.location.hostname}`, ''];

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

        // Clear specific auth cookies
        ['next-auth.session-token', 'next-auth.callback-url', 'next-auth.csrf-token',
         '__Secure-next-auth.session-token', 'accesstoken', 'refreshtoken'].forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
        });
      }

      // Call API endpoints
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

        if (session?.accessToken) {
          await fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
        }

        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Error during API logout:', error);
      }

      // Sign out from NextAuth
      await signOut({ redirect: false });

    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Force redirect to login
      window.location.href = '/login';
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
