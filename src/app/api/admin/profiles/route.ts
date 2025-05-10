import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Helper function to handle successful API responses
 */
const handleSuccessResponse = async (data: any, statusCode: number) => {
  // Import the profile adapter
  const { adaptProfiles } = await import('@/lib/adapters/profile-adapter');

  console.log('Backend API response:', {
    status: statusCode,
    success: data.success,
    hasProfiles: !!data.profiles,
    profilesCount: data.profiles ? data.profiles.length : 0
  });

  // Transform the response to match the expected format for the admin profiles page
  // The admin page expects { success: true, data: { profiles: [...], pagination: {...} } }
  if (data.success && data.profiles) {
    // Adapt the profiles to a consistent format
    const adaptedProfiles = adaptProfiles(data.profiles);

    console.log(`Adapted ${adaptedProfiles.length} profiles to consistent format`);

    return NextResponse.json({
      success: true,
      data: {
        profiles: adaptedProfiles,
        pagination: data.pagination || {
          total: adaptedProfiles.length,
          pages: 1,
          page: 1,
          limit: adaptedProfiles.length
        }
      }
    }, { status: statusCode });
  }

  // Return the original response if it doesn't match the expected format
  return NextResponse.json(data, { status: statusCode });
};

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

    // Check if we're searching by ID
    const idParam = searchParams.get('id');
    if (idParam) {
      // If searching by ID, modify the query to use _id instead
      searchParams.delete('id');
      searchParams.append('_id', idParam);
    }

    const queryString = searchParams.toString();

    // Call the backend API
    // Use the correct API path for the backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/profiles/all${queryString ? `?${queryString}` : ''}`;

    console.log(`Calling backend API: ${apiUrl}`);
    console.log(`Request headers:`, {
      hasAuthHeader: !!accessToken,
      authHeaderPrefix: accessToken ? accessToken.substring(0, 20) + '...' : 'none'
    });

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies in the request
    });

    // If the API call was successful, process the response
    if (response.ok) {
      const data = await response.json();
      return handleSuccessResponse(data, response.status);
    }

    console.error(`Backend API returned error: ${response.status} ${response.statusText}`);

    // Handle error response
    return NextResponse.json(
      {
        success: false,
        message: `Backend API returned error: ${response.status} ${response.statusText}`
      },
      { status: response.status }
    );

  } catch (error) {
    console.error('Error fetching profiles:', error);

    // Provide more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    };

    console.error('Error details:', errorDetails);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profiles',
        error: errorDetails.message,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
