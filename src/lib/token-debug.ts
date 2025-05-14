'use client';

/**
 * Token Debug Utility
 *
 * This utility provides functions to diagnose token-related issues
 * in the browser. It can be used to check the state of tokens in
 * localStorage, cookies, and decode JWT tokens.
 */

/**
 * Decode a JWT token
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeJwt(token: string | null | undefined): any {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token The JWT token to check
 * @returns True if expired, false if valid, null if invalid
 */
export function isTokenExpired(token: string | null | undefined): boolean | null {
  if (!token) return null;

  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return null;

  const now = Date.now() / 1000; // Current time in seconds
  return decoded.exp < now;
}

/**
 * Get token expiration time in seconds
 * @param token The JWT token to check
 * @returns Time until expiration in seconds, negative if expired, null if invalid
 */
export function getTokenExpiresIn(token: string | null | undefined): number | null {
  if (!token) return null;

  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return null;

  const now = Date.now() / 1000; // Current time in seconds
  return decoded.exp - now;
}

/**
 * Get all tokens from localStorage and cookies
 * @returns Object containing all tokens
 */
export function getAllTokens(): Record<string, string | null> {
  if (typeof window === 'undefined') {
    return {};
  }

  // Get tokens from localStorage
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const nextAuthToken = localStorage.getItem('next-auth.session-token');
  const secureNextAuthToken = localStorage.getItem('__Secure-next-auth.session-token');
  const selectedProfileToken = localStorage.getItem('selectedProfileToken');

  // Get tokens from cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    // localStorage tokens
    accessTokenFromLocalStorage: accessToken,
    refreshTokenFromLocalStorage: refreshToken,
    nextAuthTokenFromLocalStorage: nextAuthToken,
    secureNextAuthTokenFromLocalStorage: secureNextAuthToken,
    selectedProfileTokenFromLocalStorage: selectedProfileToken,

    // Cookie tokens
    accessTokenFromCookie: cookies.accessToken || cookies.accesstoken,
    refreshTokenFromCookie: cookies.refreshToken || cookies.refreshtoken,
    nextAuthTokenFromCookie: cookies['next-auth.session-token'],
    secureNextAuthTokenFromCookie: cookies['__Secure-next-auth.session-token'],
  };
}

/**
 * Run a comprehensive token diagnostic
 * @returns Diagnostic information
 */
export function runTokenDiagnostic(): Record<string, any> {
  if (typeof window === 'undefined') {
    return { error: 'Cannot run in server environment' };
  }

  const tokens = getAllTokens();
  const now = Date.now() / 1000; // Current time in seconds

  // Decode tokens
  const decodedTokens: Record<string, any> = {};
  Object.entries(tokens).forEach(([key, token]) => {
    if (token) {
      decodedTokens[key] = decodeJwt(token);
    }
  });

  // Check token expiration
  const tokenStatus: Record<string, any> = {};
  Object.entries(tokens).forEach(([key, token]) => {
    if (token) {
      const decoded = decodedTokens[key];
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - now;
        tokenStatus[key] = {
          isExpired: expiresIn < 0,
          expiresIn: Math.round(expiresIn),
          expiresInMinutes: Math.round(expiresIn / 60),
          expiresInHours: Math.round(expiresIn / 3600),
          tokenType: decoded.type || 'unknown'
        };
      }
    }
  });

  return {
    tokens,
    decodedTokens,
    tokenStatus,
    localStorage: Object.keys(localStorage),
    cookies: document.cookie.split(';').map(c => c.trim()),
    timestamp: new Date().toISOString()
  };
}

/**
 * Log token diagnostic information to the console
 */
export function logTokenDiagnostic(): void {
  if (typeof window === 'undefined') {
    console.error('Cannot run token diagnostic in server environment');
    return;
  }

  console.group('=== TOKEN DIAGNOSTIC ===');

  const diagnostic = runTokenDiagnostic();

  console.log('Tokens Available:', {
    hasAccessTokenInLocalStorage: !!diagnostic.tokens.accessTokenFromLocalStorage,
    hasRefreshTokenInLocalStorage: !!diagnostic.tokens.refreshTokenFromLocalStorage,
    hasNextAuthTokenInLocalStorage: !!diagnostic.tokens.nextAuthTokenFromLocalStorage,
    hasAccessTokenInCookie: !!diagnostic.tokens.accessTokenFromCookie,
    hasRefreshTokenInCookie: !!diagnostic.tokens.refreshTokenFromCookie,
    hasNextAuthTokenInCookie: !!diagnostic.tokens.nextAuthTokenFromCookie,
  });

  console.log('Token Status:', diagnostic.tokenStatus);
  console.log('LocalStorage Keys:', diagnostic.localStorage);
  console.log('Cookies:', diagnostic.cookies);

  console.groupEnd();
}

// Export a function that can be called from the browser console
if (typeof window !== 'undefined') {
  (window as any).debugTokens = logTokenDiagnostic;
}
