'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { adaptProfile, adaptProfiles, cacheProfile, cacheProfiles, getCachedProfile } from '@/lib/adapters/profile-adapter';
import { profileApi } from '@/lib/api/profile-api';
import { toast } from 'sonner';

interface ProfileContextType {
  profiles: any[];
  loading: boolean;
  error: string | null;
  addProfiles: (newProfiles: any[]) => void;
  getProfile: (id: string) => any;
  fetchProfiles: (options?: any) => Promise<any[]>;
  fetchProfileById: (id: string) => Promise<any>;
  clearProfiles: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profiles: [],
  loading: false,
  error: null,
  addProfiles: () => { },
  getProfile: () => null,
  fetchProfiles: async () => [],
  fetchProfileById: async () => null,
  clearProfiles: () => { },
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add profiles to the state and cache
   */
  const addProfiles = useCallback((newProfiles: any[]) => {
    // Adapt all profiles to the consistent format
    const adaptedProfiles = adaptProfiles(newProfiles);

    // Cache the profiles
    cacheProfiles(adaptedProfiles);

    // Update state
    setProfiles(prev => {
      // Create a map of existing profiles by ID
      const existingProfilesMap = new Map(prev.map(p => [p._id, p]));

      // Add or update profiles
      adaptedProfiles.forEach(profile => {
        existingProfilesMap.set(profile._id, profile);
      });

      // Convert map back to array
      return Array.from(existingProfilesMap.values());
    });
  }, []);

  /**
   * Get a profile by ID from state or cache
   */
  const getProfile = useCallback((id: string) => {
    // First check in state
    const profileFromState = profiles.find(p => p._id === id || p.id === id);
    if (profileFromState) return profileFromState;

    // Then check in cache
    const profileFromCache = getCachedProfile(id);
    if (profileFromCache) {
      // Add to state if found in cache
      addProfiles([profileFromCache]);
      return profileFromCache;
    }

    return null;
  }, [profiles, addProfiles]);

  /**
   * Fetch profiles from the API
   */
  const fetchProfiles = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching profiles with options:', options);

      const response = await profileApi.getAllProfiles(options);

      if (response.success && response.data?.profiles) {
        const adaptedProfiles = adaptProfiles(response.data.profiles);
        addProfiles(adaptedProfiles);
        return adaptedProfiles;
      } else if (response.success && (response as any).profiles) {
        // Handle case where profiles are directly in the response
        const adaptedProfiles = adaptProfiles((response as any).profiles);
        addProfiles(adaptedProfiles);
        return adaptedProfiles;
      } else {
        const errorMessage = response.message || 'Failed to fetch profiles';
        setError(errorMessage);
        console.error('Error fetching profiles:', errorMessage);
        toast.error('Error loading profiles', {
          description: errorMessage,
        });
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching profiles:', error);
      toast.error('Error loading profiles', {
        description: errorMessage,
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [addProfiles]);

  /**
   * Fetch a profile by ID from the API
   */
  const fetchProfileById = useCallback(async (id: string) => {
    // First check if we already have this profile
    const existingProfile = getProfile(id);
    if (existingProfile) return existingProfile;

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching profile with ID: ${id}`);

      const response = await profileApi.getProfileByIdAdmin(id);

      if (response.success && response.data) {
        // Check if we have a balance property but no myPtsBalance
        if (response.data.balance !== undefined && response.data.myPtsBalance === undefined) {
          console.log(`Setting myPtsBalance from balance: ${response.data.balance}`);
          response.data.myPtsBalance = response.data.balance;
        }

        // Ensure ProfileMypts is an object, not a string
        if (typeof response.data.ProfileMypts === 'string' || response.data.ProfileMypts === undefined) {
          console.log('Creating ProfileMypts object from balance');
          response.data.ProfileMypts = {
            currentBalance: response.data.balance || response.data.myPtsBalance || 0,
            lifetimeMypts: response.data.lifetimeMypts || 0
          };
        }

        // Ensure MyPts data is properly included before adapting
        if (response.data.ProfileMypts && typeof response.data.ProfileMypts === 'object') {
          // Make sure myPtsBalance is set from ProfileMypts if not already set
          if (!response.data.myPtsBalance && response.data.ProfileMypts.currentBalance !== undefined) {
            response.data.myPtsBalance = response.data.ProfileMypts.currentBalance;
            console.log(`Setting myPtsBalance from ProfileMypts: ${response.data.ProfileMypts.currentBalance}`);
          }
        }

        const adaptedProfile = adaptProfile(response.data);
        console.log('Adapted profile MyPts data:', {
          id: adaptedProfile.id,
          myPtsBalance: adaptedProfile.myPtsBalance,
          ProfileMypts: adaptedProfile.ProfileMypts,
          balance: response.data.balance
        });

        addProfiles([adaptedProfile]);
        return adaptedProfile;
      } else if (response.success && (response as any).profile) {
        // Handle case where profile is directly in the response
        const profileData = (response as any).profile;

        // Check if we have a balance property but no myPtsBalance
        if (profileData.balance !== undefined && profileData.myPtsBalance === undefined) {
          console.log(`Setting myPtsBalance from balance: ${profileData.balance}`);
          profileData.myPtsBalance = profileData.balance;
        }

        // Ensure ProfileMypts is an object, not a string
        if (typeof profileData.ProfileMypts === 'string' || profileData.ProfileMypts === undefined) {
          console.log('Creating ProfileMypts object from balance');
          profileData.ProfileMypts = {
            currentBalance: profileData.balance || profileData.myPtsBalance || 0,
            lifetimeMypts: profileData.lifetimeMypts || 0
          };
        }

        // Ensure MyPts data is properly included before adapting
        if (profileData.ProfileMypts && typeof profileData.ProfileMypts === 'object') {
          // Make sure myPtsBalance is set from ProfileMypts if not already set
          if (!profileData.myPtsBalance && profileData.ProfileMypts.currentBalance !== undefined) {
            profileData.myPtsBalance = profileData.ProfileMypts.currentBalance;
            console.log(`Setting myPtsBalance from ProfileMypts: ${profileData.ProfileMypts.currentBalance}`);
          }
        }

        const adaptedProfile = adaptProfile(profileData);
        console.log('Adapted profile MyPts data:', {
          id: adaptedProfile.id,
          myPtsBalance: adaptedProfile.myPtsBalance,
          ProfileMypts: adaptedProfile.ProfileMypts,
          balance: profileData.balance
        });

        addProfiles([adaptedProfile]);
        return adaptedProfile;
      } else {
        const errorMessage = response.message || `Failed to fetch profile with ID: ${id}`;
        setError(errorMessage);
        console.error('Error fetching profile:', errorMessage);
        toast.error('Error loading profile', {
          description: errorMessage,
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error(`Error fetching profile with ID ${id}:`, error);
      toast.error('Error loading profile', {
        description: errorMessage,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [getProfile, addProfiles]);

  /**
   * Clear all profiles from state
   */
  const clearProfiles = useCallback(() => {
    setProfiles([]);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        loading,
        error,
        addProfiles,
        getProfile,
        fetchProfiles,
        fetchProfileById,
        clearProfiles
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfiles = () => useContext(ProfileContext);
