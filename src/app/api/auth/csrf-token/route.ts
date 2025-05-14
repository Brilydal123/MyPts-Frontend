import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateCsrfToken } from '@/lib/auth/csrf-protection';
import AUTH_CONFIG from '@/lib/auth/auth-config';

/**
 * GET /api/auth/csrf-token
 *
 * Generates a new CSRF token and sets it in a cookie
 * Returns the token for client-side use
 */
export async function GET() {
  try {
    // Generate a new CSRF token
    const csrfToken = generateCsrfToken();

    // Create the response
    const response = NextResponse.json({
      success: true,
      csrfToken
    });

    // Set the token in a cookie
    response.cookies.set(AUTH_CONFIG.csrf.cookieName, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: AUTH_CONFIG.csrf.maxAge
    });

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/csrf-token
 *
 * Validates a CSRF token against the one stored in cookies
 */
export async function POST(request: Request) {
  try {
    // Get the token from the request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 400 }
      );
    }

    // Get the token from cookies
    const cookieStore = cookies();
    const storedToken = (await cookieStore).get(AUTH_CONFIG.csrf.cookieName)?.value;

    if (!storedToken) {
      return NextResponse.json(
        { success: false, message: 'No token found in cookies' },
        { status: 400 }
      );
    }

    // Compare the tokens
    const isValid = token === storedToken;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CSRF token is valid'
    });
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate CSRF token' },
      { status: 500 }
    );
  }
}
