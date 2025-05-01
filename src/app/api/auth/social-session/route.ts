import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to set up a session for social authentication
 * This is used to bridge the gap between social auth and NextAuth
 */
export async function POST(req: NextRequest) {
  try {
    const { token, user } = await req.json();

    if (!token || !user) {
      return NextResponse.json(
        { error: 'Missing token or user data' },
        { status: 400 }
      );
    }

    // Create a response with the session data
    const response = NextResponse.json(
      { success: true, message: 'Session created successfully' },
      { status: 200 }
    );

    // Set cookies that NextAuth would normally set
    // These cookies will be used by the getSession() function
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Also set a cookie with the user ID for easier access
    response.cookies.set('user-id', user.id, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Error creating social auth session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
