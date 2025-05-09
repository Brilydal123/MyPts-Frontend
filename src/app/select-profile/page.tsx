'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NewProfileSelector } from '@/components/profile/new-profile-selector';
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

    // Check if user is admin from all possible sources
    const isAdminFromSession = session?.user?.role === 'admin' || session?.user?.isAdmin === true;
    const isAdminFromLocalStorage = typeof window !== 'undefined' && (
      localStorage?.getItem('isAdmin') === 'true' ||
      localStorage?.getItem('userRole') === 'admin'
    );
    const isAdminFromUserData = userData?.role === 'admin' || userData?.isAdmin === true;

    // Check cookies as well
    let isAdminFromCookies = false;
    if (typeof document !== 'undefined') {
      isAdminFromCookies = document.cookie.includes('X-User-Role=admin') ||
        document.cookie.includes('X-User-Is-Admin=true');
    }

    const isAdmin = isAdminFromSession || isAdminFromLocalStorage || isAdminFromUserData || isAdminFromCookies;

    console.log('Select profile page - isAdmin check:', {
      isAdminFromSession,
      isAdminFromLocalStorage,
      isAdminFromUserData,
      isAdminFromCookies,
      isAdmin,
      userData: userData ? { id: userData.id, role: userData.role, isAdmin: userData.isAdmin } : null
    });

    // If user is admin, redirect to admin dashboard
    if (isAdmin) {
      console.log('Admin user detected - redirecting to admin dashboard');
      router.push('/admin');
      return;
    }

    // Always clear any stored profile ID to ensure the user must explicitly select a profile
    if (typeof window !== 'undefined') {
      // Check if we already have a profile ID in localStorage before clearing it (for logging purposes)
      const storedProfileId = localStorage.getItem('selectedProfileId');
      console.log('Select profile page - stored profile ID check:', { hasStoredProfileId: !!storedProfileId, profileId: storedProfileId });

      // Clear profile selection data to force explicit selection
      console.log('Clearing stored profile data to ensure explicit profile selection');
      localStorage.removeItem('selectedProfileId');
      localStorage.removeItem('selectedProfileToken');

      // Also clear any default profile from the user data if it exists
      if (userData && userData.defaultProfile) {
        console.log('Removing defaultProfile from user data to prevent auto-selection');
        delete userData.defaultProfile;
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }

    console.log('Staying on profile selection page to let user explicitly select a profile');
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
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const isSocialAuthenticated = !!accessToken && !!userDataString;

  console.log('Select profile page - authentication check:', {
    nextAuthStatus: status,
    isSocialAuthenticated,
    hasAccessToken: !!accessToken,
    hasUserData: !!userDataString
  });

  // If authenticated via NextAuth or social auth, show profile selector
  if (status === 'authenticated' || isSocialAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Select a Profile</h1>
          <NewProfileSelector />
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
