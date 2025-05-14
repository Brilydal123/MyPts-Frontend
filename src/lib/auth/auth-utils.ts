/**
 * Authentication Utilities
 * 
 * This file contains utility functions for authentication.
 */

import { parseJwt, isTokenExpired } from './token-service';
import AUTH_CONFIG from './auth-config';

/**
 * Set a cookie with the specified options
 * @param name Cookie name
 * @param value Cookie value
 * @param maxAge Max age in seconds
 * @param path Cookie path
 * @param secure Whether the cookie should be secure
 * @param httpOnly Whether the cookie should be HTTP only
 * @param sameSite SameSite attribute
 */
export function setCookie(
  name: string,
  value: string,
  maxAge: number,
  path: string = '/',
  secure: boolean = AUTH_CONFIG.tokens.accessToken.secure,
  httpOnly: boolean = true,
  sameSite: 'strict' | 'lax' | 'none' = AUTH_CONFIG.tokens.accessToken.sameSite
): void {
  if (typeof document === 'undefined') return;
  
  const secureFlag = secure ? 'Secure;' : '';
  const httpOnlyFlag = httpOnly ? 'HttpOnly;' : '';
  const sameSiteFlag = `SameSite=${sameSite};`;
  
  document.cookie = `${name}=${value}; ${secureFlag} ${httpOnlyFlag} ${sameSiteFlag} Path=${path}; Max-Age=${maxAge}`;
}

/**
 * Get a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${name}=`)) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Delete a cookie by name
 * @param name Cookie name
 * @param path Cookie path
 */
export function deleteCookie(
  name: string,
  path: string = '/',
  secure: boolean = AUTH_CONFIG.tokens.accessToken.secure,
  sameSite: 'strict' | 'lax' | 'none' = AUTH_CONFIG.tokens.accessToken.sameSite
): void {
  if (typeof document === 'undefined') return;
  
  const secureFlag = secure ? 'Secure;' : '';
  const sameSiteFlag = `SameSite=${sameSite};`;
  
  document.cookie = `${name}=; ${secureFlag} ${sameSiteFlag} Path=${path}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(): void {
  const cookiesToClear = [
    'accessToken',
    'refreshToken',
    'profileToken',
    'profileId',
    'selectedProfileId',
    'selectedProfileToken',
    'client-accessToken',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token',
    '__Host-csrf-token',
    'isAdmin',
    'X-User-Role',
    'X-User-Is-Admin'
  ];
  
  cookiesToClear.forEach(name => {
    deleteCookie(name);
  });
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthLocalStorage(): void {
  if (typeof window === 'undefined') return;
  
  const keysToRemove = [
    'accessToken',
    'refreshToken',
    'profileToken',
    'profileId',
    'selectedProfileId',
    'selectedProfileToken',
    'user',
    'isAdmin',
    'tokenExpiry',
    'redirectAfterLogin'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Get user ID from token
 * @param token JWT token
 * @returns User ID or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
  if (!token) return null;
  
  const payload = parseJwt(token);
  return payload?.userId || payload?.id || null;
}

/**
 * Get profile ID from token
 * @param token JWT token
 * @returns Profile ID or null if not found
 */
export function getProfileIdFromToken(token: string): string | null {
  if (!token) return null;
  
  const payload = parseJwt(token);
  return payload?.profileId || null;
}

/**
 * Check if user is admin from token
 * @param token JWT token
 * @returns Boolean indicating if user is admin
 */
export function isAdminFromToken(token: string): boolean {
  if (!token) return false;
  
  const payload = parseJwt(token);
  return payload?.role === 'admin' || payload?.isAdmin === true;
}

/**
 * Validate access token
 * @param token Access token
 * @returns Boolean indicating if token is valid
 */
export function validateAccessToken(token: string): boolean {
  if (!token) return false;
  
  // Check if token is expired
  if (isTokenExpired(token)) return false;
  
  // Check if token has required claims
  const payload = parseJwt(token);
  return !!payload && !!payload.userId;
}

/**
 * Get redirect URL after login
 * @param defaultUrl Default URL to redirect to
 * @returns URL to redirect to
 */
export function getRedirectUrl(defaultUrl: string = AUTH_CONFIG.routes.dashboard): string {
  if (typeof window === 'undefined') return defaultUrl;
  
  const redirectUrl = localStorage.getItem('redirectAfterLogin');
  if (redirectUrl) {
    localStorage.removeItem('redirectAfterLogin');
    return redirectUrl;
  }
  
  return defaultUrl;
}

/**
 * Set redirect URL for after login
 * @param url URL to redirect to after login
 */
export function setRedirectUrl(url: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('redirectAfterLogin', url);
}
