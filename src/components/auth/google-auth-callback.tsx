'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { socialAuthApi } from '@/lib/api/social-auth-api';
import { myPtsApi, myPtsValueApi, myPtsHubApi } from '@/lib/api/mypts-api';

export function GoogleAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your Google login...');

  useEffect(() => {
    const processGoogleAuth = async () => {
      try {
        // Check if this is a redirect from the backend with success or error
        const success = searchParams?.get('success');
        const token = searchParams?.get('token');
        const error = searchParams?.get('error');
        const provider = searchParams?.get('provider');

        // Check for error first
        if (error) {
          console.error('Authentication error:', error);
          setStatus('error');
          setMessage(error);

          // Redirect back to login after showing error
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // Check for successful authentication with token
        if (success === 'true' && token) {
          console.log('Successfully authenticated with', provider || 'Google');

          // Store the token
          localStorage.setItem('accessToken', token);

          // Create a default profile if none exists
          try {
            // Get user data from the token
            const userData = await socialAuthApi.getCurrentUser();
            console.log('User data:', userData);

            // Store the user's profile ID if available
            if (userData?.user?.id) {
              // Don't set the profile ID here - it will be set in the profile selection page
              // Just log the available profiles for debugging
              const availableProfiles = userData.user.profiles || [];

              // Log all relevant data for debugging
              console.log('Authentication data:', {
                userId: userData.user.id,
                availableProfiles: availableProfiles,
                token: token ? token.substring(0, 10) + '...' : null
              });

              // Set the access token and user data in localStorage
              localStorage.setItem('accessToken', token);

              // Set additional auth-related items that the app might be checking for
              localStorage.setItem('auth_token', token);
              localStorage.setItem('user', JSON.stringify(userData.user));

              // Set up a proper session using our API route
              try {
                const sessionResponse = await fetch('/api/auth/social-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    token,
                    user: userData.user
                  }),
                  credentials: 'include',
                });

                if (sessionResponse.ok) {
                  console.log('Session created successfully');
                } else {
                  console.error('Failed to create session:', await sessionResponse.json());
                }
              } catch (sessionError) {
                console.error('Error creating session:', sessionError);
              }

              // Set the token in the API clients
              myPtsApi.setToken(token);
              myPtsValueApi.setToken(token);
              myPtsHubApi.setToken(token);
            }
          } catch (profileError) {
            console.error('Error getting user profile:', profileError);
          }

          setStatus('success');
          setMessage(`Successfully authenticated with ${provider || 'Google'}`);

          // Redirect to profile selection page instead of dashboard
          setTimeout(() => {
            router.push('/select-profile');
          }, 1500);
          return;
        }

        // If we get here, we have a code from Google but no success/error from our backend
        const code = searchParams?.get('code');
        const state = searchParams?.get('state');

        if (code) {
          // We have a code from Google
          console.log('Received authorization code from Google');

          // Verify the state parameter to prevent CSRF attacks
          const storedState = localStorage.getItem('googleAuthState');
          if (state && storedState && state !== storedState) {
            setStatus('error');
            setMessage('Invalid state parameter. This could be a CSRF attack attempt.');
            return;
          }

          // Clear the state from localStorage
          localStorage.removeItem('googleAuthState');

          // Show loading state while we wait for the backend to process the code
          // The backend should redirect us back to this page with success=true or error
          setStatus('loading');
          setMessage('Processing your Google login...');

          // If the backend doesn't redirect us within 5 seconds, try to exchange the code ourselves
          const timeoutId = setTimeout(async () => {
            try {
              // Get the frontend URL that was used for the callback
              const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
              const callbackUrl = `${FRONTEND_URL}/auth/google/callback`;

              // Exchange the code for tokens using our API
              // Ensure state is string or undefined, not null
              const data = await socialAuthApi.exchangeGoogleCode(code, callbackUrl, state ?? undefined);

              // If we have a token in the response, store it
              if (data.token) {
                localStorage.setItem('accessToken', data.token);

                // Try to get user data
                try {
                  const userData = await socialAuthApi.getCurrentUser();
                  console.log('User data:', userData);

                  // Store the user's profile ID if available
                  if (userData?.user?.id) {
                    // Don't set the profile ID here - it will be set in the profile selection page
                    // Just log the available profiles for debugging
                    const availableProfiles = userData.user.profiles || [];

                    // Log all relevant data for debugging
                    console.log('Authentication data (code exchange):', {
                      userId: userData.user.id,
                      availableProfiles: availableProfiles,
                      token: data.token ? data.token.substring(0, 10) + '...' : null
                    });

                    // Set the access token and user data in localStorage
                    localStorage.setItem('accessToken', data.token);

                    // Set additional auth-related items that the app might be checking for
                    localStorage.setItem('auth_token', data.token);
                    localStorage.setItem('user', JSON.stringify(userData.user));

                    // Set up a proper session using our API route
                    try {
                      const sessionResponse = await fetch('/api/auth/social-session', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          token: data.token,
                          user: userData.user
                        }),
                        credentials: 'include',
                      });

                      if (sessionResponse.ok) {
                        console.log('Session created successfully');
                      } else {
                        console.error('Failed to create session:', await sessionResponse.json());
                      }
                    } catch (sessionError) {
                      console.error('Error creating session:', sessionError);
                    }

                    // Set the token in the API clients
                    myPtsApi.setToken(data.token);
                    myPtsValueApi.setToken(data.token);
                    myPtsHubApi.setToken(data.token);
                  }
                } catch (profileError) {
                  console.error('Error getting user profile:', profileError);
                }
              }

              setStatus('success');
              setMessage('Successfully authenticated with Google');

              // Redirect to profile selection page instead of dashboard
              setTimeout(() => {
                router.push('/select-profile');
              }, 1500);
            } catch (exchangeError) {
              console.error('Error exchanging code:', exchangeError);
              setStatus('error');
              setMessage(exchangeError instanceof Error ? exchangeError.message : 'Failed to exchange authorization code');

              // Redirect back to login after showing error
              setTimeout(() => {
                router.push('/login');
              }, 3000);
            }
          }, 5000);

          // Cleanup the timeout if the component unmounts
          return () => clearTimeout(timeoutId);
        }

        // If we get here, we don't have a code, success, or error
        // This is an unexpected state
        setStatus('error');
        setMessage('No authentication data found. Please try again.');

        // Redirect back to login after showing error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Google auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred during Google authentication');

        // Redirect back to login after showing error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    processGoogleAuth();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Google Authentication</h1>

          <div className="mt-6 space-y-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-600">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to your profile...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting back to login page...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
