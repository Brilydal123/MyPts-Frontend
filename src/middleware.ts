import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected route
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/buy') ||
    pathname.startsWith('/sell') ||
    pathname.startsWith('/donate') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/settings');

  // Check if the path is an admin route
  const isAdminRoute = pathname.startsWith('/admin');

  // Check if the path is an auth route
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Check if this is a social auth callback route
  const isSocialAuthCallback = pathname.startsWith('/auth/google/callback');

  // Skip middleware for social auth callbacks
  if (isSocialAuthCallback) {
    return NextResponse.next();
  }

  // Get the token from NextAuth
  const token = await getToken({ req: request });

  // Check for custom token in cookies (for social auth)
  const customToken = request.cookies.get('accessToken')?.value ||
                      request.cookies.get('accesstoken')?.value;

  // Check for NextAuth session token
  const nextAuthToken = request.cookies.get('next-auth.session-token')?.value ||
                        request.cookies.get('__Secure-next-auth.session-token')?.value;

  // Check if user is authenticated via either NextAuth or custom token
  const isAuthenticated = !!token || !!customToken || !!nextAuthToken;

  // For debugging, log all cookies
  console.log('All cookies in middleware:',
    Object.fromEntries(
      request.cookies.getAll().map(c => [c.name, c.value ? 'present' : 'empty'])
    )
  );

  // Log authentication status for debugging
  console.log('Auth check (middleware):', {
    path: pathname,
    hasNextAuthToken: !!token,
    hasCustomToken: !!customToken,
    isAuthenticated
  });

  // If the user is not authenticated and trying to access a protected route
  if (!isAuthenticated && isProtectedRoute) {
    console.log('Redirecting to login: Not authenticated for protected route');
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If the user is not an admin and trying to access an admin route
  // For now, we'll only check NextAuth token for admin status
  if (token && isAdminRoute && !token.isAdmin) {
    console.log('Redirecting to dashboard: Not admin for admin route');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check for a special logout flag in the URL
  const isLoggingOut = request.nextUrl.searchParams.has('logout');

  // If the user is authenticated and trying to access an auth route
  if (isAuthenticated && isAuthRoute && !isLoggingOut) {
    // Check if this is a fresh request (not a redirect after logout)
    const referer = request.headers.get('referer') || '';
    const isPostLogout = referer.includes('/api/auth/logout') ||
                         referer.includes('/api/auth/signout') ||
                         referer.includes('?logout=true');

    if (!isPostLogout) {
      console.log('Redirecting to dashboard: Already authenticated for auth route');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      console.log('Allowing access to auth route after logout attempt');
      return NextResponse.next();
    }
  }

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
