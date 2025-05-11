'use client';

import React, { useEffect, useState } from 'react';
import { usePresence } from '@/contexts/PresenceContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
  showLabel?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
}

export function NetworkStatus({
  className,
  showLabel = true,
  position = 'top-right',
}: NetworkStatusProps) {
  const { isConnected, status } = usePresence();
  const [visible, setVisible] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Check if socket is reconnecting
  useEffect(() => {
    const checkReconnecting = () => {
      if (typeof window !== 'undefined') {
        setReconnecting(!!(window as any).socketReconnecting);
      }
    };

    // Check initially
    checkReconnecting();

    // Set up interval to check periodically
    const interval = setInterval(checkReconnecting, 1000);

    return () => clearInterval(interval);
  }, []);

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  // Show the indicator when connection status changes
  useEffect(() => {
    setVisible(true);

    // If we're connected, hide after a delay
    // If disconnected, keep visible for a while then hide
    let timer: NodeJS.Timeout | null = null;

    if (isConnected) {
      // Connected - hide after short delay
      timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
    } else {
      // Disconnected - show for longer, then hide
      // This prevents the disconnected message from staying forever
      // which could be distracting to users
      timer = setTimeout(() => {
        setVisible(false);
      }, 10000); // 10 seconds
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConnected]);

  // Show again briefly when user interacts with the page
  useEffect(() => {
    const handleUserInteraction = () => {
      // Only show if we're not already visible
      if (!visible) {
        setVisible(true);

        // Hide again after a delay
        const timer = setTimeout(() => {
          setVisible(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    };

    // Add event listeners for user interaction
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [visible]);

  // Always show if inline
  useEffect(() => {
    if (position === 'inline') {
      setVisible(true);
    }
  }, [position]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 shadow-md',
            isConnected
              ? 'bg-green-100 dark:bg-green-900/30'
              : reconnecting
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : 'bg-red-100 dark:bg-red-900/30',
            positionClasses[position],
            className
          )}
        >
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : reconnecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Wifi className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </motion.div>
          ) : (
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}

          {showLabel && (
            <span
              className={cn(
                'text-xs font-medium',
                isConnected
                  ? 'text-green-700 dark:text-green-300'
                  : reconnecting
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-red-700 dark:text-red-300'
              )}
            >
              {isConnected
                ? 'Connected'
                : reconnecting
                  ? 'Reconnecting...'
                  : 'Disconnected'}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface UserNetworkStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function UserNetworkStatus({ className, showLabel = true }: UserNetworkStatusProps) {
  const { status, setStatus } = usePresence();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            status === 'online' && 'bg-green-500',
            status === 'offline' && 'bg-gray-400',
            status === 'away' && 'bg-yellow-500',
            status === 'busy' && 'bg-red-500'
          )}
        />

        {showLabel && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {status === 'online' && 'Online'}
            {status === 'offline' && 'Offline'}
            {status === 'away' && 'Away'}
            {status === 'busy' && 'Busy'}
          </span>
        )}
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as any)}
        className="text-xs rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1"
      >
        <option value="online">Online</option>
        <option value="away">Away</option>
        <option value="busy">Busy</option>
      </select>
    </div>
  );
}
