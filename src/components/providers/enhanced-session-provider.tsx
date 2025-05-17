'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Create a context to track if session polling should be disabled
interface SessionPollingContextType {
  isPollingDisabled: boolean;
  disablePolling: () => void;
  enablePolling: () => void;
}

const SessionPollingContext = createContext<SessionPollingContextType | undefined>(undefined);

// Custom hook to use the session polling context
export function useSessionPolling() {
  const context = useContext(SessionPollingContext);
  if (context === undefined) {
    throw new Error('useSessionPolling must be used within a EnhancedSessionProvider');
  }
  return context;
}

interface EnhancedSessionProviderProps {
  children: ReactNode;
  session?: any;
  basePath?: string;
}

export function EnhancedSessionProvider({
  children,
  session,
  basePath,
}: EnhancedSessionProviderProps) {
  const [isPollingDisabled, setIsPollingDisabled] = useState(false);
  const router = useRouter();

  // Function to disable session polling
  const disablePolling = () => {
    console.log('Disabling session polling');
    setIsPollingDisabled(true);
    
    // Store in localStorage to persist across page loads
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionPollingDisabled', 'true');
    }
  };

  // Function to enable session polling
  const enablePolling = () => {
    console.log('Enabling session polling');
    setIsPollingDisabled(false);
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sessionPollingDisabled');
    }
  };

  // Check localStorage on mount to see if polling should be disabled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldDisable = localStorage.getItem('sessionPollingDisabled') === 'true';
      setIsPollingDisabled(shouldDisable);
    }
  }, []);

  // Listen for route changes to re-enable polling when navigating to login page
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url.includes('/login')) {
        enablePolling();
      }
    };

    // This is a simplified approach - in a real app you'd use the router events
    // For Next.js App Router, you might need a different approach
    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });

    return () => {
      window.removeEventListener('popstate', () => {
        handleRouteChange(window.location.pathname);
      });
    };
  }, [router]);

  // Provide the session polling context
  const contextValue: SessionPollingContextType = {
    isPollingDisabled,
    disablePolling,
    enablePolling,
  };

  return (
    <SessionPollingContext.Provider value={contextValue}>
      <SessionProvider 
        session={session} 
        basePath={basePath}
        refetchInterval={isPollingDisabled ? 0 : 5 * 60} // 5 minutes if not disabled
        refetchOnWindowFocus={!isPollingDisabled}
      >
        {children}
      </SessionProvider>
    </SessionPollingContext.Provider>
  );
}
