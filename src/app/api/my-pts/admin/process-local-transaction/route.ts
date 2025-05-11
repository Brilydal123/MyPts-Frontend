import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { transactionId, paymentReference, adminNotes } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    if (!paymentReference) {
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Call the backend API - use the process-sell endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/my-pts/admin/process-sell`;
    console.log('Processing local transaction:', transactionId);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        paymentReference,
        notes: adminNotes
      }),
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error processing local transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process local transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
