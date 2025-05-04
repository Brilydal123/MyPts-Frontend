import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the transaction ID from the URL
    const { id } = await params;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profileId') || session.profileId;

    if (!profileId) {
      console.warn('No profile ID provided for transaction fetch');
      return NextResponse.json(
        {
          success: false,
          message: 'Profile ID is required',
          error: 'NO_PROFILE_SELECTED'
        },
        { status: 400 }
      );
    }

    // Call the backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/mypts/transactions/${id}?profileId=${profileId}`;

    console.log(`Fetching transaction from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching to prevent stale data
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
