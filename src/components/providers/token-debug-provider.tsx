'use client';

import { ReactNode, useEffect } from 'react';
import { logTokenDiagnostic } from '@/lib/token-debug';
import { clearAllTokens, forceLogin, fixTokenInconsistencies } from '@/lib/fix-tokens';

interface TokenDebugProviderProps {
  children: ReactNode;
}

/**
 * Provider component that adds token debugging capabilities
 *
 * This component:
 * 1. Adds the token debug utility to the window object
 * 2. Logs token diagnostic information on mount
 * 3. Sets up a listener for token refresh events
 */
export function TokenDebugProvider({ children }: TokenDebugProviderProps) {
  useEffect(() => {
    // Add token debug and fix utilities to window object
    if (typeof window !== 'undefined') {
      // Add debug utility
      (window as any).debugTokens = logTokenDiagnostic;

      // Add fix utilities
      (window as any).fixTokens = {
        clearAllTokens,
        forceLogin,
        fixTokenInconsistencies
      };

      // Log token diagnostic information on mount
      console.log('Token Debug Provider mounted, running initial diagnostic');
      console.log('Available in console: window.debugTokens() and window.fixTokens.*');
      logTokenDiagnostic();

      // Set up listener for token refresh events
      const handleTokenRefresh = () => {
        console.log('Token refresh detected, running diagnostic');
        logTokenDiagnostic();
      };

      window.addEventListener('tokensRefreshed', handleTokenRefresh);

      // Clean up
      return () => {
        window.removeEventListener('tokensRefreshed', handleTokenRefresh);
      };
    }
  }, []);

  return <>{children}</>;
}
