'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api/profile-api';
import { userApi } from '@/lib/api/user-api';
import { socialAuthApi } from '@/lib/api/social-auth-api';
// Removed unused import: import { myPtsApi } from '@/lib/api/mypts-api';
import { Coins, Check } from 'lucide-react';
import { AnimatedButton } from '../ui/animated-button';
import { motion, AnimatePresence } from 'framer-motion';

// Interface for profile data
interface ProfileData {
  id: string;
  name: string;
  description?: string;
  profileType?: string;
  accessToken?: string;
  balance?: number;
  formattedBalance?: string;
  isLoadingBalance?: boolean;
}

export function ProfileSelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      console.log('===== PROFILE SELECTOR =====');
      console.log('Session:', JSON.stringify(session, null, 2));

      // Check for access token and user data in localStorage (for social auth)
      const accessTokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      let userDataFromStorage = null;

      try {
        if (userDataString) {
          userDataFromStorage = JSON.parse(userDataString);
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }

      console.log('Access token in localStorage:', accessTokenFromStorage ? 'Present' : 'Not found');
      console.log('User data in localStorage:', userDataFromStorage ? 'Present' : 'Not found');

      // If we have an access token in localStorage, set it in the API clients
      if (accessTokenFromStorage) {
        console.log('Setting access token from localStorage in API clients');
        profileApi.setToken(accessTokenFromStorage);
        userApi.setToken(accessTokenFromStorage);
      }

      // For social auth, we might not have a session but we have data in localStorage
      if (!session?.user?.id && !userDataFromStorage) {
        console.log('Missing user ID in session and no user data in localStorage');

        // Try to fetch user data from the API if we have an access token
        if (accessTokenFromStorage) {
          console.log('Attempting to fetch user data with access token');
          try {
            const userResponse = await socialAuthApi.getCurrentUser();
            if (userResponse.success && userResponse.user) {
              console.log('Successfully fetched user data from API:', userResponse.user);

              // Store the user data in localStorage
              localStorage.setItem('user', JSON.stringify(userResponse.user));

              // Update userDataFromStorage with the fetched data
              userDataFromStorage = userResponse.user;
            } else {
              console.error('Failed to fetch user data from API:', userResponse);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error fetching user data from API:', error);
            setLoading(false);
            return;
          }
        } else {
          setLoading(false);
          return;
        }
      }

      // Use user ID from session or localStorage
      const userId = session?.user?.id || userDataFromStorage?.id;
      console.log('Using user ID:', userId);

      // Even if accessToken is empty, we'll proceed because the backend might be using cookies
      console.log('Access token in session:', session?.accessToken || 'Using cookie or localStorage authentication');

      console.log('Access token present:', !!(session?.accessToken || accessTokenFromStorage));

      // If we're using social auth, try to get profiles directly from the user data in localStorage
      if (!session?.user?.id && userDataFromStorage && userDataFromStorage.profiles && userDataFromStorage.profiles.length > 0) {
        console.log('Found profiles in localStorage user data:', userDataFromStorage.profiles);

        try {
          // Map the profiles to the expected format
          const mappedProfiles = userDataFromStorage.profiles.map((profileId: string) => {
            // Create a basic profile object with the ID
            // We'll need to fetch the full profile details later
            return {
              id: profileId,
              name: `Profile ${profileId.substring(0, 6)}...`,
              description: 'Loading profile details...',
              profileType: 'personal',
              accessToken: accessTokenFromStorage || ''
            };
          });

          setProfiles(mappedProfiles);

          // If user only has one profile, select it automatically
          if (mappedProfiles.length === 1) {
            setSelectedProfileId(mappedProfiles[0].id);
            console.log('Auto-selecting the only profile from localStorage:', mappedProfiles[0].id);
          }

          // Try to fetch full profile details for each profile
          mappedProfiles.forEach(async (profile: { id: string; }) => {
            try {
              const profileDetails = await profileApi.getProfileDetails(profile.id);
              console.log(`Profile details for ${profile.id}:`, profileDetails);

              if (profileDetails.success && profileDetails.data) {
                // Update the profile in the list with the full details
                setProfiles(prevProfiles =>
                  prevProfiles.map(p =>
                    p.id === profile.id
                      ? {
                        ...p,
                        name: profileDetails.data.name || p.name,
                        description: profileDetails.data.description || p.description,
                        profileType: profileDetails.data.profileType || profileDetails.data.type || p.profileType
                      }
                      : p
                  )
                );
              }
            } catch (e) {
              console.error(`Error fetching details for profile ${profile.id}:`, e);
            }
          });
        } catch (e) {
          console.error('Error processing profiles from localStorage:', e);
        }
      }

      try {
        // Get the full user details including profiles
        const userResponse = await userApi.getCurrentUser();
        console.log('User API response:', JSON.stringify(userResponse, null, 2));

        // If we successfully got the user details and it has profiles, use those
        if (userResponse.success && userResponse.data && userResponse.data.profiles && userResponse.data.profiles.length > 0) {
          console.log('User has profiles from user API:', userResponse.data.profiles);

          // Map the profiles to the expected format
          const mappedProfiles = userResponse.data.profiles.map((profile: any) => {
            console.log('Processing profile from user API:', JSON.stringify(profile, null, 2));

            // Extract balance information if available
            const balanceData = profile.balance || {};
            console.log('Balance data:', JSON.stringify(balanceData, null, 2));

            return {
              id: profile._id,
              name: profile.name,
              description: profile.description || '',
              // Handle different ways the type might be returned
              profileType: profile.type?.subtype ||
                (typeof profile.type === 'string' ? profile.type :
                  profile.profileType || 'unknown'),
              accessToken: profile.accessToken || '',
              // Include balance information directly from the profile data
              balance: balanceData.balance || 0,
              formattedBalance: balanceData.balance ?
                `${balanceData.balance.toLocaleString()} MyPts` :
                '0 MyPts',
              isLoadingBalance: false
            };
          });

          setProfiles(mappedProfiles);

          // If user only has one profile, select it automatically
          if (mappedProfiles.length === 1) {
            setSelectedProfileId(mappedProfiles[0].id);
            console.log('Auto-selecting the only profile:', mappedProfiles[0].id);
          } else {
            console.log('Multiple profiles found, letting user choose');
            // Clear any stored profile ID to ensure the user can select a profile
            if (typeof window !== 'undefined') {
              localStorage.removeItem('selectedProfileId');
              localStorage.removeItem('selectedProfileToken');
            }
          }

          // If user already has a profile selected in the session, select it
          if (session?.profileId) {
            setSelectedProfileId(session.profileId);
          }

          setLoading(false);
          return;
        }

        // If we couldn't get profiles from the user API, try the profile API as a fallback
        console.log('Trying to get profiles from profile API...');
        const response = await profileApi.getUserProfiles();
        console.log('Profile API response:', response);

        if (!response.success || !response.data) {
          // If we get an authentication error, we might need to redirect to login
          if (response.message?.includes('authentication') ||
            response.message?.includes('token') ||
            response.message?.includes('Unauthorized')) {
            console.error('Authentication error:', response.message);
            toast.error('Your session has expired. Please log in again.');
            // Wait a moment before redirecting
            setTimeout(() => {
              router.push('/login');
            }, 2000);
            return;
          }

          throw new Error(response.message || 'Failed to load profiles');
        }

        console.log('Raw profile data:', response.data);

        // Extract profiles from the response
        // The API returns profiles grouped by category
        let allProfiles: ProfileData[] = [];

        // If profiles is an object with categories
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Flatten the profiles from all categories
          Object.entries(response.data).forEach(([category, categoryProfiles]: [string, any]) => {
            console.log(`Processing category: ${category} with ${Array.isArray(categoryProfiles) ? categoryProfiles.length : 0} profiles`);

            if (Array.isArray(categoryProfiles)) {
              const mappedProfiles = categoryProfiles.map((profile: any) => {
                console.log('Processing profile:', profile);
                // Extract balance information if available
                const balanceData = profile.balance || {};

                return {
                  id: profile._id,
                  name: profile.name,
                  description: profile.description || '',
                  // Handle different ways the type might be returned
                  profileType: profile.type?.subtype ||
                    (typeof profile.type === 'string' ? profile.type :
                      profile.profileType || 'unknown'),
                  accessToken: profile.accessToken || '',
                  // Include balance information directly from the profile data
                  balance: balanceData.balance || 0,
                  formattedBalance: balanceData.balance ?
                    `${balanceData.balance.toLocaleString()} MyPts` :
                    '0 MyPts',
                  isLoadingBalance: false
                };
              });
              allProfiles = [...allProfiles, ...mappedProfiles];
            }
          });
        }
        // If profiles is already an array
        else if (Array.isArray(response.data)) {
          console.log(`Processing array of ${response.data.length} profiles`);
          allProfiles = response.data.map((profile: any) => {
            console.log('Processing profile from array:', JSON.stringify(profile, null, 2));

            // Extract balance information if available
            const balanceData = profile.balance || {};
            console.log('Balance data from array profile:', JSON.stringify(balanceData, null, 2));

            return {
              id: profile._id,
              name: profile.name,
              description: profile.description || '',
              // Handle different ways the type might be returned
              profileType: profile.type?.subtype ||
                (typeof profile.type === 'string' ? profile.type :
                  profile.profileType || 'unknown'),
              accessToken: profile.accessToken || '',
              // Include balance information directly from the profile data
              balance: balanceData.balance || 0,
              formattedBalance: balanceData.balance ?
                `${balanceData.balance.toLocaleString()} MyPts` :
                '0 MyPts',
              isLoadingBalance: false
            };
          });
        }

        setProfiles(allProfiles);

        // If user only has one profile, select it automatically
        if (allProfiles.length === 1) {
          setSelectedProfileId(allProfiles[0].id);
          console.log('Auto-selecting the only profile:', allProfiles[0].id);
        } else {
          console.log('Multiple profiles found, letting user choose');
          // Clear any stored profile ID to ensure the user can select a profile
          if (typeof window !== 'undefined') {
            localStorage.removeItem('selectedProfileId');
            localStorage.removeItem('selectedProfileToken');
          }
        }

        // If user already has a profile selected in the session, select it
        if (session?.profileId) {
          setSelectedProfileId(session.profileId);
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
        toast.error('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [session]);

  // Removed fetchAllProfileBalances function as we're getting balance data directly from the profile

  // No need to fetch balances separately as they're included in the profile data
  // This comment is kept to explain why we removed the balance fetching code

  const handleSelectProfile = async (profileId: string) => {
    try {
      console.log('Selecting profile:', { profileId });

      // Find the selected profile to get its name and type
      const selectedProfile = profiles.find(p => p.id === profileId);

      // Reset redirect attempts counter
      localStorage.setItem('redirectAttempts', '0');

      // Store the profile ID in localStorage
      localStorage.setItem('selectedProfileId', profileId);

      // Also store the profile name and type for display purposes
      if (selectedProfile) {
        localStorage.setItem('selectedProfileName', selectedProfile.name);
        localStorage.setItem('selectedProfileType', selectedProfile.profileType || '');
      }

      // Get the access token from localStorage or session
      let accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        try {
          const response = await fetch('/api/auth/session');
          const session = await response.json();
          console.log('Session during profile selection:', session);

          // Store the access token in localStorage
          if (session?.accessToken) {
            accessToken = session.accessToken;
            localStorage.setItem('accessToken', accessToken);
            console.log('Access token stored in localStorage');
          }
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
        }
      }

      // Request a profile-specific token from the backend
      try {
        console.log('Requesting profile token for profile:', profileId);
        const profileTokenResponse = await fetch(`/api/profiles/${profileId}/token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileTokenResponse.ok) {
          const tokenData = await profileTokenResponse.json();
          if (tokenData.success && tokenData.profileToken) {
            console.log('Received profile token from backend');
            localStorage.setItem('selectedProfileToken', tokenData.profileToken);
          } else {
            console.warn('Profile token response did not contain a valid token:', tokenData);
            // Fallback: Use the profile's accessToken if available
            if (selectedProfile?.accessToken) {
              localStorage.setItem('selectedProfileToken', selectedProfile.accessToken);
            }
          }
        } else {
          console.warn('Failed to get profile token from backend, status:', profileTokenResponse.status);
          // Fallback: Use the profile's accessToken if available
          if (selectedProfile?.accessToken) {
            localStorage.setItem('selectedProfileToken', selectedProfile.accessToken);
          }
        }
      } catch (tokenError) {
        console.error('Error requesting profile token:', tokenError);
        // Fallback: Use the profile's accessToken if available
        if (selectedProfile?.accessToken) {
          localStorage.setItem('selectedProfileToken', selectedProfile.accessToken);
        }
      }

      // Set cookies for the backend
      try {
        const profileToken = localStorage.getItem('selectedProfileToken') || '';
        // Call our API endpoint to set cookies
        const cookieResponse = await fetch('/api/profile/set-cookies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profileId, profileToken }),
          credentials: 'include',
        });

        if (!cookieResponse.ok) {
          throw new Error('Failed to set profile cookies');
        }

        console.log('Profile cookies set successfully');
      } catch (cookieError) {
        console.error('Error setting profile cookies:', cookieError);
        // Continue anyway, as localStorage might be enough
      }

      toast.success('Profile selected');

      // Add a small delay before redirecting to ensure localStorage is updated
      setTimeout(() => {
        // Double-check that the profile ID was actually stored
        const storedProfileId = localStorage.getItem('selectedProfileId');
        console.log('Verifying profile ID before redirect:', {
          storedProfileId,
          expectedProfileId: profileId,
          isStored: storedProfileId === profileId
        });

        if (!storedProfileId || storedProfileId !== profileId) {
          console.warn('Profile ID not properly stored, trying again...');
          // Try storing it again
          localStorage.setItem('selectedProfileId', profileId);

          // Wait a bit longer before redirecting
          setTimeout(() => {
            console.log('Second attempt to store profile ID, redirecting now');
            // Redirect to dashboard with a hard navigation to ensure a clean state
            window.location.href = '/dashboard';
          }, 500);
        } else {
          console.log('Profile ID successfully stored, redirecting to dashboard');
          // Redirect to dashboard with a hard navigation to ensure a clean state
          window.location.href = '/dashboard';
        }
      }, 500);
    } catch (error) {
      console.error('Error selecting profile:', error);
      toast.error('Failed to select profile');
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Select a Profile</CardTitle>
            <CardDescription>Choose a profile to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="flex items-center space-x-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Profiles Found</CardTitle>
            <CardDescription>You don't have any profiles yet</CardDescription>
          </CardHeader>
          <CardFooter>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button onClick={() => router.push('/create-profile')} className="w-full">
                Create a Profile
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Select a Profile</CardTitle>
          <CardDescription>Choose a profile to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                borderColor: selectedProfileId === profile.id
                  ? ["#000", "#3B82F6", "#000"]
                  : "#e5e7eb",
                borderWidth: selectedProfileId === profile.id ? "1px" : "1px",
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
                borderColor: {
                  duration: 2,
                  repeat: selectedProfileId === profile.id ? Infinity : 0,
                  ease: "easeInOut"
                }
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Add a small animation effect when selecting a profile
                if (selectedProfileId !== profile.id) {
                  setSelectedProfileId(profile.id);
                }
              }}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedProfileId === profile.id
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{profile.description}</p>

                  {/* Balance display */}
                  <div className="mt-2 flex items-center">
                    <img src="/mdi_coins-outline.svg" className='h-4 w-4 mr-1' />
                    {profile.isLoadingBalance ? (
                      <span className="text-xs text-muted-foreground animate-pulse">Loading balance...</span>
                    ) : (profile.balance !== undefined && profile.formattedBalance) ? (
                      <span className="text-sm font-medium">{profile.formattedBalance}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {typeof profile.balance === 'number' ? `${profile.balance.toLocaleString()} MyPts` : 'Balance unavailable'}
                      </span>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {selectedProfileId === profile.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                      className="flex items-center justify-center"
                    >
                      <motion.div
                        className="h-8 w-8 rounded-full bg-primary flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(0, 0, 0, 0)",
                            "0 0 0 4px rgba(0, 0, 0, 0.1)",
                            "0 0 0 0 rgba(0, 0, 0, 0)"
                          ]
                        }}
                        transition={{
                          boxShadow: {
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <motion.div
            whileHover={selectedProfileId ? { scale: 1.02 } : {}}
            whileTap={selectedProfileId ? { scale: 0.98 } : {}}
            className="w-full"
            animate={{
              y: [0, selectedProfileId ? -5 : 0, 0],
              transition: {
                duration: 0.5,
                repeat: selectedProfileId ? Infinity : 0,
                repeatType: "reverse",
                ease: "easeInOut",
                repeatDelay: 2
              }
            }}
          >
            <AnimatedButton
              onClick={() => {
                const selectedProfile = profiles.find(p => p.id === selectedProfileId);
                if (selectedProfile) {
                  handleSelectProfile(selectedProfile.id);
                } else {
                  toast.error('Please select a profile');
                }
              }}
              disabled={!selectedProfileId}
              type="button"
              className="h-12 w-full bg-black"
              style={{
                backgroundColor: selectedProfileId ? 'black' : 'white',
                color: selectedProfileId ? 'white' : 'black',
                borderColor: 'black',
                borderWidth: '1px'
              }}
            >
              Continue
            </AnimatedButton>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
