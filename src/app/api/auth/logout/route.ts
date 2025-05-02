import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  console.log('Server-side logout API called');

  // Get all cookies to clear them
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log('All cookies found:', allCookies.map((c: { name: any; }) => c.name));

  // Create a response with cleared cookies
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear all cookies found in the cookie store
  allCookies.forEach(cookie => {
    response.cookies.set(cookie.name, '', {
      expires: new Date(0),
      path: '/'
    });
  });

  // Specifically target NextAuth.js cookies with different security prefixes
  [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.pkce.code_verifier',
    'next-auth.pkce.state'
  ].forEach((name) => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/'
    });
  });

  // Specifically target our custom cookies
  [
    'accesstoken', 'refreshtoken', 'accessToken', 'refreshToken',
    'profileId', 'profileToken', 'selectedProfileId', 'selectedProfileToken',
    'user-id', 'userId', 'user', 'session'
  ].forEach((name) => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/'
    });
  });

  // Extra aggressive clearing for profile-related cookies with different case variations
  [
    'profileId', 'ProfileId', 'PROFILEID', 'profileid',
    'profileToken', 'ProfileToken', 'PROFILETOKEN', 'profiletoken',
    'profile_id', 'profile_token'
  ].forEach((name) => {
    // Try with different paths
    ['/', '/dashboard', '/select-profile', '/api', ''].forEach(path => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path
      });

      // Also try with secure flag
      response.cookies.set(name, '', {
        expires: new Date(0),
        path,
        secure: true
      });
    });
  });

  // Also try with different domains and paths
  const domains = [undefined, 'localhost', '.localhost'];
  const paths = ['/', '/api', '', '/dashboard', '/select-profile', '/login'];

  // Try different combinations for the most important cookies
  domains.forEach(domain => {
    paths.forEach(path => {
      // NextAuth cookies
      [
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.callback-url',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ].forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path,
          ...(domain ? { domain } : {})
        });
      });

      // Custom cookies
      [
        'accesstoken', 'refreshtoken', 'accessToken', 'refreshToken',
        'profileId', 'profileToken', 'selectedProfileId', 'selectedProfileToken',
        'user-id', 'userId'
      ].forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path,
          ...(domain ? { domain } : {})
        });
      });

      // Extra profile-related cookies with different case variations
      [
        'profileId', 'ProfileId', 'PROFILEID', 'profileid',
        'profileToken', 'ProfileToken', 'PROFILETOKEN', 'profiletoken',
        'profile_id', 'profile_token'
      ].forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path,
          ...(domain ? { domain } : {})
        });

        // Also try with secure flag
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path,
          secure: true,
          ...(domain ? { domain } : {})
        });
      });
    });
  });

  // Also try to clear cookies with secure flag
  [
    'next-auth.session-token',
    'accesstoken',
    'refreshtoken'
  ].forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      secure: true
    });
  });

  // Call the backend logout API to invalidate the session server-side
  try {
    const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api';
    await fetch(`${BACKEND_URL}/auth/logout-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    console.log('Backend logout API called successfully');
  } catch (error) {
    console.error('Error calling backend logout API:', error);
  }

  console.log('Server-side logout completed');
  return response;
}

export async function POST() {
  return GET();
}
