import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Check if user is authenticated
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
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
    const profileId = searchParams.get('profileId');
    
    if (!profileId) {
      return NextResponse.json(
        { success: false, message: 'Profile ID is required' },
        { status: 400 }
      );
    }
    
    // Call the backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/mypts/balance?profileId=${profileId}`;
    
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
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch balance',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
