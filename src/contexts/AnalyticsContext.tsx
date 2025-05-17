'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalyticsApi } from '@/lib/api/analytics-api';
import { useAuth } from './AuthContext';

// Create analytics API instance
const analyticsApi = new AnalyticsApi();

// Define context type
interface AnalyticsContextType {
  isLoading: boolean;
  error: string | null;
  myPtsData: any | null;
  usageData: any | null;
  refreshMyPtsData: (profileId?: string) => Promise<void>;
  refreshUsageData: (profileId?: string) => Promise<void>;
}

// Create context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Provider component
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [myPtsData, setMyPtsData] = useState<any | null>(null);
  const [usageData, setUsageData] = useState<any | null>(null);

  // Get profile ID from user or localStorage
  const getProfileId = (): string | null => {
    if (user?.profileId) {
      return user.profileId;
    }
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedProfileId');
    }
    
    return null;
  };

  // Fetch MyPts data
  const refreshMyPtsData = async (profileId?: string): Promise<void> => {
    const id = profileId || getProfileId();
    
    if (!id) {
      setError('No profile ID available');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await analyticsApi.getMyPtsAnalytics(id);
      
      if (response.success) {
        setMyPtsData(response.data);
      } else {
        setError(response.message || 'Failed to fetch MyPts data');
      }
    } catch (err) {
      console.error('Error fetching MyPts data:', err);
      setError('Error fetching MyPts data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch usage data
  const refreshUsageData = async (profileId?: string): Promise<void> => {
    const id = profileId || getProfileId();
    
    if (!id) {
      setError('No profile ID available');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await analyticsApi.getUsageAnalytics(id);
      
      if (response.success) {
        setUsageData(response.data);
      } else {
        setError(response.message || 'Failed to fetch usage data');
      }
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Error fetching usage data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when profile ID changes
  useEffect(() => {
    const profileId = getProfileId();
    
    if (profileId) {
      refreshMyPtsData(profileId);
      refreshUsageData(profileId);
    }
  }, [user?.profileId]);

  // Context value
  const contextValue: AnalyticsContextType = {
    isLoading,
    error,
    myPtsData,
    usageData,
    refreshMyPtsData,
    refreshUsageData
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Custom hook to use the analytics context
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
}
