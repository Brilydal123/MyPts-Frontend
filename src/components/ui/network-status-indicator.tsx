'use client';

import React, { useState, useEffect } from 'react';
import { useNetworkStatusContext } from '@/contexts/NetworkStatusContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showOfflineToast, showOnlineToast, dismissNetworkToasts } from '@/lib/network-toast';

interface NetworkStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  autoHide?: boolean;
  hideDelay?: number;
}

export function NetworkStatusIndicator({
  className,
  showLabel = true,
  position = 'bottom-right',
  autoHide = true,
  hideDelay = 3000
}: NetworkStatusIndicatorProps) {
  const { status, isOnline, isOffline, isChecking, checkNow } = useNetworkStatusContext();
  const [visible, setVisible] = useState(false);

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  // Track offline state for toast management
  const [wasOffline, setWasOffline] = useState(false);

  // Show the indicator when status changes
  useEffect(() => {
    setVisible(true);

    // If autoHide is enabled and we're online, hide after delay
    if (autoHide && isOnline) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, hideDelay);

      return () => clearTimeout(timer);
    }

    // If offline or checking, always show
    return undefined;
  }, [status, isOnline, autoHide, hideDelay]);

  // Handle network status changes and toast notifications
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    // Create a function to handle status changes to avoid dependency array issues
    const handleNetworkStatusChange = () => {
      // When going offline
      if (isOffline) {
        setWasOffline(true);
        showOfflineToast();
      }
      // When coming back online after being offline
      else if (isOnline && wasOffline) {
        setWasOffline(false);
        showOnlineToast();
      }
      // When checking connection after being offline
      else if (isChecking && wasOffline) {
        // Don't dismiss the offline toast yet, but update its content
        // to indicate we're trying to reconnect
        import('sonner').then(({ toast }) => {
          toast.dismiss('network-offline-toast');
          toast.error('Reconnecting...', {
            id: 'network-offline-toast',
            description: 'Checking your internet connection',
            duration: Infinity,
          });
        });
      }
    };

    // Call the handler function
    handleNetworkStatusChange();

    // Cleanup function to dismiss toasts when component unmounts
    return () => {
      if (isOffline) {
        // Don't dismiss offline toast on unmount if we're still offline
        // This ensures the toast persists across page navigations
      } else {
        // Dismiss all network toasts if we're online
        dismissNetworkToasts();
      }
    };
  }, [status, wasOffline]); // Only depend on status and wasOffline

  // Always show if inline
  useEffect(() => {
    if (position === 'inline') {
      setVisible(true);
    }
  }, [position]);

  // Show again briefly when user interacts with the page
  useEffect(() => {
    if (position === 'inline') return;

    const handleUserInteraction = () => {
      if (!visible && isOnline) {
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [visible, isOnline, position]);

  return (
    <AnimatePresence>
      {(visible || isOffline || isChecking || position === 'inline') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 shadow-md',
            isOnline ? 'bg-green-100 dark:bg-green-900/30' :
              isChecking ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-red-100 dark:bg-red-900/30',
            positionClasses[position],
            className
          )}
        >
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : isChecking ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </motion.div>
          ) : (
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}

          {showLabel && (
            <span
              className={cn(
                'text-xs font-medium',
                isOnline ? 'text-green-700 dark:text-green-300' :
                  isChecking ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
              )}
            >
              {isOnline ? 'Online' : isChecking ? 'Checking...' : 'Offline'}
            </span>
          )}

          {isOffline && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 ml-1 px-2 py-1 text-xs rounded-full"
              onClick={() => checkNow()}
            >
              Retry
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
