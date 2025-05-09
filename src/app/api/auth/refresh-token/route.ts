// src/app/api/auth/refresh-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Try to get refresh token from multiple sources
    let refreshToken;

    // 1. Try to get from request body
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
    } catch (e) {
      console.log('No JSON body or invalid JSON in request');
    }

    // 2. If not in body, try to get from cookies
    if (!refreshToken) {
      // Get all cookies
      const cookieStore = req.cookies;
      refreshToken = cookieStore.get('refreshToken')?.value || cookieStore.get('refreshtoken')?.value;
    }

    console.log('Refresh token sources:', {
      hasToken: !!refreshToken,
      cookiesAvailable: req.cookies.getAll().map(c => c.name)
    });

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required but not found in request body or cookies' },
        { status: 400 }
      );
    }

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

      console.log('Set all cookies for token refresh');
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
