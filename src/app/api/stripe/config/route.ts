import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Forward the request to the backend API
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
      const url = `${backendUrl}/stripe/config`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Backend API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (apiError) {
      console.error('Error calling backend API:', apiError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch data from backend' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in Stripe config API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
