import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * API route to fetch a profile by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Authenticate request
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const accessToken = token.accessToken as string;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'No access token available' },
        { status: 401 }
      );
    }

    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/profiles/${profileId}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
