'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { API_URL } from '@/lib/constants';
import { useNetworkStatusContext } from '@/contexts/NetworkStatusContext';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

interface UserStatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  pulseAnimation?: boolean;
}

export function UserStatusIndicator({
  userId,
  size = 'md',
  className,
  showLabel = false,
  pulseAnimation = true,
}: UserStatusIndicatorProps) {
  const { isOnline } = useNetworkStatusContext();
  const [status, setStatus] = useState<UserStatus>('offline');
  const [lastActive, setLastActive] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Status classes
  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400 dark:bg-gray-600',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  // Status labels
  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
  };

  // Fetch user status
  useEffect(() => {
    // Skip if we're offline or no userId
    if (!isOnline || !userId) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        
        // Use localStorage to check if we have a recent status
        const cachedStatus = localStorage.getItem(`userStatus_${userId}`);
        const cachedTimestamp = localStorage.getItem(`userStatusTime_${userId}`);
        
        if (cachedStatus && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          
          // If cache is less than 2 minutes old, use it
          if (now - timestamp < 2 * 60 * 1000) {
            setStatus(cachedStatus as UserStatus);
            setLastActive(new Date(timestamp));
            setLoading(false);
            return;
          }
        }
        
        // Otherwise fetch from API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${API_URL}/api/users/${userId}/status`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            // Update state
            setStatus(data.status || 'offline');
            setLastActive(data.lastActive ? new Date(data.lastActive) : null);
            
            // Cache the result
            localStorage.setItem(`userStatus_${userId}`, data.status || 'offline');
            localStorage.setItem(`userStatusTime_${userId}`, Date.now().toString());
          } else {
            // Fallback to offline if API returns error
            setStatus('offline');
          }
        } else {
          // Fallback to offline if API call fails
          setStatus('offline');
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
        setStatus('offline');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch initially
    fetchStatus();
    
    // Set up interval to refresh status
    const intervalId = setInterval(fetchStatus, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [userId, isOnline]);

  // If we're offline, show user as offline
  useEffect(() => {
    if (!isOnline) {
      setStatus('offline');
    }
  }, [isOnline]);

  return (
    <div className="flex items-center gap-1.5">
      {pulseAnimation && status === 'online' ? (
        <motion.div
          className={cn(
            'rounded-full',
            sizeClasses[size],
            statusClasses[status],
            className
          )}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <div
          className={cn(
            'rounded-full',
            sizeClasses[size],
            statusClasses[status],
            className
          )}
        />
      )}
      
      {showLabel && (
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}
