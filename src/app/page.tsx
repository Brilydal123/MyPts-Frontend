'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Coins } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    // Check if user is admin (from session or localStorage)
    const isAdmin = 
      session?.user?.role === 'admin' || 
      session?.user?.isAdmin === true || 
      (typeof window !== 'undefined' && localStorage?.getItem('isAdmin') === 'true');
    
    console.log('Home page - Auth check:', { 
      status, 
      isAdmin, 
      hasProfileId: !!session?.profileId 
    });
    
    // If user is admin, redirect directly to admin dashboard
    if (status === 'authenticated' && isAdmin) {
      console.log('Admin user detected - redirecting to admin dashboard');
      // Store admin status in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdmin', 'true');
      }
      router.push('/admin');
    }
    // If user is authenticated and has a profile, redirect to dashboard
    else if (status === 'authenticated' && session?.profileId) {
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
