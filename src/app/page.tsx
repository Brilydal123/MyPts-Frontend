'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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

  // Show loading state while checking session with Apple-like design
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          <Image
            src="/profileblack.png"
            alt="MyProfile"
            width={80}
            height={80}
            className="mx-auto dark:hidden"
            priority
          />
          <Image
            src="/profilewhite.png"
            alt="MyProfile"
            width={80}
            height={80}
            className="mx-auto hidden dark:block"
            priority
          />
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-medium tracking-tight mb-1 text-gray-900 dark:text-white"
        >
          MyPts Manager
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm text-gray-500 dark:text-gray-400 mb-8"
        >
          Manage your virtual currency
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          <div className="w-10 h-10 mx-auto">
            <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
        </motion.div>
      </div>
    </div>
  );
}
