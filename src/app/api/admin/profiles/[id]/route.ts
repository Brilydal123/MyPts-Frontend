import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * API route to handle operations on a specific profile by ID
 * Supports GET, PUT, and DELETE methods
 */

// GET /api/admin/profiles/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Call the backend APIs
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/profiles/p/${id}`;

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
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/profiles/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const updates = await request.json();

    // Call the backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/profiles/p/${id}`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/profiles/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get the deleteUserAccount parameter from the URL
    const url = new URL(request.url);
    const deleteUserAccount = url.searchParams.get('deleteUserAccount');

    // Build the API URL with the query parameter if it exists
    let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/profiles/p/${id}`;
    if (deleteUserAccount) {
      apiUrl += `?deleteUserAccount=${deleteUserAccount}`;
    }

    console.log(`Deleting profile with ID ${id} via ${apiUrl}${deleteUserAccount ? ' (with user account deletion)' : ''}`);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Handle case where response might not be JSON
      data = { success: response.ok };
    }

    console.log('Delete profile response:', response.status, data);

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
