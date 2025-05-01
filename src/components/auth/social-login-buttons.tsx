'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'sonner';
import { socialAuthApi } from '@/lib/api/social-auth-api';

interface SocialLoginButtonsProps {
  onLoginStart?: () => void;
  onLoginComplete?: () => void;
  className?: string;
}

export function SocialLoginButtons({
  onLoginStart,
  onLoginComplete,
  className = '',
}: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Generate a random state value for CSRF protection
  const [state, setState] = useState('');

  useEffect(() => {
    // Generate a random state string when component mounts
    const randomState = Math.random().toString(36).substring(2, 15);
    setState(randomState);

    // Store the state in localStorage for verification when the callback returns
    localStorage.setItem('googleAuthState', randomState);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      if (onLoginStart) onLoginStart();

      // Get the frontend URL for the callback
      const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
      const callbackUrl = `${FRONTEND_URL}/auth/google/callback`;

      // Get the Google OAuth URL from our API
      const googleAuthUrl = socialAuthApi.getGoogleAuthUrl(callbackUrl, state);

      // Redirect to Google OAuth consent screen
      window.location.href = googleAuthUrl;

      // Note: The rest of this function won't execute due to the redirect
      // The callback handling will be done in the GoogleAuthCallback component
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed', {
        description: 'An error occurred while trying to log in with Google.',
      });
      setIsLoading(false);
      if (onLoginComplete) onLoginComplete();
    }
  };

  return (
    <div className={`flex justify-center gap-4  w-full ${className}`}>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="flex items-center justify-center w-14 h-14 rounded-full border-2 hover:bg-gray-50 transition-colors "
        title="Continue with Google"
        aria-label="Continue with Google"
      >
        <FcGoogle className="h-8 w-8 cursor-pointer" />
        <span className="sr-only">{isLoading ? 'Connecting...' : 'Continue with Google'}</span>

      </Button>

      {/* Add more social buttons here in the future */}
      {/* Example for future buttons: */}
      {/* <Button
        variant="outline"
        type="button"
        disabled={true}
        className="flex items-center justify-center w-12 h-12 rounded-full border-2 hover:bg-gray-50 transition-colors p-0 opacity-50"
        title="Continue with Facebook (Coming Soon)"
        aria-label="Continue with Facebook"
      >
        <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="sr-only">Continue with Facebook</span>
      </Button> */}

    </div>
  );
}
