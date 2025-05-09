// src/app/api/auth/refresh-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Get the backend API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api';

    // Forward the request to the backend
    const response = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    // Create the response
    const jsonResponse = NextResponse.json(data);

    // Set cookies if tokens are provided
    if (data.success && data.tokens) {
      jsonResponse.cookies.set('accessToken', data.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 60 * 60 // 1 hour
      });

      jsonResponse.cookies.set('refreshToken', data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
