import { NextRequest, NextResponse } from 'next/server';
import AUTH_CONFIG from '@/lib/auth/config';

/**
 * POST /api/auth/reset-password
 * 
 * Resets the user's password using a token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Call the backend API to reset the password
    const response = await fetch(`${AUTH_CONFIG.api.baseUrl}${AUTH_CONFIG.api.endpoints.resetPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to reset password' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error in password reset:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
