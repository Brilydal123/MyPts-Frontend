import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import AUTH_CONFIG from '@/lib/auth/config';

/**
 * POST /api/auth/refresh
 *
 * Refreshes the access token using the refresh token from cookies
 */
export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const cookieStore = cookies();
    const refreshToken = (await cookieStore).get(AUTH_CONFIG.tokens.refreshToken.cookieName)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Call the backend API to refresh the token
    const response = await fetch(`${AUTH_CONFIG.api.baseUrl}${AUTH_CONFIG.api.endpoints.refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to refresh token' },
        { status: response.status }
      );
    }

    // Create the response
    const jsonResponse = NextResponse.json({
      success: true,
      tokens: {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        profileId: data.tokens.profileId,
        profileToken: data.tokens.profileToken,
        expiresIn: data.tokens.expiresIn,
      },
    });

    // Set cookies
    jsonResponse.cookies.set(AUTH_CONFIG.tokens.accessToken.cookieName, data.tokens.accessToken, {
      httpOnly: true,
      secure: AUTH_CONFIG.tokens.accessToken.secure,
      sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
      path: '/',
      maxAge: AUTH_CONFIG.tokens.accessToken.maxAge,
    });

    if (data.tokens.refreshToken) {
      jsonResponse.cookies.set(AUTH_CONFIG.tokens.refreshToken.cookieName, data.tokens.refreshToken, {
        httpOnly: true,
        secure: AUTH_CONFIG.tokens.refreshToken.secure,
        sameSite: AUTH_CONFIG.tokens.refreshToken.sameSite,
        path: '/',
        maxAge: AUTH_CONFIG.tokens.refreshToken.maxAge,
      });
    }

    if (data.tokens.profileToken) {
      jsonResponse.cookies.set(AUTH_CONFIG.tokens.profileToken.cookieName, data.tokens.profileToken, {
        httpOnly: true,
        secure: AUTH_CONFIG.tokens.profileToken.secure,
        sameSite: AUTH_CONFIG.tokens.profileToken.sameSite,
        path: '/',
        maxAge: AUTH_CONFIG.tokens.profileToken.maxAge,
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error in token refresh:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
