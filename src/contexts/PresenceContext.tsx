'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { API_URL } from '@/lib/constants';
import { socketService } from '@/lib/socket-service';
import { toast } from 'sonner';

// Define the status types
export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy';

// Define the context type
interface PresenceContextType {
  status: PresenceStatus;
  setStatus: (status: PresenceStatus) => void;
  isConnected: boolean;
  getUserStatus: (userId: string) => Promise<PresenceStatus>;
  getProfileStatus: (profileId: string) => Promise<PresenceStatus>;
  userStatuses: Record<string, PresenceStatus>;
  profileStatuses: Record<string, PresenceStatus>;
  subscribeToUsers: (userIds: string[]) => void;
  subscribeToProfiles: (profileIds: string[]) => void;
}

// Create the context with default values
const PresenceContext = createContext<PresenceContextType>({
  status: 'offline',
  setStatus: () => { },
  isConnected: false,
  getUserStatus: async () => 'offline',
  getProfileStatus: async () => 'offline',
  userStatuses: {},
  profileStatuses: {},
  subscribeToUsers: () => { },
  subscribeToProfiles: () => { },
});

// Custom hook to use the presence context
export const usePresence = () => useContext(PresenceContext);

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const { user, profileId, accessToken, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<PresenceStatus>('offline');
  const [isConnected, setIsConnected] = useState(false);
  const [userStatuses, setUserStatuses] = useState<Record<string, PresenceStatus>>({});
  const [profileStatuses, setProfileStatuses] = useState<Record<string, PresenceStatus>>({});
  const [subscribedUsers, setSubscribedUsers] = useState<Set<string>>(new Set());
  const [subscribedProfiles, setSubscribedProfiles] = useState<Set<string>>(new Set());

  // Update status function - defined early to avoid reference errors
  const updateStatus = useCallback((newStatus: PresenceStatus) => {
    setStatus(newStatus);

    if (socketService.isConnected()) {
      socketService.emit('presence:status', newStatus);
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !profileId || !accessToken) {
      return;
    }

    // Track connection attempts to avoid excessive retries
    let connectionAttempts = 0;
    const maxConnectionAttempts = 2;

    // Function to initialize socket connection with retry logic
    const initializeSocket = () => {
      if (connectionAttempts >= maxConnectionAttempts) {
        console.log('Max connection attempts reached, giving up');
        return;
      }

      connectionAttempts++;
      console.log(`Connection attempt ${connectionAttempts}/${maxConnectionAttempts}`);

      try {
        // Initialize socket connection
        socketService.connect(accessToken, user.id, profileId);
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    // Initialize socket
    initializeSocket();

    // Set up connection handlers
    const handleConnect = () => {
      setIsConnected(true);

      try {
        // Emit presence:connect event with user and profile IDs
        socketService.emit('presence:connect', {
          userId: user.id,
          profileId,
          deviceType: getDeviceType()
        });

        // Set initial status to online
        updateStatus('online');
      } catch (error) {
        console.error('Error in connect handler:', error);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);

      // Try to reconnect once if we haven't reached max attempts
      if (connectionAttempts < maxConnectionAttempts) {
        console.log('Attempting to reconnect after disconnect');
        setTimeout(initializeSocket, 5000); // Wait 5 seconds before retry
      }
    };

    // Set up presence update handler
    const handlePresenceUpdate = (data: any) => {
      try {
        // Update user and profile statuses when we receive updates
        if (data.userId) {
          setUserStatuses(prev => ({
            ...prev,
            [data.userId]: data.status
          }));
        }

        if (data.profileId) {
          setProfileStatuses(prev => ({
            ...prev,
            [data.profileId]: data.status
          }));
        }
      } catch (error) {
        console.error('Error in presence update handler:', error);
      }
    };

    // Register event handlers
    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.on('presence:update', handlePresenceUpdate);

    // If already connected, trigger connect handler
    if (socketService.isConnected()) {
      handleConnect();
    }

    // Clean up on unmount
    return () => {
      try {
        socketService.offConnect(handleConnect);
        socketService.offDisconnect(handleDisconnect);
        socketService.off('presence:update', handlePresenceUpdate);
      } catch (error) {
        console.error('Error cleaning up socket handlers:', error);
      }
    };
  }, [isAuthenticated, user?.id, profileId, accessToken, updateStatus]);

  // Handle browser online/offline events
  useEffect(() => {
    // Store auth data in variables to avoid hook calls in event handlers
    const currentUser = user;
    const currentProfileId = profileId;
    const currentAccessToken = accessToken;

    const handleOnline = () => {
      if (socketService.isConnected()) {
        updateStatus('online');
      } else if (currentUser?.id && currentProfileId && currentAccessToken) {
        // Reconnect if needed using stored values
        socketService.connect(currentAccessToken, currentUser.id, currentProfileId);
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (socketService.isConnected()) {
          updateStatus('online');
        } else if (currentUser?.id && currentProfileId && currentAccessToken) {
          // Reconnect if needed using stored values
          socketService.connect(currentAccessToken, currentUser.id, currentProfileId);
        }
      } else if (document.visibilityState === 'hidden') {
        if (socketService.isConnected()) {
          updateStatus('away');
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, profileId, accessToken, updateStatus]);

  // Send heartbeat every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      socketService.emit('presence:heartbeat', {});
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [isConnected]);



  // Get user status from API
  const getUserStatus = useCallback(async (userId: string): Promise<PresenceStatus> => {
    try {
      // If we're not connected, don't try to fetch from API
      if (!isConnected) {
        return userStatuses[userId] || 'offline';
      }

      // If we already have the status in state, return it
      if (userStatuses[userId]) {
        return userStatuses[userId];
      }

      // Otherwise fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      try {
        const response = await fetch(`${API_URL}/api/presence/status/${userId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch user status');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Update state
          setUserStatuses(prev => ({
            ...prev,
            [userId]: data.data.status
          }));

          return data.data.status;
        }
      } catch (fetchError) {
        // Handle timeout or network errors
        console.error('Fetch error for user status:', fetchError);
        // Fall through to return offline
      }

      return 'offline';
    } catch (error) {
      console.error('Error fetching user status:', error);
      return 'offline';
    }
  }, [accessToken, userStatuses, isConnected]);

  // Get profile status from API
  const getProfileStatus = useCallback(async (profileId: string): Promise<PresenceStatus> => {
    try {
      // If we're not connected, don't try to fetch from API
      if (!isConnected) {
        return profileStatuses[profileId] || 'offline';
      }

      // If we already have the status in state, return it
      if (profileStatuses[profileId]) {
        return profileStatuses[profileId];
      }

      // Otherwise fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      try {
        const response = await fetch(`${API_URL}/api/presence/profile/${profileId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch profile status');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Update state
          setProfileStatuses(prev => ({
            ...prev,
            [profileId]: data.data.status
          }));

          return data.data.status;
        }
      } catch (fetchError) {
        // Handle timeout or network errors
        console.error('Fetch error for profile status:', fetchError);
        // Fall through to return offline
      }

      return 'offline';
    } catch (error) {
      console.error('Error fetching profile status:', error);
      return 'offline';
    }
  }, [accessToken, profileStatuses, isConnected]);

  // Subscribe to updates for specific users
  const subscribeToUsers = useCallback((userIds: string[]) => {
    // Add to subscribed users set
    const newSubscribedUsers = new Set(subscribedUsers);
    userIds.forEach(id => newSubscribedUsers.add(id));
    setSubscribedUsers(newSubscribedUsers);

    // Fetch initial statuses
    fetchBatchStatuses([...newSubscribedUsers]);
  }, [subscribedUsers]);

  // Subscribe to updates for specific profiles
  const subscribeToProfiles = useCallback((profileIds: string[]) => {
    // Add to subscribed profiles set
    const newSubscribedProfiles = new Set(subscribedProfiles);
    profileIds.forEach(id => newSubscribedProfiles.add(id));
    setSubscribedProfiles(newSubscribedProfiles);

    // Fetch initial statuses for these profiles
    profileIds.forEach(id => {
      getProfileStatus(id);
    });
  }, [subscribedProfiles, getProfileStatus]);

  // Fetch batch statuses for multiple users
  const fetchBatchStatuses = useCallback(async (userIds: string[]) => {
    if (!userIds.length || !accessToken || !isConnected) return;

    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      try {
        const response = await fetch(`${API_URL}/api/presence/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ userIds }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch batch statuses');
        }

        const data = await response.json();

        if (data.success && data.data && data.data.statuses) {
          // Update user statuses
          setUserStatuses(prev => ({
            ...prev,
            ...data.data.statuses
          }));
        }
      } catch (fetchError) {
        // Handle timeout or network errors
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('Batch status request timed out');
        } else {
          console.error('Error fetching batch statuses:', fetchError);
        }
        // Don't update state on error
      }
    } catch (error) {
      console.error('Error in batch status fetch:', error);
    }
  }, [accessToken, isConnected]);

  // Helper function to determine device type
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // Context value
  const value = {
    status,
    setStatus: updateStatus,
    isConnected,
    getUserStatus,
    getProfileStatus,
    userStatuses,
    profileStatuses,
    subscribeToUsers,
    subscribeToProfiles
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
