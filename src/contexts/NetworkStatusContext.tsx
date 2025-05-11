'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNetworkStatus, NetworkStatus } from '@/hooks/use-network-status';

interface NetworkStatusContextType {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  isChecking: boolean;
  lastPingSuccess: number;
  checkNow: () => Promise<void>;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  status: 'checking',
  isOnline: false,
  isOffline: false,
  isChecking: true,
  lastPingSuccess: 0,
  checkNow: async () => {}
});

export const useNetworkStatusContext = () => useContext(NetworkStatusContext);

interface NetworkStatusProviderProps {
  children: ReactNode;
  pingInterval?: number;
  pingTimeout?: number;
  pingEndpoint?: string;
}

export function NetworkStatusProvider({
  children,
  pingInterval,
  pingTimeout,
  pingEndpoint
}: NetworkStatusProviderProps) {
  const networkStatus = useNetworkStatus({
    pingInterval,
    pingTimeout,
    pingEndpoint
  });

  return (
    <NetworkStatusContext.Provider value={networkStatus}>
      {children}
    </NetworkStatusContext.Provider>
  );
}
