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
      localStorage.clear();

      // 3. Clear all cookies with different path and domain combinations
      console.log('Clearing cookies client-side...');
      const cookiesToClear = document.cookie.split(';');

      // Clear cookies with different path combinations
      const paths = ['/', '/api', ''];
      const domains = [window.location.hostname, `.${window.location.hostname}`, ''];

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
        '__Host-next-auth.csrf-token'
      ].forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
      });

      // Specifically target our custom cookies
      ['accesstoken', 'refreshtoken', 'accessToken', 'refreshToken'].forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
      });

      console.log('✅ All localStorage items and cookies cleared client-side');
    }

    // 4. Sign out from NextAuth with redirect: false to prevent automatic redirect
    await signOut({ redirect: false });
    console.log('✅ NextAuth signOut completed');

    // 5. Redirect to login page with logout flag
    console.log('Redirecting to login page with logout flag...');
    window.location.href = '/login?logout=true';

    // Show success toast
    toast.success('Logged out successfully');

  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, try to redirect to login with logout flag
    window.location.href = '/login?logout=true';

    // Show error toast
    toast.error('Error during logout, but redirected to login');
  }
}
