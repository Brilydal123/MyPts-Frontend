import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    console.log('Local transactions API route called');

    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    console.log('Token retrieved:', token ? 'Yes' : 'No', 'isAdmin:', token?.isAdmin);

    // Check if user is authenticated and is an admin
    if (!token || !token.isAdmin) {
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
    const searchParams = new URLSearchParams(request.nextUrl.search);

    // Add filter for local payment methods if not already present
    if (!searchParams.has('paymentMethod')) {
      // Filter for local payment methods (you may need to adjust these based on your system)
      searchParams.append('paymentMethod', 'mobile_money,pakistani_local,local');
    }

    // Build the query string
    const queryString = searchParams.toString();

    // Call the backend API - use the regular transactions endpoint with filters
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/my-pts/admin/transactions?${queryString}`;
    console.log('Calling API URL for local transactions:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to parse response from backend',
          error: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.log('Response status:', response.status);

    // Filter the transactions to only include those with local payment methods
    if (data.success && data.data && data.data.transactions) {
      const localTransactions = data.data.transactions.filter((transaction: any) => {
        const paymentMethod = transaction.metadata?.paymentMethod;
        return paymentMethod === 'mobile_money' ||
               paymentMethod === 'pakistani_local' ||
               paymentMethod === 'local';
      });

      console.log(`Filtered ${data.data.transactions.length} transactions to ${localTransactions.length} local transactions`);

      // Return the filtered transactions
      return NextResponse.json({
        success: true,
        data: localTransactions
      });
    }

    // Return the response as is if we couldn't filter
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching local transactions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch local transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
