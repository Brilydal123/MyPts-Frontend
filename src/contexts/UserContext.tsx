'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user-api';
import { toast } from 'sonner';

// Define the user data structure
export interface UserData {
  id?: string;
  _id?: string;
  email?: string;
  fullName?: string;
  username?: string;
  profileImage?: string;
  image?: string;
  role?: string;
  isAdmin?: boolean;
  countryOfResidence?: string;
  country?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  accountType?: string;
  signupType?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  referralCode?: string;
  profiles?: any[];
}

// Define the context type
interface UserContextType {
  user: UserData | null;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => void;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Function to fetch user data
  const fetchUserData = async (): Promise<UserData> => {
    try {
      // Try to get user data from localStorage first
      let userData: UserData | null = null;
      
      if (typeof window !== 'undefined') {
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
            console.log('Found user data in localStorage:', userData);
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }
      }
      
      // If we have user data in localStorage, use it as initial data
      if (userData && userData.email) {
        console.log('Using user data from localStorage');
        
        // Try to fetch fresh data from the API
        try {
          const response = await userApi.getCurrentUser();
          
          if (response.success && response.data) {
            console.log('Successfully fetched user data from API');
            
            // Merge the API data with localStorage data
            const mergedData = { ...userData, ...response.data };
            
            // Update localStorage with the fresh data
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(mergedData));
              
              // Store country information separately for easier access
              if (mergedData.countryOfResidence) {
                localStorage.setItem('userCountry', mergedData.countryOfResidence);
                console.log(`Updated user country in localStorage: ${mergedData.countryOfResidence}`);
                
                // Also store in a cookie for cross-page access
                document.cookie = `userCountry=${encodeURIComponent(mergedData.countryOfResidence)}; path=/; max-age=2592000; SameSite=Lax`;
              }
            }
            
            return mergedData;
          }
        } catch (apiError) {
          console.error('Error fetching user data from API:', apiError);
          // If API call fails, still return the localStorage data
        }
        
        return userData;
      }
      
      // If no data in localStorage or it's incomplete, fetch from API
      console.log('Fetching user data from API');
      const response = await userApi.getCurrentUser();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user data');
      }
      
      // Store the user data in localStorage
      if (typeof window !== 'undefined' && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Store country information separately for easier access
        if (response.data.countryOfResidence) {
          localStorage.setItem('userCountry', response.data.countryOfResidence);
          console.log(`Stored user country in localStorage: ${response.data.countryOfResidence}`);
          
          // Also store in a cookie for cross-page access
          document.cookie = `userCountry=${encodeURIComponent(response.data.countryOfResidence)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      throw error;
    }
  };

  // Use React Query to fetch and cache user data
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Function to refetch user data
  const refetchUser = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refetching user data:', error);
      toast.error('Failed to refresh user data');
    }
  };

  // Function to update user data in the cache
  const updateUserData = (data: Partial<UserData>) => {
    queryClient.setQueryData(['userData'], (oldData: UserData | undefined) => {
      const updatedData = { ...oldData, ...data };
      
      // Update localStorage with the new data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedData));
        
        // Update country information if it's changed
        if (data.countryOfResidence) {
          localStorage.setItem('userCountry', data.countryOfResidence);
          console.log(`Updated user country in localStorage: ${data.countryOfResidence}`);
          
          // Also update the cookie
          document.cookie = `userCountry=${encodeURIComponent(data.countryOfResidence)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
      
      return updatedData;
    });
  };

  // Create the context value
  const contextValue: UserContextType = {
    user: user || null,
    isLoading,
    error: error as Error | null,
    refetchUser,
    updateUserData,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
