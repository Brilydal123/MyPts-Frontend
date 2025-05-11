'use client';

import { useState, useEffect, useCallback, startTransition, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { safeAuthCall, safeAuthAction } from '@/lib/auth/auth-error-handler';

export function useAuth() {
  const { data: session, status } = useSession();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [socialAuthUser, setSocialAuthUser] = useState<any>(null);
  const [isSocialAuthenticated, setIsSocialAuthenticated] = useState(false);
  const [localStorageAdmin, setLocalStorageAdmin] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      // Initialize admin status from all possible sources
      const browserAdmin =
        localStorage?.getItem('isAdmin') === 'true' ||
        localStorage?.getItem('userRole') === 'admin' ||
        document.cookie.includes('X-User-Role=admin') ||
        document.cookie.includes('X-User-Is-Admin=true');
      return browserAdmin;
    } catch (e) {
      return false;
    }
  });

  // Unified admin status verification and synchronization
  useEffect(() => {
    if (!mountedRef.current) return;

    const verifyAndSyncAdminStatus = async () => {
      try {
        // Collect all admin status indicators
        const indicators = {
          session: session?.user?.role === 'admin' || session?.user?.isAdmin === true,
          localStorage: localStorageAdmin,
          social: socialAuthUser?.role === 'admin' || socialAuthUser?.isAdmin === true,
          cookies: document.cookie.includes('X-User-Role=admin') || document.cookie.includes('X-User-Is-Admin=true')
        };

        console.log('Admin status indicators:', indicators);

        // Server-side verification with error handling
        const adminUtilsModule = await safeAuthCall(
          async () => import('@/lib/admin-utils'),
          {
            checkAdminStatus: async () => ({
              isAdmin: false,
              sources: {
                isAdminFromStorage: false,
                isAdminFromCookies: false,
                isAdminFromUserData: false,
                isAdminFromSession: false,
                isAdminFromNextData: false
              }
            }),
            syncAdminStatus: (_isAdmin: boolean) => {},
            verifyAndSyncAdminStatus: async () => false
          },
          'Admin utils import'
        );

        if (!adminUtilsModule?.checkAdminStatus) {
          console.warn('Admin utils not available, using fallback');
          setIsAdmin(false);
          return;
        }

        // Check admin status with error handling
        const { isAdmin: verifiedAdmin } = await safeAuthCall(
          async () => adminUtilsModule.checkAdminStatus(),
          {
            isAdmin: false,
            sources: {
              isAdminFromStorage: false,
              isAdminFromCookies: false,
              isAdminFromUserData: false,
              isAdminFromSession: false,
              isAdminFromNextData: false
            }
          },
          'Admin status check'
        );

        if (verifiedAdmin) {
          // Synchronize admin status across all storage mechanisms
          const accessToken = session?.accessToken || localStorage.getItem('accessToken');
          if (accessToken) {
            // Set secure httpOnly cookies via API - use safeAuthAction to handle errors gracefully
            await safeAuthAction(
              async () => {
                await fetch('/api/auth/sync-admin', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include'
                });
              },
              'Admin sync'
            );

            // Update local storage
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('adminToken', accessToken);

            // Update user data
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const userData = JSON.parse(userStr);
              userData.isAdmin = true;
              userData.role = 'admin';
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        }

        setIsAdmin(verifiedAdmin);
        if (verifiedAdmin && mountedRef.current) {
          adminUtilsModule.syncAdminStatus(true);
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        // Fallback to basic check if server verification fails
        const basicStatus =
          session?.user?.role === 'admin' ||
          session?.user?.isAdmin === true ||
          localStorageAdmin ||
          socialAuthUser?.role === 'admin' ||
          socialAuthUser?.isAdmin === true;
        setIsAdmin(basicStatus);
      }
    };

    verifyAndSyncAdminStatus();
  }, [session?.user?.role, session?.user?.isAdmin, localStorageAdmin, socialAuthUser, mountedRef, session?.accessToken]);

  // Effect to check both NextAuth and social authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeAuth = () => {
      const now = Date.now();
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      const shouldRefreshToken = tokenExpiry && now > parseInt(tokenExpiry);
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

      // If token needs refresh, attempt to refresh before proceeding
      if (shouldRefreshToken && accessToken) {
        // Use safeAuthAction to handle errors gracefully
        safeAuthAction(async () => {
          try {
            const response = await fetch('/api/auth/frontend-refresh', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            const data = await response.json();

            if (data.accessToken) {
              const newToken = data.accessToken;
              localStorage.setItem('accessToken', newToken);
              localStorage.setItem('tokenExpiry', String(now + 3600000)); // 1 hour expiry

              // Update admin token if user has admin privileges
              if (localStorage.getItem('isAdmin') === 'true' ||
                  document.cookie.includes('X-User-Role=admin')) {
                localStorage.setItem('adminToken', newToken);
                document.cookie = `X-Admin-Token=${newToken}; path=/`;
                document.cookie = `Authorization=Bearer ${newToken}; path=/`;
              }

              console.log('Token refreshed successfully');
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            // Set a shorter expiry to try again soon
            localStorage.setItem('tokenExpiry', String(now + 300000)); // 5 minutes
          }
        }, 'Token refresh');
      }

      // Function to set admin headers
      const setAdminHeaders = () => {
        if (typeof window !== 'undefined') {
          try {
            const adminToken = localStorage.getItem('adminToken');
            if (adminToken) {
              document.cookie = `X-Admin-Token=${adminToken}; path=/`;
            }
            document.cookie = 'X-User-Is-Admin=true; path=/';
            document.cookie = 'X-User-Role=admin; path=/';
          } catch (e) {
            console.error('Error setting admin headers:', e);
          }
        }
      };

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
            isAdmin: userData.role === 'admin' || userData.isAdmin === true ||
                    localStorage?.getItem('isAdmin') === 'true' ||
                    document.cookie.includes('X-User-Is-Admin=true')
          };

          // Log the user data for debugging
          console.log('User data loaded:', {
            fullName: enhancedUserData.fullName,
            email: enhancedUserData.email,
            role: enhancedUserData.role,
            isAdmin: enhancedUserData.isAdmin
          });

          console.log('Enhanced user data:', enhancedUserData);

          startTransition(() => {
            setSocialAuthUser(enhancedUserData);
            setIsSocialAuthenticated(true);
            if (enhancedUserData.isAdmin) {
              setAdminHeaders();
              // Update admin token if needed
              if (!localStorage.getItem('adminToken')) {
                localStorage.setItem('adminToken', accessToken);
              }
            }
          });
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
    };

    let refreshTimer: NodeJS.Timeout;

    // Initial auth check
    initializeAuth();

    // Set up periodic token check
    if (typeof window !== 'undefined') {
      refreshTimer = setInterval(() => {
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
          initializeAuth();
        }
      }, 300000); // Check every 5 minutes
    }

    // Cleanup
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      mountedRef.current = false;
    };
  }, [setSocialAuthUser, setIsSocialAuthenticated, mountedRef]); // Dependencies are stable

  // Sync headers when session changes
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

  // Enhanced admin headers synchronization
  useEffect(() => {
    if (!mountedRef.current || !isAdmin || typeof window === 'undefined') return;

    const accessToken = localStorage.getItem('accessToken') || session?.accessToken;
    if (!accessToken) return;

    const synchronizeAdminHeaders = async () => {
      try {
        // First, ensure admin verification passes with error handling
        const adminUtilsModule = await safeAuthCall(
          async () => import('@/lib/admin-utils'),
          {
            checkAdminStatus: async () => ({
              isAdmin: false,
              sources: {
                isAdminFromStorage: false,
                isAdminFromCookies: false,
                isAdminFromUserData: false,
                isAdminFromSession: false,
                isAdminFromNextData: false
              }
            }),
            syncAdminStatus: (_isAdmin: boolean) => {},
            verifyAndSyncAdminStatus: async () => false
          },
          'Admin utils import (headers sync)'
        );

        if (!adminUtilsModule?.checkAdminStatus) {
          console.warn('Admin utils not available for headers sync, skipping');
          return;
        }

        // Check admin status with error handling
        const { isAdmin: verifiedAdmin } = await safeAuthCall(
          async () => adminUtilsModule.checkAdminStatus(),
          {
            isAdmin: false,
            sources: {
              isAdminFromStorage: false,
              isAdminFromCookies: false,
              isAdminFromUserData: false,
              isAdminFromSession: false,
              isAdminFromNextData: false
            }
          },
          'Admin status check (headers sync)'
        );

        if (verifiedAdmin) {
          // Set admin headers through API to ensure proper HttpOnly cookies - use safeAuthAction to handle errors gracefully
          await safeAuthAction(
            async () => {
              await fetch('/api/auth/admin/sync-headers', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });
            },
            'Admin headers sync'
          );

          // Update local storage and cookies for client-side checks
          localStorage.setItem('adminToken', accessToken);
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('userRole', 'admin');

          // Set client-side cookies with appropriate security flags
          const secure = window.location.protocol === 'https:';
          const sameSite = secure ? 'Strict' : 'Lax';

          document.cookie = `X-Admin-Token=${accessToken}; path=/; ${secure ? 'Secure;' : ''} SameSite=${sameSite}`;
          document.cookie = `X-User-Is-Admin=true; path=/; ${secure ? 'Secure;' : ''} SameSite=${sameSite}`;
          document.cookie = `X-User-Role=admin; path=/; ${secure ? 'Secure;' : ''} SameSite=${sameSite}`;
          document.cookie = `Authorization=Bearer ${accessToken}; path=/; ${secure ? 'Secure;' : ''} SameSite=${sameSite}`;
        }
      } catch (e) {
        console.error('Error synchronizing admin headers:', e);
      }
    };

    synchronizeAdminHeaders();

    // Set up interval to refresh headers
    const refreshInterval = setInterval(synchronizeAdminHeaders, 60000); // Refresh every minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAdmin, session?.accessToken, mountedRef]);

  // Debug admin status
  console.log('Admin status check (final):', {
    sessionUserRole: session?.user?.role,
    sessionUserIsAdmin: session?.user?.isAdmin,
    localStorageAdmin,
    socialAuthUserRole: socialAuthUser?.role,
    socialAuthUserIsAdmin: socialAuthUser?.isAdmin,
    currentAdminStatus: isAdmin
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
  const refreshUserData = useCallback(async () => {
    if (typeof window !== 'undefined' && setSocialAuthUser) {
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

          if (mountedRef.current) {
            // Ensure admin status is properly synced
            const adminStatus =
              localStorage?.getItem('isAdmin') === 'true' ||
              localStorage?.getItem('userRole') === 'admin' ||
              document.cookie.includes('isAdmin=true') ||
              document.cookie.includes('X-User-Role=admin');

            const finalUserData = {
              ...enhancedUserData,
              isAdmin: enhancedUserData.isAdmin || adminStatus,
              role: adminStatus ? 'admin' : enhancedUserData.role
            };

            startTransition(() => {
              setSocialAuthUser(finalUserData);
              setIsSocialAuthenticated(true);
            });

            // Update localStorage with synced data
            try {
              localStorage.setItem('user', JSON.stringify(finalUserData));
              localStorage.setItem('isAdmin', String(finalUserData.isAdmin));
              localStorage.setItem('userRole', finalUserData.role);
            } catch (error) {
              console.error('Failed to update localStorage:', error);
            }
          }
          console.log('Successfully updated social auth user state');
        }
      } catch (e) {
        console.error('Error refreshing user data:', e);
      }
    }
  }, [setSocialAuthUser, setIsSocialAuthenticated, mountedRef]); // Add mountedRef to dependencies

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
