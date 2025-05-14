import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import AUTH_CONFIG from '@/lib/auth/auth-config';

/**
 * API route to generate a profile-specific token
 * This endpoint creates a token that only contains the profileId and is specifically
 * for profile-level operations, separate from the user authentication token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const profileId =  (await params).profileId;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Get access token from cookies or authorization header
    const cookieStore = cookies();
    const accessTokenFromCookie =
      (await cookieStore).get('accessToken')?.value ||
      (await cookieStore).get('client-accessToken')?.value;

    // Get the authorization header as a fallback
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.split(' ')[1];

    // Use the token from cookie or header
    const token = accessTokenFromCookie || tokenFromHeader;

    // If no session and no token, return unauthorized
    if (!session?.user && !token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to get a profile token from the backend first
    if (token) {
      try {
        // Get the backend API URL
        const apiUrl = AUTH_CONFIG.api.baseUrl;

        // Call the backend API to get a profile token
        const response = await fetch(`${apiUrl}/profiles/p/${profileId}/token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // If the request was successful, use the token from the backend
        if (response.ok) {
          const data = await response.json();

          if (data.success && (data.profileToken || data.token)) {
            // Create the response with the profile token
            const jsonResponse = NextResponse.json({
              success: true,
              profileToken: data.profileToken || data.token,
              profileId: profileId,
              source: 'backend'
            });

            // Set the profile token in cookies
            const profileToken = data.profileToken || data.token;

            // Set cookies for the profile token
            jsonResponse.cookies.set('selectedProfileToken', profileToken, {
              httpOnly: false,
              secure: AUTH_CONFIG.tokens.profileToken.secure,
              sameSite: AUTH_CONFIG.tokens.profileToken.sameSite,
              path: '/',
              maxAge: AUTH_CONFIG.tokens.profileToken.maxAge
            });

            jsonResponse.cookies.set('selectedProfileId', profileId, {
              httpOnly: false,
              secure: AUTH_CONFIG.tokens.profileToken.secure,
              sameSite: AUTH_CONFIG.tokens.profileToken.sameSite,
              path: '/',
              maxAge: AUTH_CONFIG.tokens.profileToken.maxAge
            });

            return jsonResponse;
          }
        }
      } catch (error) {
        console.error('Error getting profile token from backend:', error);
        // Continue to fallback method
      }
    }

    // Fallback: Create a JWT token specifically for this profile
    // This token only contains the profileId and a type indicator
    const profileToken = jwt.sign(
      {
        profileId,
        type: 'profile_access'
      },
      process.env.NEXTAUTH_SECRET || AUTH_CONFIG.nextAuth.secret,
      {
        expiresIn: '30d' // Profile tokens can have a longer expiry
      }
    );

    // Return the profile token
    const jsonResponse = NextResponse.json({
      success: true,
      profileToken,
      profileId,
      source: 'local'
    });

    // Set cookies for the profile token
    jsonResponse.cookies.set('selectedProfileToken', profileToken, {
      httpOnly: false,
      secure: AUTH_CONFIG.tokens.profileToken.secure,
      sameSite: AUTH_CONFIG.tokens.profileToken.sameSite,
      path: '/',
      maxAge: AUTH_CONFIG.tokens.profileToken.maxAge
    });

    jsonResponse.cookies.set('selectedProfileId', profileId, {
      httpOnly: false,
      secure: AUTH_CONFIG.tokens.profileToken.secure,
      sameSite: AUTH_CONFIG.tokens.profileToken.sameSite,
      path: '/',
      maxAge: AUTH_CONFIG.tokens.profileToken.maxAge
    });

    return jsonResponse;
  } catch (error) {
    console.error('Error generating profile token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate profile token' },
      { status: 500 }
    );
  }
}
