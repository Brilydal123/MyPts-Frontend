import { getSession } from 'next-auth/react';

/**
 * Get the authentication token from various sources
 * 1. Try to get it from the NextAuth session (primary source)
 * 2. Fallback to localStorage only if NextAuth session is unavailable
 */
export const getAuthToken = async (): Promise<string | null> => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get token from NextAuth session - this is the primary source
  // This will trigger the NextAuth.js jwt callback which handles token refresh
  try {
    console.log('Getting auth token from NextAuth session...');
    const session = await getSession();
    
    // Check for session errors first (from our token refresh logic)
    if (session?.error) {
      console.error(`NextAuth session error: ${session.error}`);
      // Don't return null here - we'll check other sources first
    } 
    
    // If we have a valid accessToken in the session, use it
    if (session?.accessToken) {
      console.log('Found valid accessToken in NextAuth session');
      return session.accessToken;
    }
  } catch (error) {
    console.error('Error getting NextAuth session:', error);
  }

  // FALLBACK ONLY: Try to get token from localStorage
  // This should only be used if NextAuth session is completely unavailable
  const localStorageToken = localStorage.getItem('accessToken');
  if (localStorageToken) {
    console.log('Using fallback token from localStorage');
    return localStorageToken;
  }

  console.log('No auth token found in any source');
  return null;
};

/**
 * Check if the current session has errors (e.g., refresh token errors)
 * Returns the error message if present, or null if no errors
 */
export const checkSessionErrors = async (): Promise<string | null> => {
  try {
    const session = await getSession();
    if (session?.error) {
      console.error(`Session error detected: ${session.error}`);
      return session.error;
    }
    return null;
  } catch (error) {
    console.error('Error checking session errors:', error);
    return 'Failed to check session';
  }
};

/**
 * Get the current user's admin status from all possible sources
 */
export const isUserAdmin = async (): Promise<boolean> => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  console.log('Checking admin status from all sources...');

  // Check admin status from localStorage
  const storedIsAdmin = localStorage?.getItem('isAdmin') === 'true';
  const storedUserRole = localStorage?.getItem('userRole') === 'admin';

  if (storedIsAdmin || storedUserRole) {
    console.log('Admin status found in localStorage');
    return true;
  }

  // Check admin status from cookies
  const cookieIsAdmin = document.cookie.includes('isAdmin=true');
  const cookieUserRole = document.cookie.includes('X-User-Role=admin');
  const cookieUserIsAdmin = document.cookie.includes('X-User-Is-Admin=true');

  if (cookieIsAdmin || cookieUserRole || cookieUserIsAdmin) {
    console.log('Admin status found in cookies');
    return true;
  }

  // Check admin status from user data in localStorage
  try {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData.role === 'admin' || userData.isAdmin === true) {
        console.log('Admin status found in user data');
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking admin status from user data:', error);
  }

  // Try to get admin status from NextAuth session FIRST
  try {
    const session = await getSession();
    if (session?.user) {
      const isAdmin = session.user.role === 'admin' || session.user.isAdmin === true;
      if (isAdmin) {
        console.log('Admin status found in NextAuth session');
        return true;
      }
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }

  // Try to get admin status from window.__NEXT_DATA__
  if (window.__NEXT_DATA__?.props?.pageProps?.session?.user) {
    const user = window.__NEXT_DATA__.props.pageProps.session.user;
    const isAdmin = user.role === 'admin' || user.isAdmin === true;
    if (isAdmin) {
      console.log('Admin status found in window.__NEXT_DATA__');
      return true;
    }
  }

  console.log('No admin status found in any source');
  return false;
};
