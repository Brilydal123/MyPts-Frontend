// src/app/api/auth/frontend-refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/frontend-refresh
 * 
 * Refreshes the access token using the refresh token from cookies
 * This endpoint is designed to be called from the client-side
 * It reads the refresh token from cookies and returns a new access token
 */
export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const cookieStore = req.cookies;
    const refreshToken = 
      cookieStore.get('refreshToken')?.value || 
      cookieStore.get('refreshtoken')?.value;

    console.log('Frontend refresh token sources:', {
      hasToken: !!refreshToken,
      cookiesAvailable: req.cookies.getAll().map(c => c.name)
    });

    if (!refreshToken) {
      // If no refresh token in cookies, try to get from localStorage via request headers
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Use the token from Authorization header as a fallback refresh token
        const tokenFromHeader = authHeader.substring(7);
        
        // Call the regular refresh endpoint with this token
        return await refreshWithToken(tokenFromHeader);
      }
      
      return NextResponse.json(
        { success: false, message: 'No refresh token found in cookies or headers' },
        { status: 400 }
      );
    }

    return await refreshWithToken(refreshToken);
  } catch (error) {
    console.error('Error in frontend-refresh:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to refresh the token with the backend
 */
async function refreshWithToken(refreshToken: string) {
  // Get the backend API URL from environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api';

  // Forward the request to the backend
  const response = await fetch(`${apiUrl}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  // Create the response
  const jsonResponse = NextResponse.json(data);

  // Set cookies if tokens are provided
  if (data.success && data.tokens) {
    // Set both camelCase and lowercase versions for better compatibility
    // Access token (httpOnly for security)
    jsonResponse.cookies.set('accessToken', data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    // Lowercase version
    jsonResponse.cookies.set('accesstoken', data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    // Refresh token (httpOnly for security)
    jsonResponse.cookies.set('refreshToken', data.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Lowercase version
    jsonResponse.cookies.set('refreshtoken', data.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Also set NextAuth compatible cookie for better integration
    jsonResponse.cookies.set('__Secure-next-auth.session-token', data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    // Set non-httpOnly versions for client-side access (needed for some client-side operations)
    jsonResponse.cookies.set('client-accessToken', data.tokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    console.log('Set all cookies for frontend token refresh');
  }

  return jsonResponse;
}
