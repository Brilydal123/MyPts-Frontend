import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

/**
 * API route to generate a profile-specific token
 * This endpoint creates a token that only contains the profileId and is specifically
 * for profile-level operations, separate from the user authentication token
 */
export async function GET(
  request,
   params
) {
  try {
    const profileId = params.profileId;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    // Get the authorization header as a fallback
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    // If no session and no token, return unauthorized
    if (!session?.user && !token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user has access to this profile
    // In a real implementation, you would check if the user owns this profile
    // For now, we'll just generate a token

    // Create a JWT token specifically for this profile
    // This token only contains the profileId and a type indicator
    const profileToken = jwt.sign(
      {
        profileId,
        type: 'profile_access'
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      {
        expiresIn: '30d' // Profile tokens can have a longer expiry
      }
    );

    // Return the profile token
    return NextResponse.json({
      success: true,
      profileToken
    });
  } catch (error) {
    console.error('Error generating profile token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate profile token' },
      { status: 500 }
    );
  }
}
