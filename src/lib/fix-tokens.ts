'use client';

/**
 * Token Fix Utility
 * 
 * This utility provides functions to fix token-related issues
 * in the browser. It can be used to clear tokens, fix inconsistencies,
 * and force a fresh login.
 */

/**
 * Clear all tokens from localStorage and cookies
 */
export function clearAllTokens(): void {
  if (typeof window === 'undefined') {
    console.error('Cannot run in server environment');
    return;
  }
  
  console.log('Clearing all tokens...');
  
  // Clear localStorage tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('next-auth.session-token');
  localStorage.removeItem('__Secure-next-auth.session-token');
  localStorage.removeItem('selectedProfileToken');
  
  // Clear cookies
  const cookiesToClear = [
    'accessToken', 'accesstoken', 
    'refreshToken', 'refreshtoken',
    'next-auth.session-token', '__Secure-next-auth.session-token',
    'profileToken', 'profileId', 'selectedProfileId', 'selectedProfileToken'
  ];
  
  cookiesToClear.forEach(name => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=none`;
  });
  
  console.log('All tokens cleared');
}

/**
 * Force a fresh login by clearing all tokens and redirecting to login page
 */
export function forceLogin(): void {
  if (typeof window === 'undefined') {
    console.error('Cannot run in server environment');
    return;
  }
  
  console.log('Forcing fresh login...');
  
  // Store current path for redirect after login
  localStorage.setItem('redirectAfterLogin', window.location.pathname);
  
  // Clear all tokens
  clearAllTokens();
  
  // Redirect to login page with cache busting
  window.location.href = `/login?nocache=${Date.now()}`;
}

/**
 * Fix token inconsistencies by ensuring tokens are stored consistently
 * across localStorage and cookies
 */
export function fixTokenInconsistencies(): void {
  if (typeof window === 'undefined') {
    console.error('Cannot run in server environment');
    return;
  }
  
  console.log('Fixing token inconsistencies...');
  
  // Get tokens from localStorage
  const accessTokenFromLocalStorage = localStorage.getItem('accessToken');
  const refreshTokenFromLocalStorage = localStorage.getItem('refreshToken');
  
  // Get tokens from cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  const accessTokenFromCookie = cookies.accessToken || cookies.accesstoken;
  const refreshTokenFromCookie = cookies.refreshToken || cookies.refreshtoken;
  
  // Fix access token inconsistencies
  if (accessTokenFromLocalStorage && !accessTokenFromCookie) {
    console.log('Setting access token in cookies from localStorage');
    document.cookie = `accessToken=${accessTokenFromLocalStorage}; path=/; max-age=3600`; // 1 hour
    document.cookie = `accesstoken=${accessTokenFromLocalStorage}; path=/; max-age=3600`; // 1 hour
  } else if (!accessTokenFromLocalStorage && accessTokenFromCookie) {
    console.log('Setting access token in localStorage from cookies');
    localStorage.setItem('accessToken', accessTokenFromCookie);
  }
  
  // Fix refresh token inconsistencies
  if (refreshTokenFromLocalStorage && !refreshTokenFromCookie) {
    console.log('Setting refresh token in cookies from localStorage');
    document.cookie = `refreshToken=${refreshTokenFromLocalStorage}; path=/; max-age=2592000`; // 30 days
    document.cookie = `refreshtoken=${refreshTokenFromLocalStorage}; path=/; max-age=2592000`; // 30 days
  } else if (!refreshTokenFromLocalStorage && refreshTokenFromCookie) {
    console.log('Setting refresh token in localStorage from cookies');
    localStorage.setItem('refreshToken', refreshTokenFromCookie);
  }
  
  // Also set NextAuth compatible token
  if (accessTokenFromLocalStorage || accessTokenFromCookie) {
    const token = accessTokenFromLocalStorage || accessTokenFromCookie;
    localStorage.setItem('next-auth.session-token', token!);
    document.cookie = `__Secure-next-auth.session-token=${token}; path=/; max-age=3600`; // 1 hour
  }
  
  console.log('Token inconsistencies fixed');
}

// Export a function that can be called from the browser console
if (typeof window !== 'undefined') {
  (window as any).fixTokens = {
    clearAllTokens,
    forceLogin,
    fixTokenInconsistencies
  };
}
