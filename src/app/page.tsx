'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Coins } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    // If user is authenticated and has a profile, redirect to dashboard
    if (status === 'authenticated' && session?.profileId) {
      router.push('/dashboard');
    }
    // If user is authenticated but doesn't have a profile, redirect to profile selection
    else if (status === 'authenticated') {
      router.push('/select-profile');
    }
    // If user is not authenticated, redirect to login
    else if (status === 'unauthenticated') {
      router.push('/login');
    }
    // If status is loading, we'll wait
  }, [status, session, router]);

  // Show loading state while checking session
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Coins className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">MyPts Manager</h1>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mt-8"></div>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  );
}
