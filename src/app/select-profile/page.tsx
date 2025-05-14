'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NewProfileSelector } from '@/components/profile/new-profile-selector';
// import { ApiDebug } from '@/components/debug/api-debug';
import { DirectApiTest } from '@/components/debug/direct-api-test';

export default function SelectProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Helper function to get cookie value
    const getCookieValue = (name: string) => {
      if (typeof document === 'undefined') return null;
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    // Check for tokens in all possible locations
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const nextAuthToken = typeof window !== 'undefined' ? localStorage.getItem('next-auth.session-token') : null;
    const accessTokenFromCookie = getCookieValue('accessToken') || getCookieValue('accesstoken');
    const nextAuthSessionToken = getCookieValue('__Secure-next-auth.session-token') || getCookieValue('next-auth.session-token');

    // Check for user data
    const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let userData = null;

    try {
      if (userDataString) {
        userData = JSON.parse(userDataString);
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
    }

    // Check if we have any valid token
    const hasAnyToken = !!accessToken || !!nextAuthToken || !!accessTokenFromCookie || !!nextAuthSessionToken;

    console.log('Select profile page - auth check:', {
      nextAuthStatus: status,
      hasAccessToken: !!accessToken,
      hasNextAuthToken: !!nextAuthToken,
      hasAccessTokenCookie: !!accessTokenFromCookie,
      hasNextAuthSessionToken: !!nextAuthSessionToken,
      hasAnyToken,
      hasUserData: !!userData,
      userData: userData ? { id: userData.id, email: userData.email } : null
    });

    // If not authenticated via NextAuth and no tokens anywhere, redirect to login
    if (status === 'unauthenticated' && !hasAnyToken) {
      console.log('Not authenticated and no tokens found, redirecting to login');
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
        document.cookie.includes('X-User-Is-Admin=true') ||
        document.cookie.includes('isAdmin=true') ||
        document.cookie.includes('userRole=admin');
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

    // If user is admin, redirect to admin dashboard IMMEDIATELY
    if (isAdmin) {
      console.log('Admin user detected - redirecting to admin dashboard IMMEDIATELY');
      // Store admin status in localStorage for persistence
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('userRole', 'admin');

      // Set cookies for admin status (for middleware detection)
      document.cookie = 'isAdmin=true; path=/; max-age=2592000; SameSite=Lax';
      document.cookie = 'X-User-Role=admin; path=/; max-age=2592000; SameSite=Lax';
      document.cookie = 'X-User-Is-Admin=true; path=/; max-age=2592000; SameSite=Lax';

      // Use hard redirect instead of router.push for immediate effect
      window.location.href = '/admin';
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

  // If authenticated via NextAuth, social auth, or has access token in localStorage, show profile selector
  if (status === 'authenticated' || isSocialAuthenticated || accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Select a Profile</h1>
          <NewProfileSelector />
          {/* <div className="mt-8">
            <ApiDebug />
          </div> */}
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
