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
 * Get the current user's admin status
 */
export const isUserAdmin = async (): Promise<boolean> => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Try to get admin status from NextAuth session
  try {
    const session = await getSession();
    if (session?.user) {
      return session.user.role === 'admin' || session.user.isAdmin === true;
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }

  // Try to get admin status from window.__NEXT_DATA__
  if (window.__NEXT_DATA__?.props?.pageProps?.session?.user) {
    const user = window.__NEXT_DATA__.props.pageProps.session.user;
    return user.role === 'admin' || user.isAdmin === true;
  }

  return false;
};
