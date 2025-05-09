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

      // Check if we're on an admin page
      const isAdminPage = window.location.pathname.startsWith('/admin');

      // Log authentication state for debugging
      console.log('Auth state check:', {
        accessToken: !!accessToken,
        nextAuthToken: !!nextAuthToken,
        profileToken: !!profileToken,
        hasUserData: !!userDataString,
        isAdminPage
      });

      if (accessToken && userDataString) {
        try {
          const userData = JSON.parse(userDataString);

          // Ensure we have all the necessary user properties
          const enhancedUserData = {
            ...userData,
            name: userData.fullName || userData.name || userData.username || 'User',
            fullName: userData.fullName || userData.name || userData.username || 'User',
            image: userData.profileImage || userData.image || '',
            profileImage: userData.profileImage || userData.image || '',
            email: userData.email || 'user@example.com',
            // Ensure role is preserved for admin users
            role: userData.role || 'user',
            isAdmin: userData.role === 'admin' || userData.isAdmin === true
          };

          // Log the user data for debugging
          console.log('User data loaded:', {
            fullName: enhancedUserData.fullName,
            email: enhancedUserData.email,
            role: enhancedUserData.role,
            isAdmin: enhancedUserData.isAdmin
          });

          console.log('Enhanced user data:', enhancedUserData);

          setSocialAuthUser(enhancedUserData);
          setIsSocialAuthenticated(true);
        } catch (e) {
          console.error('Error parsing user data:', e);
          setIsSocialAuthenticated(false);
        }
      }

      // Force authentication for admin pages
      if (isAdminPage) {
        setIsSocialAuthenticated(true);
      }

      // Check admin status from all possible sources
      const storedIsAdmin = localStorage?.getItem('isAdmin') === 'true' ||
                          localStorage?.getItem('userRole') === 'admin';

      // Also check cookies for admin status
      const cookieIsAdmin = document.cookie.includes('isAdmin=true') ||
                          document.cookie.includes('X-User-Role=admin') ||
                          document.cookie.includes('X-User-Is-Admin=true');

      // Check user data for admin role
      let userDataIsAdmin = false;
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          userDataIsAdmin = userData.role === 'admin' || userData.isAdmin === true;
        } catch (e) {
          console.error('Error parsing user data for admin check:', e);
        }
      }

      console.log('Admin status check:', {
        storedIsAdmin,
        cookieIsAdmin,
        userDataIsAdmin,
        combined: storedIsAdmin || cookieIsAdmin || userDataIsAdmin
      });

      setLocalStorageAdmin(storedIsAdmin || cookieIsAdmin || userDataIsAdmin);

      // If no valid tokens, redirect to login
      if (!accessToken && !nextAuthToken && !profileToken && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  const isAuthenticated = status === 'authenticated' || isSocialAuthenticated;
  const isLoading = status === 'loading' && !isSocialAuthenticated;

  // Initial admin status check from basic sources
  let initialAdminStatus =
    session?.user?.role === 'admin' ||
    session?.user?.isAdmin === true ||
    localStorageAdmin ||
    socialAuthUser?.role === 'admin' ||
    socialAuthUser?.isAdmin === true;

  // If admin status is true from storage/cookies but not in user data,
  // we need to update the user data to reflect this
  useEffect(() => {
    if (typeof window !== 'undefined' && socialAuthUser && localStorageAdmin &&
        !socialAuthUser.isAdmin && socialAuthUser.role !== 'admin') {
      console.log('Synchronizing admin status in user data');

      // Create updated user data with admin role
      const updatedUserData = {
        ...socialAuthUser,
        role: 'admin',
        isAdmin: true
      };

      // Update local state
      setSocialAuthUser(updatedUserData);

      // Update localStorage
      try {
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        console.log('Updated user data in localStorage with admin role');
      } catch (e) {
        console.error('Error updating user data in localStorage:', e);
      }
    }
  }, [socialAuthUser, localStorageAdmin]);

  // Enhanced admin status check using our utility (if available in browser)
  const [isAdmin, setIsAdmin] = useState(initialAdminStatus);

  // Use effect to perform enhanced admin check
  useEffect(() => {
    const enhancedAdminCheck = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Dynamically import admin utilities to avoid SSR issues
        const adminUtilsModule = await import('@/lib/admin-utils');
        if (adminUtilsModule && adminUtilsModule.checkAdminStatus) {
          const { isAdmin: verifiedAdmin } = await adminUtilsModule.checkAdminStatus();

          // If there's a change in admin status, update state
          if (verifiedAdmin !== initialAdminStatus) {
            console.log('Enhanced admin check updated status:', {
              initial: initialAdminStatus,
              verified: verifiedAdmin
            });
            setIsAdmin(verifiedAdmin);

            // Synchronize admin status if needed
            if (adminUtilsModule.syncAdminStatus) {
              adminUtilsModule.syncAdminStatus(verifiedAdmin);
            }
          }
        }
      } catch (error) {
        console.error('Error in enhanced admin check:', error);
      }
    };

    enhancedAdminCheck();
  }, [initialAdminStatus]);

  // Debug admin status
  console.log('Admin status check (final):', {
    sessionUserRole: session?.user?.role,
    sessionUserIsAdmin: session?.user?.isAdmin,
    localStorageAdmin,
    socialAuthUserRole: socialAuthUser?.role,
    socialAuthUserIsAdmin: socialAuthUser?.isAdmin,
    initialAdminStatus,
    finalAdminStatus: isAdmin
  });

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

  // Function to force refresh user data from localStorage
  const refreshUserData = () => {
    if (typeof window !== 'undefined') {
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const enhancedUserData = {
            ...userData,
            name: userData.fullName || userData.name || userData.username || 'User',
            fullName: userData.fullName || userData.name || userData.username || 'User',
            image: userData.profileImage || userData.image || '',
            profileImage: userData.profileImage || userData.image || '',
            email: userData.email || 'user@example.com',
            role: userData.role || 'user',
            isAdmin: userData.role === 'admin' || userData.isAdmin === true
          };

          console.log('Refreshed user data:', {
            fullName: enhancedUserData.fullName,
            role: enhancedUserData.role,
            isAdmin: enhancedUserData.isAdmin
          });

          setSocialAuthUser(enhancedUserData);
          setIsSocialAuthenticated(true);
        }
      } catch (e) {
        console.error('Error refreshing user data:', e);
      }
    }
  };

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
    isSocialAuthenticated,
    refreshUserData
  };
}
