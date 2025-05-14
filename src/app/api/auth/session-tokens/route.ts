// src/app/api/auth/session-tokens/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import AUTH_CONFIG from '@/lib/auth/auth-config';

/**
 * GET /api/auth/session-tokens
 *
 * Returns the current session tokens
 * This is a fallback mechanism for when the NextAuth session doesn't contain tokens
 */
export async function GET(req: NextRequest) {
  try {
    // First try to get tokens from NextAuth session
    const session = await getServerSession(authOptions);

    if (session?.accessToken) {
      console.log('Returning tokens from NextAuth session');
      return NextResponse.json({
        success: true,
        tokens: {
          accessToken: session.accessToken,
          refreshToken: null, // Don't expose refresh token to client
          profileId: session.profileId,
          profileToken: session.profileToken,
        }
      });
    }

    // If no tokens in session, try to get from cookies
    const cookieStore = req.cookies;
    const accessToken =
      cookieStore.get('accessToken')?.value ||
      cookieStore.get('accesstoken')?.value ||
      cookieStore.get('client-accessToken')?.value;

    const profileId =
      cookieStore.get('profileId')?.value ||
      cookieStore.get('selectedProfileId')?.value;

    const profileToken =
      cookieStore.get('profileToken')?.value ||
      cookieStore.get('selectedProfileToken')?.value;

    if (accessToken) {
      console.log('Returning tokens from cookies');
      return NextResponse.json({
        success: true,
        tokens: {
          accessToken,
          refreshToken: null, // Don't expose refresh token to client
          profileId,
          profileToken,
        }
      });
    }

    // If still no tokens, try to get from backend
    const apiUrl = AUTH_CONFIG.api.baseUrl;

    try {
      // Try to get tokens from backend using cookies that might be set
      const backendResponse = await fetch(`${apiUrl}/auth/current-session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important to include cookies
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();

        if (data.success && data.tokens?.accessToken) {
          console.log('Returning tokens from backend');

          // Create response with tokens
          const response = NextResponse.json({
            success: true,
            tokens: {
              accessToken: data.tokens.accessToken,
              refreshToken: null, // Don't expose refresh token to client
              profileId: data.tokens.profileId,
              profileToken: data.tokens.profileToken,
            }
          });

          // Set cookies for future requests
          if (data.tokens.accessToken) {
            response.cookies.set('accessToken', data.tokens.accessToken, {
              httpOnly: true,
              secure: AUTH_CONFIG.tokens.accessToken.secure,
              sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
              path: '/',
              maxAge: AUTH_CONFIG.tokens.accessToken.maxAge
            });

            // Also set client-accessible version
            response.cookies.set('client-accessToken', data.tokens.accessToken, {
              httpOnly: false,
              secure: AUTH_CONFIG.tokens.accessToken.secure,
              sameSite: AUTH_CONFIG.tokens.accessToken.sameSite,
              path: '/',
              maxAge: AUTH_CONFIG.tokens.accessToken.maxAge
            });
          }

          return response;
        }
      }
    } catch (error) {
      console.error('Error fetching tokens from backend:', error);
    }

    // If we get here, no tokens were found
    return NextResponse.json({
      success: false,
      message: 'No tokens found',
    }, { status: 401 });
  } catch (error) {
    console.error('Error in session-tokens route:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred',
    }, { status: 500 });
  }
}
