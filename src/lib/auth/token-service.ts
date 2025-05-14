/**
 * Token Service
 *
 * This file contains utilities for handling JWT tokens, including:
 * - Parsing and validating tokens
 * - Checking token expiration
 * - Refreshing tokens
 * - Managing token storage
 */

import { TokenResponse } from './types';
import AUTH_CONFIG from './config';

/**
 * Parse a JWT token without validation
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function parseJwt(token: string): any {
  try {
    // For server-side
    if (typeof window === 'undefined') {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
    // For client-side
    else {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
  } catch (e) {
    console.error("Failed to parse JWT token:", e);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token JWT token string
 * @param thresholdMs Time in milliseconds before expiration to consider token as expired
 * @returns Boolean indicating if token is expired or will expire soon
 */
export function isTokenExpired(token: string, thresholdMs = AUTH_CONFIG.tokens.refreshThreshold): boolean {
  try {
    if (!token) return true;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;

    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    return Date.now() + thresholdMs > expiresAt;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider expired if we can't parse it
  }
}

/**
 * Get token expiration time in milliseconds
 * @param token JWT token string
 * @returns Expiration time in milliseconds or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  try {
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return null;

    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
}

/**
 * Client-side function to refresh the access token
 * @returns Promise resolving to the new tokens or null if refresh failed
 */
export async function refreshAccessToken(): Promise<TokenResponse | null> {
  try {
    // Try the frontend-refresh endpoint which uses HttpOnly cookies
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Important to include cookies
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.tokens) {
      console.error('Token refresh response invalid:', data);
      return null;
    }

    return {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      profileId: data.tokens.profileId,
      profileToken: data.tokens.profileToken,
      expiresIn: data.tokens.expiresIn,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Server-side function to refresh the access token
 * @param refreshToken The refresh token
 * @returns Promise resolving to the new tokens or null if refresh failed
 */
export async function refreshAccessTokenServer(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const apiUrl = AUTH_CONFIG.api.baseUrl;

    const response = await fetch(`${apiUrl}${AUTH_CONFIG.api.endpoints.refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token on server:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.tokens) {
      console.error('Token refresh response invalid on server:', data);
      return null;
    }

    return {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      profileId: data.tokens.profileId,
      profileToken: data.tokens.profileToken,
      expiresIn: data.tokens.expiresIn,
    };
  } catch (error) {
    console.error('Error refreshing token on server:', error);
    return null;
  }
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
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Set a cookie
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
export function setCookie(name: string, value: string, options: any = {}): void {
  if (typeof document === 'undefined') return;

  const cookieOptions = {
    path: '/',
    ...options,
  };

  let cookieString = `${name}=${value}`;

  if (cookieOptions.maxAge) {
    cookieString += `; Max-Age=${cookieOptions.maxAge}`;
  }

  if (cookieOptions.domain) {
    cookieString += `; Domain=${cookieOptions.domain}`;
  }

  if (cookieOptions.path) {
    cookieString += `; Path=${cookieOptions.path}`;
  }

  if (cookieOptions.secure) {
    cookieString += '; Secure';
  }

  if (cookieOptions.httpOnly) {
    cookieString += '; HttpOnly';
  }

  if (cookieOptions.sameSite) {
    cookieString += `; SameSite=${cookieOptions.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Delete a cookie
 * @param name Cookie name
 * @param options Cookie options
 */
export function deleteCookie(name: string, options: any = {}): void {
  setCookie(name, '', { ...options, maxAge: -1 });
}
