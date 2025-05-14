'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthContextType, AuthState, User } from '@/lib/auth/types';
import AUTH_CONFIG from '@/lib/auth/config';
import { deleteCookie } from '@/lib/auth/token-service';

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  user: null,
  error: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Update state when session changes
  useEffect(() => {
    if (status === 'loading') {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (session && session.user) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        isAdmin: !!session.user.isAdmin || session.user.role === 'admin',
        user: {
          id: session.user.id,
          name: session.user.name || undefined,
          email: session.user.email || undefined,
          role: session.user.role,
          isAdmin: session.user.isAdmin,
          profileId: session.profileId,
          hasMultipleProfiles: session.user.hasMultipleProfiles,
          image: session.user.image || undefined,
        },
        error: session.error || null,
      });
    } else {
      setState({
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false,
        user: null,
        error: null,
      });
    }
  }, [session, status]);

  // Login function
  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        identifier: email,
        password,
        rememberMe: String(rememberMe),
        redirect: false,
      });

      if (result?.error) {
        setState(prev => ({ ...prev, error: result.error }));
        toast.error('Login failed', {
          description: result.error,
        });
        return false;
      }

      // Successful login
      toast.success('Login successful', {
        description: 'Welcome back!',
      });

      // Check if there's a redirect URL in localStorage
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else {
        // Check if user is admin
        const isUserAdmin = session?.user?.isAdmin || session?.user?.role === 'admin';

        if (isUserAdmin) {
          // Admin users bypass profile selection and go directly to admin dashboard
          console.log('Admin user detected, redirecting to admin dashboard');
          router.push(AUTH_CONFIG.routes.admin);
        } else if (session?.user?.hasMultipleProfiles) {
          // Regular users with multiple profiles go to profile selection
          router.push(AUTH_CONFIG.routes.selectProfile);
        } else {
          // Regular users with single profile go to dashboard
          router.push(AUTH_CONFIG.routes.dashboard);
        }
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }));
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call the backend logout endpoint to invalidate the refresh token
      if (state.isAuthenticated && session?.accessToken) {
        try {
          await fetch(`${AUTH_CONFIG.api.baseUrl}${AUTH_CONFIG.api.endpoints.logout}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.accessToken}`,
            },
            credentials: 'include',
          });
        } catch (error) {
          console.error('Error calling backend logout:', error);
          // Continue with local logout even if backend logout fails
        }
      }

      // Clear all cookies
      const cookiesToClear = [
        AUTH_CONFIG.tokens.accessToken.cookieName,
        AUTH_CONFIG.tokens.refreshToken.cookieName,
        AUTH_CONFIG.tokens.profileToken.cookieName,
        'next-auth.callback-url',
        'next-auth.csrf-token',
        'selectedProfileId',
        'profileId',
        'accessToken',
        'refreshToken',
        'profileToken',
        'isAdmin',
        'userRole',
      ];

      cookiesToClear.forEach(cookieName => {
        deleteCookie(cookieName);
        deleteCookie(cookieName, { path: '/' });
        deleteCookie(cookieName, { path: '/', domain: window.location.hostname });
        deleteCookie(cookieName, {
          path: '/',
          domain: window.location.hostname,
          secure: true,
          sameSite: 'none'
        });
      });

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedProfileId');
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('profileToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userRole');
      }

      // Sign out from NextAuth
      await signOut({ redirect: false });

      // Reset state
      setState({
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false,
        user: null,
        error: null,
      });

      // Redirect to login page
      router.push(`${AUTH_CONFIG.routes.login}?logout=true`);

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed', {
        description: 'An error occurred during logout. Please try again.',
      });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      // This is handled automatically by NextAuth.js
      // We just need to trigger a session refresh
      await fetch('/api/auth/session');
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Update user function
  const updateUser = (userData: Partial<User>): void => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
