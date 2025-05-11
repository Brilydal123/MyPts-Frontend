'use client';

import React, { useEffect, useState } from 'react';
import { usePresence, PresenceStatus } from '@/contexts/PresenceContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatusIndicatorProps {
  userId?: string;
  profileId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  pulseAnimation?: boolean;
}

export function StatusIndicator({
  userId,
  profileId,
  size = 'md',
  className,
  showLabel = false,
  pulseAnimation = true,
}: StatusIndicatorProps) {
  const { getUserStatus, getProfileStatus, userStatuses, profileStatuses, isConnected } = usePresence();
  const [status, setStatus] = useState<PresenceStatus>('offline');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the status based on userId or profileId
  useEffect(() => {
    const fetchStatus = async () => {
      // Skip if we're not connected to avoid unnecessary API calls
      if (!isConnected && !userStatuses[userId || ''] && !profileStatuses[profileId || '']) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (userId) {
          // Check if we already have the status in context
          if (userStatuses[userId]) {
            setStatus(userStatuses[userId]);
          } else {
            // Otherwise fetch it
            const userStatus = await getUserStatus(userId);
            setStatus(userStatus);
          }
        } else if (profileId) {
          // Check if we already have the status in context
          if (profileStatuses[profileId]) {
            setStatus(profileStatuses[profileId]);
          } else {
            // Otherwise fetch it
            const profileStatus = await getProfileStatus(profileId);
            setStatus(profileStatus);
          }
        }
      } catch (err) {
        console.error('Error fetching status:', err);
        setError('Failed to fetch status');
        // Keep the current status or default to offline
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [userId, profileId, getUserStatus, getProfileStatus, userStatuses, profileStatuses, isConnected]);

  // Update status when it changes in context
  useEffect(() => {
    if (userId && userStatuses[userId]) {
      setStatus(userStatuses[userId]);
    } else if (profileId && profileStatuses[profileId]) {
      setStatus(profileStatuses[profileId]);
    }
  }, [userId, profileId, userStatuses, profileStatuses]);

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

interface UserStatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  pulseAnimation?: boolean;
}

export function UserStatusIndicator(props: UserStatusIndicatorProps) {
  const { subscribeToUsers } = usePresence();

  // Subscribe to updates for this user
  useEffect(() => {
    subscribeToUsers([props.userId]);
  }, [props.userId, subscribeToUsers]);

  return <StatusIndicator {...props} />;
}

interface ProfileStatusIndicatorProps {
  profileId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  pulseAnimation?: boolean;
}

export function ProfileStatusIndicator(props: ProfileStatusIndicatorProps) {
  const { subscribeToProfiles } = usePresence();

  // Subscribe to updates for this profile
  useEffect(() => {
    subscribeToProfiles([props.profileId]);
  }, [props.profileId, subscribeToProfiles]);

  return <StatusIndicator {...props} />;
}
