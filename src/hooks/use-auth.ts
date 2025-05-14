'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useMemo } from 'react';
import { User } from '@/lib/auth/types';

/**
 * Custom hook for authentication
 * Provides authentication state and methods
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [isSocialAuthenticated, setIsSocialAuthenticated] = useState(false);
  const [socialAuthUser, setSocialAuthUser] = useState<User | null>(null);
  const [localStorageAdmin, setLocalStorageAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const mountedRef = useRef(true);

  // Set mounted ref on component mount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check for admin status in browser storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const browserAdmin =
        localStorage?.getItem('isAdmin') === 'true' ||
        localStorage?.getItem('userRole') === 'admin' ||
        document.cookie.includes('X-User-Role=admin') ||
        document.cookie.includes('X-User-Is-Admin=true');

      setLocalStorageAdmin(browserAdmin);
    } catch (e) {
      console.error('Error checking admin status:', e);
      setLocalStorageAdmin(false);
    }
  }, []);

  // Update admin status when session or localStorage changes
  useEffect(() => {
    const sessionAdmin = session?.user?.role === 'admin' || session?.user?.isAdmin === true;
    const finalAdminStatus = sessionAdmin || localStorageAdmin ||
      (socialAuthUser?.role === 'admin' || socialAuthUser?.isAdmin === true);

    setIsAdmin(finalAdminStatus);
  }, [session?.user?.role, session?.user?.isAdmin, localStorageAdmin, socialAuthUser]);

  // Effect to check both NextAuth and social authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const userDataString = localStorage.getItem('user');

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
            role: userData.role || 'user',
            isAdmin: userData.role === 'admin' || userData.isAdmin === true ||
                    localStorage?.getItem('isAdmin') === 'true' ||
                    document.cookie.includes('X-User-Is-Admin=true')
          };

          setSocialAuthUser(enhancedUserData);
          setIsSocialAuthenticated(true);
        } catch (e) {
          console.error('Error parsing user data:', e);
          setIsSocialAuthenticated(false);
        }
      }
    };

    // Initial auth check
    initializeAuth();
  }, []);

  // Sync admin status to cookies when session changes
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.accessToken && isAdmin) {
      const token = session.accessToken;
      document.cookie = `X-Admin-Token=${token}; path=/`;
      document.cookie = 'X-User-Is-Admin=true; path=/';
      document.cookie = 'X-User-Role=admin; path=/';
      document.cookie = `Authorization=Bearer ${token}; path=/`;
      localStorage.setItem('adminToken', token);
    }
  }, [session?.accessToken, isAdmin]);

  const isAuthenticated = status === 'authenticated' || isSocialAuthenticated;
  const isLoading = status === 'loading' && !isSocialAuthenticated;

  const user = session?.user || socialAuthUser;

  // Unified logout function
  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        console.log('Starting logout process...');

        // Store tokens before clearing for API calls
        const accessToken = localStorage.getItem('accessToken') || session?.accessToken;

        // 1. Clear localStorage immediately
        localStorage.clear();

        // 2. Clear sessionStorage
        sessionStorage.clear();

        // 3. Clear cookies
        const cookiesToClear = document.cookie.split(';');
        cookiesToClear.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (!name) return;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        // 4. Call API endpoints in the background
        if (accessToken) {
          const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api';
          fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }).catch(error => console.error('Error during backend logout:', error));
        }

        // 5. Call frontend logout API
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        }).catch(error => console.error('Error during API logout:', error));

        // 6. Sign out from NextAuth
        await signOut({ redirect: false });

        // 7. Redirect to login page
        window.location.href = `/login?logout=true&t=${Date.now()}`;
      }
    } catch (error) {
      console.error('Logout error:', error);
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
  const refreshUserData = useCallback(async () => {
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

          if (mountedRef.current) {
            setSocialAuthUser(enhancedUserData);
            setIsSocialAuthenticated(true);
          }
        }
      } catch (e) {
        console.error('Error refreshing user data:', e);
      }
    }
  }, []);

  return useMemo(() => ({
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
  }), [
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    user,
    accessToken,
    profileId,
    profileToken,
    isSocialAuthenticated,
    refreshUserData,
    logout
  ]);
}
