'use client';

import { ReactNode } from 'react';
import { useTokenRefreshManager } from '@/lib/token-refresh-manager';
import { usePathname } from 'next/navigation';

interface TokenRefreshProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages token refresh
 * 
 * This component:
 * 1. Uses the token refresh manager hook
 * 2. Only runs on authenticated routes (not login, register, etc.)
 * 3. Silently refreshes tokens in the background
 */
export function TokenRefreshProvider({ children }: TokenRefreshProviderProps) {
  const pathname = usePathname();
  
  // Skip token refresh on auth pages
  const isAuthPage = pathname?.includes('/login') || 
                    pathname?.includes('/register') || 
                    pathname?.includes('/auth/');
  
  // Only use the token refresh manager on non-auth pages
  if (!isAuthPage) {
    // This hook will handle token refresh
    useTokenRefreshManager();
  }
  
  return <>{children}</>;
}
