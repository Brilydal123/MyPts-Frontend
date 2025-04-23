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

  // Get the token
  const token = await getToken({ req: request });
  
  // If the user is not authenticated and trying to access a protected route
  if (!token && isProtectedRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // If the user is not an admin and trying to access an admin route
  if (token && isAdminRoute && !token.isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is authenticated and trying to access an auth route
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
