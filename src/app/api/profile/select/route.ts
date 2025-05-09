import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    // Get the profile data from the request
    const { profileId, profileToken, isAdmin, role } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get the current session token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update the token with the profile information
    token.profileId = profileId;
    token.profileToken = profileToken;

    // Create a cookie with the updated token
    // This is a simplified approach - in a real app, you'd use the NextAuth session handling
    const response = NextResponse.json({ success: true });

    // Set cookies for the profile information
    response.cookies.set('profileId', profileId, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set('profileToken', profileToken, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('Error selecting profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to select profile' },
      { status: 500 }
    );
  }
}
