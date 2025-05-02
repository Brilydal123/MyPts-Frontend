'use client';

import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

/**
 * Comprehensive logout function that:
 * 1. Calls the backend logout API
 * 2. Clears all cookies with various domain/path combinations
 * 3. Clears localStorage
 * 4. Signs out from NextAuth
 * 5. Redirects to login page
 */
export async function logout() {
  try {
    // 1. Call our custom logout API endpoint to clear cookies server-side
    console.log('Calling custom logout API endpoint...');
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    console.log('✅ Custom logout API call completed');

    // 2. Clear all localStorage items
    if (typeof window !== 'undefined') {
      console.log('Clearing localStorage...');

      // Log all localStorage items before clearing for debugging
      console.log('LocalStorage items before clearing:', Object.keys(localStorage));

      // Clear all localStorage items
      localStorage.clear();

      // Double-check that localStorage is empty
      console.log('LocalStorage items after clearing:', Object.keys(localStorage));

      // 3. Clear all cookies with different path and domain combinations
      console.log('Clearing cookies client-side...');
      const cookiesToClear = document.cookie.split(';');

      // Log all cookies before clearing for debugging
      console.log('Cookies before clearing:', document.cookie);

      // Clear cookies with different path combinations
      const paths = ['/', '/api', '', '/dashboard', '/select-profile', '/login'];
      const domains = [
        window.location.hostname,
        `.${window.location.hostname}`,
        '',
        'localhost',
        '.localhost',
        window.location.hostname.split('.').slice(-2).join('.')  // e.g., example.com from sub.example.com
      ];

      // First, clear all cookies found in the document
      cookiesToClear.forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (!name) return;

        // Try different combinations of paths and domains
        paths.forEach(path => {
          domains.forEach(domain => {
            // Clear with domain
            if (domain) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            } else {
              // Clear without specifying domain
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            }
          });
        });

        // Also try secure flag combinations
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`;
      });

      // Specifically target NextAuth.js cookies
      [
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.callback-url',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
        'next-auth.pkce.code_verifier',
        'next-auth.pkce.state'
      ].forEach(cookieName => {
        paths.forEach(path => {
          domains.forEach(domain => {
            if (domain) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            } else {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            }

            // Also try with secure flag
            if (domain) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
            } else {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
            }
          });
        });
      });

      // Specifically target our custom cookies
      [
        'accesstoken', 'refreshtoken', 'accessToken', 'refreshToken',
        'profileId', 'profileToken', 'selectedProfileId', 'selectedProfileToken',
        'user-id', 'userId', 'user', 'session'
      ].forEach(cookieName => {
        paths.forEach(path => {
          domains.forEach(domain => {
            if (domain) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            } else {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            }

            // Also try with secure flag
            if (domain) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
            } else {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
            }
          });
        });
      });

      // Extra aggressive clearing for profile-related cookies
      // Try with different case variations and without quotes
      ['profileId', 'ProfileId', 'PROFILEID', 'profileid',
       'profileToken', 'ProfileToken', 'PROFILETOKEN', 'profiletoken',
       'profile_id', 'profile_token'].forEach(cookieName => {
        // Try with different paths
        ['/', '/dashboard', '/select-profile', '/api', ''].forEach(path => {
          // Try with different domains
          [window.location.hostname, `.${window.location.hostname}`, 'localhost', '.localhost', ''].forEach(domain => {
            // Try with and without domain
            if (domain) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure; samesite=none;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure; samesite=lax;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure; samesite=strict;`;
            } else {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure; samesite=none;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure; samesite=lax;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure; samesite=strict;`;
            }
          });
        });
      });

      // Double-check that cookies are cleared
      console.log('Cookies after clearing:', document.cookie);

      // Last resort: Try to directly manipulate document.cookie property
      try {
        // If cookies still exist, try a more direct approach
        if (document.cookie) {
          console.log('Some cookies still exist, trying direct manipulation...');

          // Try to directly set document.cookie to empty string
          document.cookie = '';

          // Try to overwrite all cookies with an empty value
          const remainingCookies = document.cookie.split(';');
          for (const cookie of remainingCookies) {
            const [name] = cookie.trim().split('=');
            if (name) {
              console.log(`Directly clearing cookie: ${name}`);
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          }

          console.log('After direct manipulation:', document.cookie);
        }
      } catch (e) {
        console.error('Error during direct cookie manipulation:', e);
      }

      // Clear sessionStorage as well
      try {
        console.log('Clearing sessionStorage...');
        sessionStorage.clear();
        console.log('✅ SessionStorage cleared');
      } catch (e) {
        console.error('Error clearing sessionStorage:', e);
      }

      // Clear any IndexedDB databases
      try {
        console.log('Checking for IndexedDB databases to clear...');
        if (window.indexedDB) {
          const databases = await window.indexedDB.databases();
          databases.forEach(db => {
            if (db.name) {
              console.log(`Deleting IndexedDB database: ${db.name}`);
              window.indexedDB.deleteDatabase(db.name);
            }
          });
          console.log('✅ IndexedDB databases cleared');
        }
      } catch (e) {
        console.error('Error clearing IndexedDB:', e);
      }

      console.log('✅ All storage items and cookies cleared client-side');
    }

    // 4. Sign out from NextAuth with redirect: false to prevent automatic redirect
    await signOut({ redirect: false });
    console.log('✅ NextAuth signOut completed');

    // Check if any authentication-related cookies are still present
    const checkForRemainingCookies = () => {
      const cookieString = document.cookie;
      console.log('Final cookie check before redirect:', cookieString);

      // Check for specific auth-related cookies
      const authCookies = [
        'profileId', 'profileToken', 'accessToken', 'refreshToken',
        'next-auth.session-token', 'selectedProfileId', 'selectedProfileToken'
      ];

      const remainingAuthCookies = authCookies.filter(name =>
        cookieString.includes(name + '=')
      );

      if (remainingAuthCookies.length > 0) {
        console.warn('Warning: Some auth cookies still remain after logout:', remainingAuthCookies);
        return true;
      }

      return false;
    };

    const hasRemainingCookies = checkForRemainingCookies();

    // 5. Redirect to login page with logout flag
    console.log('Redirecting to login page with logout flag...');

    // Add a parameter to force cache busting if cookies remain
    const redirectUrl = hasRemainingCookies
      ? `/login?logout=true&nocache=${Date.now()}`
      : '/login?logout=true';

    window.location.href = redirectUrl;

    // Show success toast
    if (hasRemainingCookies) {
      toast.warning('Logged out, but some cookies could not be cleared. Please clear your browser cookies manually for complete security.');
    } else {
      toast.success('Logged out successfully');
    }

  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, try to redirect to login with logout flag
    window.location.href = '/login?logout=true';

    // Show error toast
    toast.error('Error during logout, but redirected to login');
  }
}
