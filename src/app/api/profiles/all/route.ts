import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // Check if user is authenticated and is an admin
    if (!token || !token.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get the access token from the token
    const accessToken = token.accessToken as string;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'No access token available' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Call the backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/profiles/all${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profiles',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
