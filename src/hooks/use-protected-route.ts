'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AUTH_CONFIG from '@/lib/auth/config';

/**
 * Hook to protect routes based on authentication and roles
 *
 * @param requiredRoles Optional array of roles required to access the route
 * @param redirectTo Optional path to redirect to if not authenticated
 * @returns Object with isAuthorized and isLoading flags
 */
export function useProtectedRoute(
  requiredRoles?: string | string[],
  redirectTo: string = AUTH_CONFIG.routes.login
) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip protection for public routes
    if (AUTH_CONFIG.publicRoutes.some(route => pathname?.includes(route))) {
      return;
    }

    // Wait until auth state is loaded
    if (isLoading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Store the current path for redirect after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', pathname || '/');
      }

      router.push(`${redirectTo}?from=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    // If no roles required, allow access
    if (!requiredRoles) {
      return;
    }

    // Convert to array if string
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // Admin has access to everything
    if (isAdmin) {
      return;
    }

    // Check if user has required role
    const hasRequiredRole = roles.includes(user?.role || 'user');

    if (!hasRequiredRole) {
      // Redirect to dashboard if not authorized
      router.push(AUTH_CONFIG.routes.dashboard);
    }
  }, [isAuthenticated, isLoading, isAdmin, user, router, pathname, requiredRoles, redirectTo]);

  // Check if user is authorized
  const isAuthorized = isAuthenticated && (
    !requiredRoles ||
    isAdmin ||
    (user?.role && Array.isArray(requiredRoles)
      ? requiredRoles.includes(user.role)
      : user?.role === requiredRoles)
  );

  return { isAuthorized, isLoading };
}
