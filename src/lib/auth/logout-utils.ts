import { signOut } from 'next-auth/react';

/**
 * Clear all authentication-related cookies
 */
export const clearAuthCookies = (): void => {
  if (typeof document === 'undefined') return;

  const cookiesToClear = [
    'accessToken',
    'accesstoken',
    'refreshToken',
    'refreshtoken',
    'profileToken',
    'profiletoken',
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    'userCountry',
    'X-User-Is-Admin',
    'X-User-Role',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.csrf-token'
  ];

  cookiesToClear.forEach(cookieName => {
    // Clear the cookie with various path and domain combinations to ensure it's removed
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
    document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;

    // Also try with secure and SameSite attributes
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=None; Secure`;
  });

  console.log('All authentication cookies cleared');
};

/**
 * Clear specific keys from localStorage
 */
export const clearAuthLocalStorage = (): void => {
  if (typeof window === 'undefined') return;

  const keysToRemove = [
    // User identification
    'user',
    'userId',
    'userCountry',
    'rawUserData',
    'userFullName',

    // Authentication tokens
    'accessToken',
    'refreshToken',
    'tokenExpiry',
    'lastActivity',

    // Profile data
    'selectedProfileId',
    'selectedProfileToken',
    'profileId',
    'profileToken',
    'originalProfileId',

    // Admin status
    'isAdmin',
    'userRole',

    // Session data
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',

    // Redirect info
    'redirectAfterLogin'
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  });

  console.log('All authentication data cleared from localStorage');
};

/**
 * Clear all browser storages (legacy method)
 */
export const clearStorages = () => {
  try {
    // First clear specific auth items
    clearAuthLocalStorage();

    // Clear session storage
    sessionStorage.clear();

    // Clear cookies
    clearAuthCookies();

    console.log('All storages cleared');
  } catch (e) {
    console.error('Error clearing storages:', e);
  }
};

/**
 * Handle logout with improved cleanup
 */
export const handleLogout = async () => {
  try {
    console.log('Starting logout process...');

    // Clear all stored data first
    clearStorages();

    // Add a timestamp to prevent caching
    const nocache = Date.now();

    // Call NextAuth signOut with specific options
    await signOut({
      callbackUrl: `/login?nocache=${nocache}`,
      redirect: false // We'll handle the redirect manually
    });

    console.log('NextAuth signOut completed');

    // Force a hard reload to clear any in-memory state
    window.location.href = `/login?nocache=${nocache}`;

  } catch (error) {
    console.error('Error during logout:', error);

    // Even if signOut fails, clear storages again
    clearStorages();

    // Fallback: force reload to login page with cache-busting
    window.location.href = `/login?nocache=${Date.now()}`;
  }
};
