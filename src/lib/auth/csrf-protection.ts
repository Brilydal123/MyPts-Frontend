/**
 * CSRF Protection Utilities
 * 
 * This file contains utilities for Cross-Site Request Forgery (CSRF) protection.
 */

import { randomBytes } from 'crypto';
import AUTH_CONFIG from './auth-config';

/**
 * Generate a CSRF token
 * @returns A random CSRF token
 */
export function generateCsrfToken(): string {
  // For server-side
  if (typeof window === 'undefined') {
    return randomBytes(32).toString('hex');
  }
  // For client-side, use Web Crypto API
  else {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Set CSRF token in a cookie
 * @param token CSRF token
 */
export function setCsrfCookie(token: string): void {
  if (typeof document !== 'undefined') {
    const secure = AUTH_CONFIG.tokens.accessToken.secure ? 'Secure;' : '';
    const sameSite = `SameSite=${AUTH_CONFIG.tokens.accessToken.sameSite};`;
    
    document.cookie = `${AUTH_CONFIG.csrf.cookieName}=${token}; ${secure} ${sameSite} Path=/; Max-Age=${AUTH_CONFIG.csrf.maxAge}; HttpOnly`;
  }
}

/**
 * Get CSRF token from cookies
 * @returns CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${AUTH_CONFIG.csrf.cookieName}=`)) {
      return cookie.substring(AUTH_CONFIG.csrf.cookieName.length + 1);
    }
  }
  return null;
}

/**
 * Add CSRF token to request headers
 * @param headers Request headers object
 * @returns Updated headers object with CSRF token
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (!token) return headers;
  
  const headersObj = headers instanceof Headers ? 
    Object.fromEntries(headers.entries()) : 
    { ...headers };
  
  return {
    ...headersObj,
    [AUTH_CONFIG.csrf.headerName]: token,
  };
}

/**
 * Validate CSRF token
 * @param requestToken Token from request header
 * @param storedToken Token from cookie or session
 * @returns Boolean indicating if tokens match
 */
export function validateCsrfToken(requestToken: string, storedToken: string): boolean {
  if (!requestToken || !storedToken) return false;
  
  // Use timing-safe comparison to prevent timing attacks
  // This is a simple implementation; in production, use a dedicated library
  let mismatch = 0;
  const requestLength = requestToken.length;
  const storedLength = storedToken.length;
  
  if (requestLength !== storedLength) return false;
  
  for (let i = 0; i < requestLength; i++) {
    mismatch |= requestToken.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return mismatch === 0;
}

/**
 * Create a CSRF-protected fetch function
 * @param fetchFn Optional custom fetch function
 * @returns Fetch function that automatically adds CSRF headers
 */
export function createCsrfFetch(fetchFn = fetch): typeof fetch {
  return (url: RequestInfo | URL, options: RequestInit = {}) => {
    const headers = addCsrfHeader(options.headers || {});
    return fetchFn(url, { ...options, headers });
  };
}
