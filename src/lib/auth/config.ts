/**
 * Authentication Configuration
 *
 * This file contains configuration settings for the authentication system.
 */

export const AUTH_CONFIG = {
  // Token settings
  tokens: {
    accessToken: {
      cookieName: 'next-auth.session-token',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
    refreshToken: {
      cookieName: 'next-auth.refresh-token',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
    profileToken: {
      cookieName: 'next-auth.profile-token',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    },
    // Time before expiration to trigger refresh (30 minutes)
    refreshThreshold: 30 * 60 * 1000,
    // Maximum number of refresh tokens per user
    maxRefreshTokens: 3,
  },

  // Session settings
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },

  // CSRF protection
  csrf: {
    cookieName: 'next-auth.csrf-token',
    headerName: 'X-CSRF-Token',
    maxAge: 60 * 60, // 1 hour in seconds
  },

  // API endpoints
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api',
    endpoints: {
      login: '/auth/login',
      register: '/auth/register',
      refreshToken: '/auth/refresh-token',
      logout: '/auth/logout',
      logoutAll: '/auth/logout-all',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      verifyEmail: '/auth/verify-email',
      verifyOtp: '/auth/verify-otp',
      resendOtp: '/auth/resend-otp',
      me: '/users/me',
      googleAuth: '/auth/google',
    },
  },

  // NextAuth configuration
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET || 'your-secure-nextauth-secret-key',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3001',
  },

  // Social authentication
  social: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  // Public routes that don't require authentication
  publicRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/error',
    '/verify-email',
  ],

  // Routes that require authentication but shouldn't redirect to dashboard
  authRequiredButPublicRoutes: [
    '/complete-profile',
    '/select-profile',
  ],

  // Routes
  routes: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    dashboard: '/dashboard',
    admin: '/admin',
    selectProfile: '/select-profile',
    completeProfile: '/complete-profile',
    authError: '/auth/error',
  }
};

export default AUTH_CONFIG;
