import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { dateOfBirth, countryOfResidence } = await req.json();

    // Validate required fields
    if (!dateOfBirth && !countryOfResidence) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    // Get access token from cookies or headers
    const accessToken =
      req.cookies.get('accessToken')?.value ||
      req.cookies.get('accesstoken')?.value ||
      req.headers.get('Authorization')?.replace('Bearer ', '') ||
      req.headers.get('x-access-token');

    console.log('Update profile API: Token sources', {
      cookieToken: req.cookies.get('accessToken')?.value || req.cookies.get('accesstoken')?.value,
      authHeader: req.headers.get('Authorization')?.substring(0, 20) + '...',
      customHeader: req.headers.get('x-access-token')?.substring(0, 20) + '...'
    });

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call backend API to update user profile
    const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const response = await fetch(`${BACKEND_URL}/api/auth/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        dateOfBirth,
        countryOfResidence
      })
    });

    // Log the response status for debugging
    console.log(`Backend API response status: ${response.status}`);

    let data;
    try {
      data = await response.json();
      console.log('Backend API response data:', data);
    } catch (parseError) {
      console.error('Error parsing response JSON:', parseError);
      return NextResponse.json(
        { success: false, message: `Failed to parse response: ${response.statusText}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Backend API error:', { status: response.status, data });
      return NextResponse.json(
        { success: false, message: data.message || `Failed to update profile: ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: data.user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
