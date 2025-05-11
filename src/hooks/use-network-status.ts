'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/constants';

export type NetworkStatus = 'online' | 'offline' | 'checking';

interface UseNetworkStatusOptions {
  pingInterval?: number; // How often to ping the server (in ms)
  pingTimeout?: number;  // How long to wait for ping response (in ms)
  pingEndpoint?: string; // What endpoint to ping
}

/**
 * Hook to track network and server connectivity status
 */
export function useNetworkStatus(options?: UseNetworkStatusOptions) {
  const {
    pingInterval = 30000, // 30 seconds
    pingTimeout = 5000,   // 5 seconds
    pingEndpoint = `${API_URL}/health`
  } = options || {};

  const [status, setStatus] = useState<NetworkStatus>(() => {
    // Initialize from localStorage if available, otherwise use browser's navigator.onLine
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('networkStatus');
      if (savedStatus === 'online' || savedStatus === 'offline') {
        return savedStatus;
      }
      return navigator.onLine ? 'online' : 'offline';
    }
    return 'checking';
  });

  // Track last successful ping time
  const [lastPingSuccess, setLastPingSuccess] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastPingSuccess');
      return saved ? parseInt(saved, 10) : Date.now();
    }
    return Date.now();
  });

  // Function to ping the server
  const pingServer = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setStatus('checking');
      
      // Use a controller to timeout the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), pingTimeout);
      
      // Ping the server
      const response = await fetch(pingEndpoint, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setStatus('online');
        const now = Date.now();
        setLastPingSuccess(now);
        localStorage.setItem('lastPingSuccess', now.toString());
        localStorage.setItem('networkStatus', 'online');
      } else {
        setStatus('offline');
        localStorage.setItem('networkStatus', 'offline');
      }
    } catch (error) {
      console.error('Error pinging server:', error);
      setStatus('offline');
      localStorage.setItem('networkStatus', 'offline');
    }
  }, [pingEndpoint, pingTimeout]);

  // Handle browser online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      // When browser detects we're online, ping the server to confirm
      pingServer();
    };
    
    const handleOffline = () => {
      setStatus('offline');
      localStorage.setItem('networkStatus', 'offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial ping
    pingServer();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pingServer]);

  // Set up periodic pinging
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const intervalId = setInterval(() => {
      // Only ping if browser thinks we're online
      if (navigator.onLine) {
        pingServer();
      }
    }, pingInterval);
    
    return () => clearInterval(intervalId);
  }, [pingInterval, pingServer]);

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, ping to update status
        pingServer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pingServer]);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isChecking: status === 'checking',
    lastPingSuccess,
    checkNow: pingServer
  };
}
