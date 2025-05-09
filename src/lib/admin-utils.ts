'use client';

import { getSession } from 'next-auth/react';

/**
 * Comprehensive utility for admin status verification and synchronization
 * This utility provides functions to check, verify, and synchronize admin status
 * across all possible storage methods (session, localStorage, cookies, userData)
 */

/**
 * Check admin status from all possible sources
 * @returns Object containing admin status from different sources and a final determination
 */
export const checkAdminStatus = async () => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return { isAdmin: false, sources: {} };
  }

  // Check admin status from localStorage
  const isAdminFromStorage = localStorage?.getItem('isAdmin') === 'true' ||
                           localStorage?.getItem('userRole') === 'admin';

  // Check admin status from cookies
  const isAdminFromCookies = document.cookie.includes('isAdmin=true') ||
                           document.cookie.includes('X-User-Role=admin') ||
                           document.cookie.includes('X-User-Is-Admin=true');

  // Check admin status from user data in localStorage
  let isAdminFromUserData = false;
  try {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      isAdminFromUserData = userData.role === 'admin' || userData.isAdmin === true;
    }
  } catch (error) {
    console.error('Error checking admin status from user data:', error);
  }

  // Check admin status from NextAuth session
  let isAdminFromSession = false;
  try {
    const session = await getSession();
    if (session?.user) {
      isAdminFromSession = session.user.role === 'admin' ||
                          (session.user as any).isAdmin === true;
    }
  } catch (error) {
    console.error('Error getting session for admin check:', error);
  }

  // Check admin status from window.__NEXT_DATA__
  let isAdminFromNextData = false;
  if (window.__NEXT_DATA__?.props?.pageProps?.session?.user) {
    const user = window.__NEXT_DATA__.props.pageProps.session.user;
    isAdminFromNextData = user.role === 'admin' || user.isAdmin === true;
  }

  // Determine final admin status
  const isAdmin = isAdminFromStorage ||
                isAdminFromCookies ||
                isAdminFromUserData ||
                isAdminFromSession ||
                isAdminFromNextData;

  return {
    isAdmin,
    sources: {
      isAdminFromStorage,
      isAdminFromCookies,
      isAdminFromUserData,
      isAdminFromSession,
      isAdminFromNextData
    }
  };
};

/**
 * Synchronize admin status across all storage methods
 * @param isAdmin Boolean indicating admin status
 */
export const syncAdminStatus = (isAdmin: boolean) => {
  if (typeof window === 'undefined') return;

  console.log(`Synchronizing admin status: ${isAdmin}`);

  if (isAdmin) {
    // Set admin status in localStorage
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('userRole', 'admin');

    // Set admin status in cookies
    document.cookie = `isAdmin=true; path=/; max-age=86400`; // 1 day
    document.cookie = `X-User-Role=admin; path=/; max-age=86400`; // 1 day
    document.cookie = `X-User-Is-Admin=true; path=/; max-age=86400`; // 1 day

    // Try to update user data if it exists
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);

        // Create updated user data with admin role and preserve all other properties
        const updatedUserData = {
          ...userData,
          isAdmin: true,
          role: 'admin'
        };

        // Log the update
        console.log('Updating user data with admin role:', {
          before: {
            fullName: userData.fullName,
            role: userData.role,
            isAdmin: userData.isAdmin
          },
          after: {
            fullName: updatedUserData.fullName,
            role: updatedUserData.role,
            isAdmin: updatedUserData.isAdmin
          }
        });

        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }
    } catch (error) {
      console.error('Error updating user data with admin status:', error);
    }
  } else {
    // Clear admin status from localStorage
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');

    // Clear admin status from cookies
    document.cookie = `isAdmin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    document.cookie = `X-User-Role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    document.cookie = `X-User-Is-Admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;

    // Try to update user data if it exists
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userData.isAdmin = false;
        userData.role = userData.role === 'admin' ? 'user' : userData.role;
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error updating user data with non-admin status:', error);
    }
  }
};

/**
 * Verify and synchronize admin status
 * This function checks admin status from all sources and synchronizes it
 * @returns Boolean indicating final admin status
 */
export const verifyAndSyncAdminStatus = async () => {
  const { isAdmin, sources } = await checkAdminStatus();

  console.log('Admin status verification:', {
    isAdmin,
    sources,
    syncRequired: Object.values(sources).some(value => value !== isAdmin)
  });

  // If any source disagrees with the final determination, synchronize
  if (Object.values(sources).some(value => value !== isAdmin)) {
    syncAdminStatus(isAdmin);
  }

  return isAdmin;
};
