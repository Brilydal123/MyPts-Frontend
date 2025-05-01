'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [directRole, setDirectRole] = useState<string | null>(null);
  const [isDirectAdmin, setIsDirectAdmin] = useState(false);
  const [socialAuthUser, setSocialAuthUser] = useState<any>(null);

  // Check for social authentication
  const [isSocialAuthenticated, setIsSocialAuthenticated] = useState(false);

  // Effect to check for social authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const userDataString = localStorage.getItem('user');

      if (accessToken && userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          console.log('Social auth user data from localStorage:', userData);

          // Make sure we have the correct properties
          const enhancedUserData = {
            ...userData,
            // Ensure we have name property (for compatibility with NextAuth)
            name: userData.fullName || userData.name || userData.username,
            // Ensure we have image property (for compatibility with NextAuth)
            image: userData.profileImage || userData.image
          };

          setSocialAuthUser(enhancedUserData);
          setIsSocialAuthenticated(true);
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
    }
  }, []);

  const isAuthenticated = status === 'authenticated' || isSocialAuthenticated;
  const isLoading = status === 'loading' && !isSocialAuthenticated;

  // State to store localStorage values after component mounts
  const [localStorageAdmin, setLocalStorageAdmin] = useState<boolean>(false);

  // Effect to safely access localStorage after component mounts
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const storedIsAdmin = localStorage?.getItem('isAdmin') === 'true';
      setLocalStorageAdmin(storedIsAdmin);
    }
  }, []);

  // Determine admin status from multiple sources
  const isAdmin =
    session?.user?.role === 'admin' || // From session
    session?.user?.isAdmin === true || // From session fallback
    isDirectAdmin || // From direct API call
    localStorageAdmin || // From local storage (set after mount)
    socialAuthUser?.role === 'admin'; // From social auth user

  // Debug logging only in development mode
  if (process.env.NODE_ENV === 'development') {
    // Log only once when session changes to avoid console spam
    useEffect(() => {
      console.log('Auth user:', session?.user);
      console.log('Is admin from session:', session?.user?.role === 'admin' || session?.user?.isAdmin === true);
      console.log('Is admin from direct API:', isDirectAdmin);
      console.log('Final admin status:', isAdmin);
    }, [session?.user?.id, isDirectAdmin, isAdmin]);
  }

  // Track if we've already fetched the user role to prevent excessive API calls
  const [hasFetchedRole, setHasFetchedRole] = useState(false);

  // If authenticated, fetch directly from API only once per session
  useEffect(() => {
    // Skip if we've already fetched the role or if not authenticated
    if (!isAuthenticated || !session?.accessToken || hasFetchedRole) {
      return;
    }

    // Check if we already have role information in localStorage
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

      // If we have stored role info and it matches the session, don't fetch again
      if (storedRole &&
          ((storedRole === 'admin' && session?.user?.isAdmin) ||
           (storedRole === session?.user?.role))) {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Using stored role information:', storedRole);
        }
        setDirectRole(storedRole);
        setIsDirectAdmin(storedIsAdmin);
        setHasFetchedRole(true);
        return;
      }
    }

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching user role directly from backend API');
    }

    // Get the backend API URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    // Make a direct request to the me endpoint to get role information
    fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        const userRole = data.user.role;
        const isUserAdmin = userRole === 'admin';

        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('User role from API:', userRole);
        }

        setDirectRole(userRole);
        setIsDirectAdmin(isUserAdmin);

        // Store role information in local storage as a workaround
        // This allows persistence across page refreshes
        if (userRole && typeof window !== 'undefined') {
          localStorage.setItem('userRole', userRole);
          localStorage.setItem('isAdmin', String(isUserAdmin));

          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('Local storage updated with role:', userRole);
          }
        }
      }

      // Mark as fetched regardless of result to prevent repeated calls
      setHasFetchedRole(true);
    })
    .catch((err: Error) => {
      console.error('Error fetching user role:', err);
      // Mark as fetched even on error to prevent repeated calls
      setHasFetchedRole(true);
    });
  }, [isAuthenticated, session?.accessToken, hasFetchedRole]);

  const logout = async () => {
    try {
      // Call the backend logout API to invalidate tokens
      if (isAuthenticated && session?.accessToken) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        console.log('Calling backend logout API...');

        // Make a request to the logout endpoint
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies
        }).catch(err => {
          // Just log the error, don't block the logout process
          console.error('Error calling logout API:', err);
        });
      }

      // Clear all localStorage items first
      if (typeof window !== 'undefined') {
        console.log('Clearing localStorage...');
        localStorage.clear();

        // Clear all cookies with different path and domain combinations
        console.log('Clearing cookies...');
        const cookiesToClear = document.cookie.split(';');

        // Clear cookies with different path combinations
        const paths = ['/', '/api', ''];
        const domains = [window.location.hostname, `.${window.location.hostname}`, ''];

        cookiesToClear.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (!name) return;

          // Try different combinations of paths and domains
          paths.forEach(path => {
            domains.forEach(domain => {
              // Clear with domain
              if (domain) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
              } else {
                // Clear without specifying domain
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
              }
            });
          });

          // Also try secure flag combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`;
        });

        // Specifically target NextAuth.js cookies
        ['next-auth.session-token', 'next-auth.callback-url', 'next-auth.csrf-token', '__Secure-next-auth.session-token'].forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
        });

        // Specifically target our custom cookies
        ['accesstoken', 'refreshtoken'].forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
        });

        console.log('✅ All localStorage items and cookies cleared');
      }

      // Call our custom logout API endpoint to clear cookies server-side
      try {
        console.log('Calling custom logout API endpoint...');
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        console.log('✅ Custom logout API call completed');
      } catch (logoutApiError) {
        console.error('Error calling custom logout API:', logoutApiError);
      }

      // Sign out from NextAuth with redirect: false to prevent automatic redirect
      await signOut({ redirect: false });

      console.log('✅ NextAuth signOut completed');

    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always redirect to login page, even if there was an error
      console.log('Redirecting to login page...');
      router.push('/login');
    }
  };

  // Combine user data from NextAuth session and social auth
  const user = session?.user || socialAuthUser;

  // Add debugging for the user object
  useEffect(() => {
    if (user) {
      console.log('User object in useAuth:', user);
      console.log('Social auth user:', socialAuthUser);
    }
  }, [user, socialAuthUser]);

  // Get profile ID from various sources
  const profileId = session?.profileId ||
                   (typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null);

  // Get access token from various sources
  const accessToken = session?.accessToken ||
                     (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  // Get profile token from various sources
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
