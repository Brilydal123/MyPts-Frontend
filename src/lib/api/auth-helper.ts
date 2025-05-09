import { getSession } from 'next-auth/react';

/**
 * Get the authentication token from various sources
 * 1. Try to get it from the NextAuth session
 * 2. Try to get it from localStorage
 * 3. Try to get it from window.__NEXT_DATA__
 */
export const getAuthToken = async (): Promise<string | null> => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get token from NextAuth session
  try {
    const session = await getSession();
    if (session?.accessToken) {
      return session.accessToken;
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }

  // Try to get token from localStorage
  const localStorageToken = localStorage.getItem('auth_token');
  if (localStorageToken) {
    return localStorageToken;
  }

  // Try to get token from window.__NEXT_DATA__
  if (window.__NEXT_DATA__?.props?.pageProps?.session?.accessToken) {
    return window.__NEXT_DATA__.props.pageProps.session.accessToken;
  }

  return null;
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

  // Try to get admin status from NextAuth session
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
