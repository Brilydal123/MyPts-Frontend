import { NextRequest, NextResponse } from 'next/server';
import AUTH_CONFIG from '@/lib/auth/auth-config';

/**
 * POST /api/auth/direct-login
 *
 * Direct login endpoint that communicates with the backend API
 * This bypasses NextAuth for initial login to get tokens directly from the backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get the backend API URL
    const apiUrl = AUTH_CONFIG.api.baseUrl;

    // Call the backend login endpoint
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    // Get the response data
    const data = await response.json();

    // If login failed, return the error
    if (!response.ok || !data.success) {
      console.error('Login failed:', data.message || response.statusText);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Login failed'
        },
        { status: response.status }
      );
    }

    // Check if user is admin
    const isAdmin = data.user?.role === 'admin' || data.user?.isAdmin === true;

    // Create the response with the tokens and admin status
    const jsonResponse = NextResponse.json({
      success: true,
      user: data.user,
      message: 'Login successful',
      tokens: data.tokens,
      isAdmin,
    });

    // Set admin status in cookies if user is admin
    if (isAdmin) {
      jsonResponse.cookies.set('isAdmin', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: rememberMe ? AUTH_CONFIG.tokens.refreshToken.maxAge : 2592000 // 30 days or configured time
      });

      jsonResponse.cookies.set('userRole', 'admin', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: rememberMe ? AUTH_CONFIG.tokens.refreshToken.maxAge : 2592000 // 30 days or configured time
      });
    }

    // Set the tokens in cookies
    if (data.tokens) {
      // Set HTTP-only cookies for security
      jsonResponse.cookies.set('accessToken', data.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: rememberMe ? AUTH_CONFIG.tokens.accessToken.maxAge : 3600 // 1 hour or configured time
      });

      jsonResponse.cookies.set('refreshToken', data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: rememberMe ? AUTH_CONFIG.tokens.refreshToken.maxAge : 2592000 // 30 days or configured time
      });

      // Set non-httpOnly version for client-side access
      jsonResponse.cookies.set('client-accessToken', data.tokens.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: rememberMe ? AUTH_CONFIG.tokens.accessToken.maxAge : 3600 // 1 hour or configured time
      });

      // Also set NextAuth compatible cookie for better integration
      jsonResponse.cookies.set('__Secure-next-auth.session-token', data.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: rememberMe ? AUTH_CONFIG.tokens.accessToken.maxAge : 3600 // 1 hour or configured time
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error in direct-login route:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
