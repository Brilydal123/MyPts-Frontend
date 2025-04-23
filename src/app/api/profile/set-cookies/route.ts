import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the profile data from the request
    const { profileId, profileToken } = await req.json();

    if (!profileId || !profileToken) {
      return NextResponse.json(
        { success: false, message: 'Profile ID and token are required' },
        { status: 400 }
      );
    }

    // Create a response with cookies
    const response = NextResponse.json({ success: true });
    
    // Set cookies for the profile information
    // These will be sent with subsequent requests to the backend
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

    // Also set cookies for the backend API
    response.cookies.set('X-Profile-ID', profileId, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
    });
    
    response.cookies.set('X-Profile-Token', profileToken, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('Error setting profile cookies:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set profile cookies' },
      { status: 500 }
    );
  }
}
