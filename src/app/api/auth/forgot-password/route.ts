import { NextRequest, NextResponse } from 'next/server';
import AUTH_CONFIG from '@/lib/auth/config';

/**
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset email to the user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Call the backend API to send a password reset email
    const response = await fetch(`${AUTH_CONFIG.api.baseUrl}${AUTH_CONFIG.api.endpoints.forgotPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    // For security reasons, always return a success message even if the email doesn't exist
    // This prevents user enumeration attacks
    if (!response.ok) {
      console.error('Error in forgot password:', data.message || response.statusText);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { 
        success: true, // Still return success for security
        message: 'If an account exists with this email, a password reset link has been sent.' 
      },
      { status: 200 }
    );
  }
}
