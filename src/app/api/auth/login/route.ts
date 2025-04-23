import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    // Simple validation
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication - in a real app, you would validate against your database
    if (identifier === 'test@example.com' && password === 'password') {
      // Mock user data
      const userData = {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        isAdmin: false,
        profileId: 'profile_123'
      };

      return NextResponse.json({
        success: true,
        user: userData,
        token: 'mock_access_token',
        profileToken: 'mock_profile_token',
        message: 'Login successful'
      });
    }

    // Authentication failed
    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
