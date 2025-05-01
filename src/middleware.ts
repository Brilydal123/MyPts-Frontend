import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for social auth callbacks
  if (pathname.startsWith('/auth/google/callback')) {
    return NextResponse.next();
  }

  // Get various tokens
  const token = await getToken({ req: request });
  const customToken = request.cookies.get('accessToken')?.value ||
                     request.cookies.get('accesstoken')?.value;
  const nextAuthToken = request.cookies.get('next-auth.session-token')?.value ||
                       request.cookies.get('__Secure-next-auth.session-token')?.value;

  // Check if user is authenticated via either NextAuth or custom token
  const isAuthenticated = !!token || !!customToken || !!nextAuthToken;

  // Log authentication status for debugging
  console.log('Auth check (middleware):', {
    path: pathname,
    hasNextAuthToken: !!token,
    hasCustomToken: !!customToken,
    isAuthenticated
  });

  // Let the client handle auth redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/buy/:path*',
    '/sell/:path*',
    '/donate/:path*',
    '/transactions/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
