'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [directRole, setDirectRole] = useState<string | null>(null);
  const [isDirectAdmin, setIsDirectAdmin] = useState(false);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

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
    localStorageAdmin; // From local storage (set after mount)

  // Debug: log the user object and detected role
  console.log('Auth user:', session?.user);
  console.log('Is admin from session:', session?.user?.role === 'admin' || session?.user?.isAdmin === true);
  console.log('Is admin from direct API:', isDirectAdmin);
  console.log('Final admin status:', isAdmin);

  // If authenticated, always fetch directly from API to be sure
  useEffect(() => {
    if (isAuthenticated && session?.accessToken) {
      console.log('Fetching user role directly from backend API');

      // Get the backend API URL
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      console.log('Backend API URL:', BACKEND_URL);

      // Make a direct request to the me endpoint to get role information
      fetch(`${BACKEND_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      })
      .then(res => res.json())
      .then(data => {
        console.log('User data from backend:', data);

        if (data.success && data.user) {
          const userRole = data.user.role;
          const isUserAdmin = userRole === 'admin';

          console.log('User role from API:', userRole);
          setDirectRole(userRole);
          setIsDirectAdmin(isUserAdmin);

          // Store role information in local storage as a workaround
          // This allows persistence across page refreshes
          if (userRole && typeof window !== 'undefined') {
            console.log('Storing role information in local storage...');
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('isAdmin', String(isUserAdmin));

            // Force session refresh
            getSession().then(() => {
              console.log('✅ Session refreshed with role:', userRole);
              console.log('✅ Local storage updated with isAdmin:', isUserAdmin);
            });
          }
        }
      })
      .catch((err: Error) => {
        console.error('Error fetching user role:', err);
      });
    }
  }, [isAuthenticated, session?.accessToken, session?.user]);

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

      // Sign out from NextAuth
      await signOut({ redirect: false });

      // Clear all localStorage items
      if (typeof window !== 'undefined') {
        console.log('Clearing localStorage...');
        localStorage.clear();

        // Clear all cookies
        console.log('Clearing cookies...');
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        console.log('✅ All localStorage items and cookies cleared');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always redirect to login page, even if there was an error
      router.push('/login');
    }
  };

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    logout,
    user: session?.user,
    accessToken: session?.accessToken,
    profileId: session?.profileId,
    profileToken: session?.profileToken,
  };
}
