'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';
import AUTH_CONFIG from '@/lib/auth/auth-config';

/**
 * Hook to protect routes based on authentication and roles (NextAuth.js version)
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
    // Add role-based check if needed
    if (!isLoading && isAuthenticated && requiredRoles) {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const hasRequiredRole = roles.includes(user?.role || 'user') || isAdmin;
      if (!hasRequiredRole) {
        router.push(AUTH_CONFIG.routes.dashboard);
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, user, router, requiredRoles, redirectTo]);

  const isAuthorized = isAuthenticated && (!requiredRoles || isAdmin || (user?.role && (Array.isArray(requiredRoles)
    ? requiredRoles.includes(user.role)
    : user.role === requiredRoles)));

  return { isAuthorized, isLoading };
}
