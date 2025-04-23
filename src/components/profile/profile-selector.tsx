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

// Interface for profile data
interface ProfileData {
  id: string;
  name: string;
  description?: string;
  profileType?: string;
  accessToken?: string;
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

      if (!session?.user?.id) {
        console.log('Missing user ID in session');
        setLoading(false);
        return;
      }

      // Even if accessToken is empty, we'll proceed because the backend might be using cookies
      console.log('Access token in session:', session.accessToken || 'Using cookie authentication');

      console.log('User ID:', session.user.id);
      console.log('Access token present:', !!session.accessToken);

      try {
        // Get the full user details including profiles
        const userResponse = await userApi.getCurrentUser();
        console.log('User API response:', JSON.stringify(userResponse, null, 2));

        // If we successfully got the user details and it has profiles, use those
        if (userResponse.success && userResponse.data && userResponse.data.profiles && userResponse.data.profiles.length > 0) {
          console.log('User has profiles from user API:', userResponse.data.profiles);

          // Map the profiles to the expected format
          const mappedProfiles = userResponse.data.profiles.map((profile: any) => {
            console.log('Processing profile:', profile);
            return {
              id: profile._id,
              name: profile.name,
              description: profile.description || '',
              // Handle different ways the type might be returned
              profileType: profile.type?.subtype ||
                          (typeof profile.type === 'string' ? profile.type :
                           profile.profileType || 'unknown'),
              accessToken: profile.accessToken || ''
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
          if (session.profileId) {
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
                return {
                  id: profile._id,
                  name: profile.name,
                  description: profile.description || '',
                  // Handle different ways the type might be returned
                  profileType: profile.type?.subtype ||
                              (typeof profile.type === 'string' ? profile.type :
                               profile.profileType || 'unknown'),
                  accessToken: profile.accessToken || ''
                };
              });
              allProfiles = [...allProfiles, ...mappedProfiles];
            }
          });
        }
        // If profiles is already an array
        else if (Array.isArray(response.data)) {
          console.log(`Processing array of ${response.data.length} profiles`);
          allProfiles = response.data.map((profile: any) => ({
            id: profile._id,
            name: profile.name,
            description: profile.description || '',
            // Handle different ways the type might be returned
            profileType: profile.type?.subtype ||
                        (typeof profile.type === 'string' ? profile.type :
                         profile.profileType || 'unknown'),
            accessToken: profile.accessToken || ''
          }));
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
        if (session.profileId) {
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

  const handleSelectProfile = async (profileId: string, profileToken: string) => {
    try {
      console.log('Selecting profile:', { profileId, profileToken });

      // Find the selected profile to get its name and type
      const selectedProfile = profiles.find(p => p.id === profileId);

      // Reset redirect attempts counter
      localStorage.setItem('redirectAttempts', '0');

      // Store the profile information in localStorage
      console.log('Storing profile information in localStorage:', { profileId, profileToken: profileToken ? '[TOKEN]' : 'none' });
      localStorage.setItem('selectedProfileId', profileId);
      localStorage.setItem('selectedProfileToken', profileToken || '');

      // Also store the profile name and type for display purposes
      if (selectedProfile) {
        localStorage.setItem('selectedProfileName', selectedProfile.name);
        localStorage.setItem('selectedProfileType', selectedProfile.profileType || '');
      }

      // Set cookies for the backend
      try {
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

      // Get the session to extract the access token if not already stored
      if (!localStorage.getItem('accessToken')) {
        try {
          const response = await fetch('/api/auth/session');
          const session = await response.json();
          console.log('Session during profile selection:', session);

          // Store the access token in localStorage
          if (session?.accessToken) {
            localStorage.setItem('accessToken', session.accessToken);
            console.log('Access token stored in localStorage');
          }
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
        }
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
          localStorage.setItem('selectedProfileToken', profileToken || '');

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
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Select a Profile</CardTitle>
          <CardDescription>Choose a profile to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>No Profiles Found</CardTitle>
          <CardDescription>You don't have any profiles yet</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/create-profile')} className="w-full">
            Create a Profile
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select a Profile</CardTitle>
        <CardDescription>Choose a profile to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedProfileId === profile.id
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
            onClick={() => setSelectedProfileId(profile.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{profile.description}</p>
              </div>
              {selectedProfileId === profile.id && (
                <div className="h-3 w-3 rounded-full bg-primary"></div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => router.push('/create-profile')}
        >
          Create New Profile
        </Button>
        <Button
          onClick={() => {
            const selectedProfile = profiles.find(p => p.id === selectedProfileId);
            if (selectedProfile) {
              handleSelectProfile(selectedProfile.id, selectedProfile.accessToken);
            } else {
              toast.error('Please select a profile');
            }
          }}
          disabled={!selectedProfileId}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
