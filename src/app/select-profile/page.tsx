'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProfileSelector } from '@/components/profile/profile-selector';
import { ApiDebug } from '@/components/debug/api-debug';
import { DirectApiTest } from '@/components/debug/direct-api-test';

export default function SelectProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check for social auth tokens in localStorage
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let userData = null;

    try {
      if (userDataString) {
        userData = JSON.parse(userDataString);
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
    }

    console.log('Select profile page - social auth check:', {
      hasAccessToken: !!accessToken,
      hasUserData: !!userData,
      userData: userData ? { id: userData.id, email: userData.email } : null
    });

    // If not authenticated via NextAuth and no social auth tokens, redirect to login
    if (status === 'unauthenticated' && !accessToken) {
      console.log('Not authenticated and no social auth tokens, redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user is admin
    const isAdmin = session?.user?.role === 'admin' ||
                   session?.user?.isAdmin === true ||
                   (typeof window !== 'undefined' && localStorage?.getItem('isAdmin') === 'true') ||
                   userData?.role === 'admin';

    console.log('Select profile page - isAdmin check:', isAdmin);

    // If user is admin, redirect to admin dashboard
    if (isAdmin) {
      console.log('Admin user detected - redirecting to admin dashboard');
      router.push('/admin');
      return;
    }

    // Check if we already have a profile ID in localStorage
    const storedProfileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;
    console.log('Select profile page - stored profile ID check:', { hasStoredProfileId: !!storedProfileId, profileId: storedProfileId });

    // If we have a profile ID in localStorage, redirect to dashboard
    if (storedProfileId) {
      console.log('Profile ID found in localStorage, redirecting to dashboard');
      // Reset redirect attempts counter
      localStorage.setItem('redirectAttempts', '0');
      router.push('/dashboard');
      return;
    }

    // If authenticated and already has a profile selected in the session, check if we should redirect
    if (status === 'authenticated') {
      // Check if the user has multiple profiles
      const hasMultipleProfiles = (session?.user as any)?.hasMultipleProfiles;
      console.log('Select profile page - hasMultipleProfiles check:', hasMultipleProfiles);

      // If the user has a profile ID in the session and doesn't have multiple profiles, redirect to dashboard
      if (session?.profileId && session?.profileToken && !hasMultipleProfiles) {
        console.log('Profile found in session and user has only one profile, redirecting to dashboard');
        // Store the profile ID from session in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedProfileId', session.profileId);
          localStorage.setItem('selectedProfileToken', session.profileToken);
          localStorage.setItem('redirectAttempts', '0');
        }
        router.push('/dashboard');
      } else if (hasMultipleProfiles) {
        console.log('User has multiple profiles, staying on profile selection page');
        // Clear any stored profile ID to ensure the user can select a profile
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedProfileId');
          localStorage.removeItem('selectedProfileToken');
        }
      }
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check for social auth tokens
  const isSocialAuthenticated = typeof window !== 'undefined' &&
                               localStorage.getItem('accessToken') !== null &&
                               localStorage.getItem('user') !== null;

  console.log('Select profile page - authentication check:', {
    nextAuthStatus: status,
    isSocialAuthenticated
  });

  // If authenticated via NextAuth or social auth, show profile selector
  if (status === 'authenticated' || isSocialAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Select a Profile</h1>
          <ProfileSelector />
          <div className="mt-8">
            <ApiDebug />
          </div>
        </div>
      </div>
    );
  }

  // This should not be visible due to the redirect in useEffect
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Checking authentication status...</p>
      </div>
    </div>
  );
}
